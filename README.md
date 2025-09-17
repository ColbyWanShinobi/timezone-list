# Timezone List GNOME Shell Extension

A GNOME Shell extension that adds a 🚀 rocket icon to the top panel for quick access to current times in multiple timezones.

## Features

- **Panel Indicator**: Rocket emoji (🚀) icon in the system tray
- **Hover Tooltip**: Shows current times for all configured timezones
- **Click Menu**: Dropdown menu with timezone list and current times
- **Text Display**: Optional time display next to the icon
- **Cycling Mode**: Automatically rotate through timezones in panel text
- **Customizable**: Up to 10 timezones, configurable display options

## Default Timezones

The extension comes pre-configured with four AWS server region timezones:
- US East (Virginia) - America/New_York
- EU Central (Frankfurt) - Europe/Berlin  
- Asia Pacific (Singapore) - Asia/Singapore
- Australia East (Sydney) - Australia/Sydney

## Installation

1. Copy the extension files to your GNOME Shell extensions directory:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/timezone-list@gnome-shell-extensions
   cp -r * ~/.local/share/gnome-shell/extensions/timezone-list@gnome-shell-extensions/
   ```

2. Compile the GSettings schema:
   ```bash
   cd ~/.local/share/gnome-shell/extensions/timezone-list@gnome-shell-extensions
   glib-compile-schemas schemas/
   ```

3. Restart GNOME Shell:
   - Press `Alt + F2`, type `r` and press Enter (for X11)
   - Or log out and log back in (for Wayland)

4. Enable the extension:
   ```bash
   gnome-extensions enable timezone-list@gnome-shell-extensions
   ```

## Configuration

Open the extension preferences:
```bash
gnome-extensions prefs timezone-list@gnome-shell-extensions
```

### Display Options
- **Show Time Next to Icon**: Toggle text display alongside the rocket icon
- **Primary Timezone**: Select which timezone to display when cycling is off

### Cycling Options  
- **Cycle Through Timezones**: Automatically rotate through all timezones
- **Cycle Interval**: Set how long each timezone is displayed (5-3600 seconds)

### Timezone Configuration
- Add/remove up to 10 timezones
- Reorder timezones (affects cycling order)
- Uses standard IANA timezone identifiers

## Compatibility

- GNOME Shell 45, 46, 47, 48+
- Uses modern ES6 modules and GTK4/Adwaita for preferences

## Usage

1. **View All Times**: Hover over the 🚀 icon to see tooltip with all timezone times
2. **Quick Access**: Click the icon to open dropdown menu with timezone list
3. **Panel Display**: Enable text mode to show selected timezone time in panel
4. **Auto-Cycling**: Enable cycling to rotate through all timezones automatically

## File Structure

```
timezone-list@gnome-shell-extensions/
├── extension.js              # Main extension code
├── prefs.js                  # Preferences dialog
├── metadata.json             # Extension metadata
├── stylesheet.css            # Custom styling
└── schemas/
    └── org.gnome.shell.extensions.timezonelist.gschema.xml
```

## Development

The extension follows GNOME Shell extension best practices:
- Modern ES6 module syntax
- Proper cleanup in disable()
- GSettings for persistent configuration
- GTK4/Adwaita preferences UI
- Compatible with GNOME Shell 48 APIs