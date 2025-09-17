import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const TimezoneIndicator = GObject.registerClass(
class TimezoneIndicator extends PanelMenu.Button {
    _init(settings) {
        super._init(0.0, 'Timezone List');
        
        this._settings = settings;
        this._tooltipActor = null;
        this._updateTimeoutId = null;
        this._cycleTimeoutId = null;
        this._currentCycleIndex = 0;
        
        // Create the panel button content
        this._createPanelButton();
        
        // Create popup menu
        this._createMenu();
        
        // Connect settings changes
        this._connectSettings();
        
        // Start update timer
        this._startUpdateTimer();
        
        // Setup hover for tooltip
        this._setupTooltip();
        
        // Initial update
        this._updateDisplay();
    }
    
    _createPanelButton() {
        this._box = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });
        
        // Rocket icon
        this._icon = new St.Label({
            text: '🚀',
            style_class: 'system-status-icon',
            y_align: Clutter.ActorAlign.CENTER
        });
        this._box.add_child(this._icon);
        
        // Time label (initially hidden)
        this._timeLabel = new St.Label({
            text: '',
            style_class: 'panel-status-text',
            y_align: Clutter.ActorAlign.CENTER
        });
        this._box.add_child(this._timeLabel);
        
        this.add_child(this._box);
    }
    
    _createMenu() {
        // Menu will be populated in _updateMenu()
        this.menu.connect('open-state-changed', (menu, open) => {
            if (open) {
                this._updateMenu();
            }
        });
    }
    
    _connectSettings() {
        this._settings.connect('changed::show-text', () => this._updateDisplay());
        this._settings.connect('changed::cycle-enabled', () => this._updateDisplay());
        this._settings.connect('changed::cycle-interval', () => this._updateDisplay());
        this._settings.connect('changed::primary-timezone', () => this._updateDisplay());
        this._settings.connect('changed::timezones', () => this._updateDisplay());
    }
    
    _setupTooltip() {
        this.connect('enter-event', () => this._showTooltip());
        this.connect('leave-event', () => this._hideTooltip());
    }
    
    _startUpdateTimer() {
        if (this._updateTimeoutId) {
            GLib.source_remove(this._updateTimeoutId);
        }
        
        this._updateTimeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            60,
            () => {
                this._updateDisplay();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }
    
    _startCycleTimer() {
        if (this._cycleTimeoutId) {
            GLib.source_remove(this._cycleTimeoutId);
        }
        
        const interval = this._settings.get_int('cycle-interval');
        this._cycleTimeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            interval,
            () => {
                this._cycleToNextTimezone();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }
    
    _stopCycleTimer() {
        if (this._cycleTimeoutId) {
            GLib.source_remove(this._cycleTimeoutId);
            this._cycleTimeoutId = null;
        }
    }
    
    _cycleToNextTimezone() {
        const timezones = this._settings.get_strv('timezones');
        if (timezones.length === 0) return;
        
        this._currentCycleIndex = (this._currentCycleIndex + 1) % timezones.length;
        this._updatePanelText();
    }
    
    _updateDisplay() {
        const showText = this._settings.get_boolean('show-text');
        const cycleEnabled = this._settings.get_boolean('cycle-enabled');
        
        if (showText) {
            this._timeLabel.show();
            if (cycleEnabled) {
                this._startCycleTimer();
            } else {
                this._stopCycleTimer();
                this._currentCycleIndex = 0;
            }
            this._updatePanelText();
        } else {
            this._timeLabel.hide();
            this._stopCycleTimer();
        }
    }
    
    _updatePanelText() {
        if (!this._settings.get_boolean('show-text')) return;
        
        const timezones = this._settings.get_strv('timezones');
        const cycleEnabled = this._settings.get_boolean('cycle-enabled');
        
        let timezone;
        if (cycleEnabled && timezones.length > 0) {
            timezone = timezones[this._currentCycleIndex];
        } else {
            timezone = this._settings.get_string('primary-timezone');
        }
        
        const timeInfo = this._getTimezoneInfo(timezone);
        if (timeInfo) {
            const cityName = this._getCityName(timezone);
            this._timeLabel.text = ` ${cityName} ${timeInfo.time} (${timeInfo.offset})`;
        }
    }
    
    _updateMenu() {
        this.menu.removeAll();
        
        const timezones = this._settings.get_strv('timezones');
        
        if (timezones.length === 0) {
            const item = new PopupMenu.PopupMenuItem('No timezones configured', {
                reactive: false
            });
            this.menu.addMenuItem(item);
            return;
        }
        
        timezones.forEach(timezone => {
            const timeInfo = this._getTimezoneInfo(timezone);
            if (timeInfo) {
                const cityName = this._getCityName(timezone);
                const text = `${cityName}: ${timeInfo.time} (${timeInfo.offset})`;
                
                const item = new PopupMenu.PopupMenuItem(text);
                this.menu.addMenuItem(item);
            }
        });
    }
    
    _showTooltip() {
        if (this._tooltipActor) return;
        
        const timezones = this._settings.get_strv('timezones');
        if (timezones.length === 0) return;
        
        const tooltipText = timezones.map(timezone => {
            const timeInfo = this._getTimezoneInfo(timezone);
            if (timeInfo) {
                const cityName = this._getCityName(timezone);
                return `${cityName}: ${timeInfo.time} (${timeInfo.offset})`;
            }
            return null;
        }).filter(text => text !== null).join('\n');
        
        this._tooltipActor = new St.Label({
            text: tooltipText,
            style_class: 'timezone-tooltip',
            style: 'background-color: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;'
        });
        
        Main.layoutManager.addTopChrome(this._tooltipActor);
        
        // Wait for next frame to ensure tooltip is properly sized
        this._tooltipActor.get_parent().queue_relayout();
        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            const [stageX, stageY] = this.get_transformed_position();
            const tooltipWidth = this._tooltipActor.width;
            const tooltipHeight = this._tooltipActor.height;
            
            // Position tooltip above the button, centered horizontally
            const buttonWidth = this.width;
            this._tooltipActor.set_position(
                Math.max(0, Math.min(
                    Main.layoutManager.primaryMonitor.width - tooltipWidth,
                    stageX + (buttonWidth - tooltipWidth) / 2
                )),
                Math.max(0, stageY - tooltipHeight - 10)
            );
            return GLib.SOURCE_REMOVE;
        });
    }
    
    _hideTooltip() {
        if (this._tooltipActor) {
            Main.layoutManager.removeChrome(this._tooltipActor);
            this._tooltipActor.destroy();
            this._tooltipActor = null;
        }
    }
    
    _getTimezoneInfo(timezoneId) {
        try {
            const timezone = GLib.TimeZone.new(timezoneId);
            const now = GLib.DateTime.new_now(timezone);
            
            const time = now.format('%H:%M');
            const offsetSeconds = now.get_utc_offset() / 1000000; // Convert from microseconds
            const offsetHours = Math.floor(Math.abs(offsetSeconds) / 3600);
            const offsetMinutes = Math.floor((Math.abs(offsetSeconds) % 3600) / 60);
            const offsetSign = offsetSeconds >= 0 ? '+' : '-';
            const offset = `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
            
            return { time, offset };
        } catch (e) {
            console.error(`Error getting timezone info for ${timezoneId}: ${e}`);
            return null;
        }
    }
    
    _getCityName(timezoneId) {
        const parts = timezoneId.split('/');
        if (parts.length >= 2) {
            return parts[parts.length - 1].replace(/_/g, ' ');
        }
        return timezoneId;
    }
    
    destroy() {
        this._hideTooltip();
        
        if (this._updateTimeoutId) {
            GLib.source_remove(this._updateTimeoutId);
            this._updateTimeoutId = null;
        }
        
        if (this._cycleTimeoutId) {
            GLib.source_remove(this._cycleTimeoutId);
            this._cycleTimeoutId = null;
        }
        
        super.destroy();
    }
});

export default class TimezoneListExtension extends Extension {
    enable() {
        const settings = this.getSettings();
        this._indicator = new TimezoneIndicator(settings);
        Main.panel.addToStatusArea('timezone-list', this._indicator);
    }
    
    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}