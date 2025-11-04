# Icons Directory

This directory should contain the extension icons:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

## How to Generate Icons

### Option 1: Node.js Script (Recommended)
```bash
cd ..
npm install canvas
node generate-icons.js
```

### Option 2: Browser Tool
1. Open `../generate-icons.html` in your browser
2. Click "Generate All Icons"
3. Download and save the icons here

### Option 3: Create Your Own
Create three PNG files with the dimensions above and place them here.

## Temporary Development Icons

For testing purposes, you can use any PNG images with the correct dimensions. The extension will still function without proper icons, but they will appear as default Chrome extension placeholders in the browser.
