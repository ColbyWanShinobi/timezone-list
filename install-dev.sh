#!/bin/bash

# Timezone List GNOME Shell Extension Development Installation Script
# This script creates a symlink for development purposes

EXTENSION_UUID="timezone-list@gnome-shell-extensions"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Installing Timezone List GNOME Shell Extension (Development Mode)..."
echo "Source directory: $SOURCE_DIR"
echo "Target directory: $EXTENSION_DIR"

# Remove existing installation if it exists
if [ -L "$EXTENSION_DIR" ]; then
    echo "Removing existing symlink..."
    rm "$EXTENSION_DIR"
elif [ -d "$EXTENSION_DIR" ]; then
    echo "Removing existing directory..."
    rm -rf "$EXTENSION_DIR"
fi

# Create parent directory if it doesn't exist
mkdir -p "$(dirname "$EXTENSION_DIR")"

# Create symlink
echo "Creating symlink..."
ln -sf "$SOURCE_DIR" "$EXTENSION_DIR"

if [ $? -eq 0 ]; then
    echo "Symlink created successfully"
else
    echo "Error: Failed to create symlink"
    exit 1
fi

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
echo "Development installation complete!"
echo ""
echo "Benefits of symlink installation:"
echo "- Changes to source files are immediately reflected"
echo "- No need to reinstall after each modification"
echo "- Perfect for development and testing"
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
echo "4. For development:"
echo "   - Edit files in: $SOURCE_DIR"
echo "   - Reload with: Alt+F2 → 'r' → Enter"
echo "   - Check logs with: journalctl -f -o cat /usr/bin/gnome-shell"
echo ""