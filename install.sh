#!/bin/bash

# Timezone List GNOME Shell Extension Installation Script

EXTENSION_UUID="timezone-list@gnome-shell-extensions"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "Installing Timezone List GNOME Shell Extension..."

# Create extension directory
mkdir -p "$EXTENSION_DIR"

# Copy extension files
cp extension.js "$EXTENSION_DIR/"
cp prefs.js "$EXTENSION_DIR/"
cp metadata.json "$EXTENSION_DIR/"
cp stylesheet.css "$EXTENSION_DIR/"
cp -r schemas "$EXTENSION_DIR/"

echo "Files copied to $EXTENSION_DIR"

# Compile GSettings schema
echo "Compiling GSettings schema..."
cd "$EXTENSION_DIR"
glib-compile-schemas schemas/

if [ $? -eq 0 ]; then
    echo "Schema compiled successfully"
else
    echo "Warning: Schema compilation failed. Extension may not work properly."
fi

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Restart GNOME Shell:"
echo "   - Press Alt+F2, type 'r' and press Enter (X11)"
echo "   - Or log out and log back in (Wayland)"
echo ""
echo "2. Enable the extension:"
echo "   gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "3. Configure the extension:"
echo "   gnome-extensions prefs $EXTENSION_UUID"
echo ""