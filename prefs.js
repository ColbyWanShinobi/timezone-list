import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const TimezoneRow = GObject.registerClass({
    GTypeName: 'TimezoneRow',
}, class TimezoneRow extends Adw.ActionRow {
    _init(timezone, onRemove) {
        super._init({
            title: this._getCityName(timezone),
            subtitle: `Timezone: ${timezone}`
        });
        
        this._timezone = timezone;
        this._onRemove = onRemove;
        
        const removeButton = new Gtk.Button({
            icon_name: 'user-trash-symbolic',
            css_classes: ['flat'],
            valign: Gtk.Align.CENTER
        });
        
        removeButton.connect('clicked', () => {
            this._onRemove(timezone);
        });
        
        this.add_suffix(removeButton);
    }
    
    get timezone() {
        return this._timezone;
    }
    
    _getCityName(timezoneId) {
        const parts = timezoneId.split('/');
        if (parts.length >= 2) {
            return parts[parts.length - 1].replace(/_/g, ' ');
        }
        return timezoneId;
    }
});

export default class TimezoneListExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        
        // Create main page
        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-other-symbolic'
        });
        window.add(page);
        
        // Display Options Group
        const displayGroup = new Adw.PreferencesGroup({
            title: 'Display Options',
            description: 'Configure how the timezone information is shown in the panel'
        });
        page.add(displayGroup);
        
        // Show text toggle
        const showTextRow = new Adw.SwitchRow({
            title: 'Show Time Next to Icon',
            subtitle: 'Display selected timezone time alongside the rocket icon'
        });
        settings.bind('show-text', showTextRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        displayGroup.add(showTextRow);
        
        // Primary timezone selection
        const primaryTimezoneRow = new Adw.ComboRow({
            title: 'Primary Timezone',
            subtitle: 'Timezone to display when cycling is disabled'
        });
        
        const primaryModel = new Gtk.StringList();
        primaryTimezoneRow.set_model(primaryModel);
        displayGroup.add(primaryTimezoneRow);
        
        // Cycling Options Group  
        const cyclingGroup = new Adw.PreferencesGroup({
            title: 'Cycling Options',
            description: 'Automatically rotate through timezones in the panel text'
        });
        page.add(cyclingGroup);
        
        // Enable cycling toggle
        const cycleEnabledRow = new Adw.SwitchRow({
            title: 'Cycle Through Timezones',
            subtitle: 'Automatically rotate through all configured timezones'
        });
        settings.bind('cycle-enabled', cycleEnabledRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        cyclingGroup.add(cycleEnabledRow);
        
        // Cycle interval
        const cycleIntervalRow = new Adw.SpinRow({
            title: 'Cycle Interval (seconds)',
            subtitle: 'How long each timezone is displayed before switching',
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 3600,
                step_increment: 1,
                page_increment: 10,
                value: 10
            })
        });
        settings.bind('cycle-interval', cycleIntervalRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        cyclingGroup.add(cycleIntervalRow);
        
        // Timezone Configuration Group
        const timezoneGroup = new Adw.PreferencesGroup({
            title: 'Timezone Configuration',
            description: 'Manage up to 10 timezones to display (drag to reorder)'
        });
        page.add(timezoneGroup);
        
        // Timezone list
        const timezoneListBox = new Gtk.ListBox({
            css_classes: ['boxed-list'],
            selection_mode: Gtk.SelectionMode.NONE
        });
        timezoneGroup.add(timezoneListBox);
        
        // Add timezone button
        const addTimezoneRow = new Adw.ActionRow({
            title: 'Add Timezone',
            subtitle: 'Click to add a new timezone'
        });
        
        const addButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            css_classes: ['flat'],
            valign: Gtk.Align.CENTER
        });
        
        addButton.connect('clicked', () => {
            this._showAddTimezoneDialog(window, settings, () => {
                this._updateTimezoneList(timezoneListBox, primaryTimezoneRow, primaryModel, settings);
            });
        });
        
        addTimezoneRow.add_suffix(addButton);
        timezoneGroup.add(addTimezoneRow);
        
        // Update sensitivity based on settings
        const updateSensitivity = () => {
            const showText = settings.get_boolean('show-text');
            const cycleEnabled = settings.get_boolean('cycle-enabled');
            
            primaryTimezoneRow.sensitive = showText && !cycleEnabled;
            cycleEnabledRow.sensitive = showText;
            cycleIntervalRow.sensitive = showText && cycleEnabled;
        };
        
        settings.connect('changed::show-text', updateSensitivity);
        settings.connect('changed::cycle-enabled', updateSensitivity);
        updateSensitivity();
        
        // Initialize timezone list
        this._updateTimezoneList(timezoneListBox, primaryTimezoneRow, primaryModel, settings);
    }
    
    _updateTimezoneList(listBox, primaryRow, primaryModel, settings) {
        // Clear existing rows
        let child = listBox.get_first_child();
        while (child) {
            const next = child.get_next_sibling();
            listBox.remove(child);
            child = next;
        }
        
        // Clear primary timezone model
        primaryModel.splice(0, primaryModel.get_n_items(), []);
        
        const timezones = settings.get_strv('timezones');
        const primaryTimezone = settings.get_string('primary-timezone');
        
        timezones.forEach((timezone, index) => {
            const row = new TimezoneRow(timezone, (tz) => {
                this._removeTimezone(tz, settings, () => {
                    this._updateTimezoneList(listBox, primaryRow, primaryModel, settings);
                });
            });
            
            listBox.append(row);
            
            // Add to primary timezone model
            const cityName = this._getCityName(timezone);
            primaryModel.append(`${cityName} (${timezone})`);
            
            // Set selected primary timezone
            if (timezone === primaryTimezone) {
                primaryRow.set_selected(index);
            }
        });
        
        // Connect primary timezone selection
        primaryRow.connect('notify::selected', () => {
            const selectedIndex = primaryRow.get_selected();
            if (selectedIndex !== Gtk.INVALID_LIST_POSITION && selectedIndex < timezones.length) {
                settings.set_string('primary-timezone', timezones[selectedIndex]);
            }
        });
    }
    
    _removeTimezone(timezone, settings, callback) {
        const timezones = settings.get_strv('timezones');
        const index = timezones.indexOf(timezone);
        
        if (index !== -1) {
            timezones.splice(index, 1);
            settings.set_strv('timezones', timezones);
            
            // Update primary timezone if needed
            const primaryTimezone = settings.get_string('primary-timezone');
            if (primaryTimezone === timezone && timezones.length > 0) {
                settings.set_string('primary-timezone', timezones[0]);
            }
        }
        
        callback();
    }
    
    _showAddTimezoneDialog(parent, settings, callback) {
        const dialog = new Adw.MessageDialog({
            transient_for: parent,
            modal: true,
            heading: 'Add Timezone',
            body: 'Enter a timezone identifier (e.g., America/New_York, Europe/London, Asia/Tokyo)'
        });
        
        const entry = new Gtk.Entry({
            placeholder_text: 'America/New_York',
            hexpand: true
        });
        
        const entryBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12
        });
        entryBox.append(entry);
        
        dialog.set_extra_child(entryBox);
        dialog.add_response('cancel', 'Cancel');
        dialog.add_response('add', 'Add');
        dialog.set_default_response('add');
        dialog.set_close_response('cancel');
        
        entry.connect('activate', () => {
            dialog.response('add');
        });
        
        dialog.connect('response', (dialog, response) => {
            if (response === 'add') {
                const timezone = entry.get_text().trim();
                if (timezone && this._isValidTimezone(timezone)) {
                    const timezones = settings.get_strv('timezones');
                    
                    if (timezones.length >= 10) {
                        this._showErrorDialog(parent, 'Maximum of 10 timezones allowed');
                    } else if (timezones.includes(timezone)) {
                        this._showErrorDialog(parent, 'Timezone already exists in the list');
                    } else {
                        timezones.push(timezone);
                        settings.set_strv('timezones', timezones);
                        callback();
                    }
                }
            }
            dialog.close();
        });
        
        dialog.present();
    }
    
    _isValidTimezone(timezone) {
        try {
            const tz = GLib.TimeZone.new(timezone);
            return tz !== null;
        } catch (e) {
            return false;
        }
    }
    
    _showErrorDialog(parent, message) {
        const errorDialog = new Adw.MessageDialog({
            transient_for: parent,
            modal: true,
            heading: 'Error',
            body: message
        });
        
        errorDialog.add_response('ok', 'OK');
        errorDialog.set_default_response('ok');
        errorDialog.present();
    }
    
    _getCityName(timezoneId) {
        const parts = timezoneId.split('/');
        if (parts.length >= 2) {
            return parts[parts.length - 1].replace(/_/g, ' ');
        }
        return timezoneId;
    }
}