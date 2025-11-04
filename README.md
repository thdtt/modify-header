# Modify Headers

A Chrome extension that allows users to add, modify, and delete HTTP request headers for specific websites with profile management.

## Features

- **Profile Management**: Create multiple profiles, each targeting specific websites
- **Header Modification**: Add, modify, or delete HTTP headers
- **Toggle Profiles**: Enable/disable profiles individually
- **URL Pattern Matching**: Flexible URL pattern matching for targeting specific sites
- **Privacy-Focused**: Uses Manifest V3 and declarativeNetRequest API

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `modify-header` folder
5. The extension icon should appear in your toolbar

## Usage

### Creating a Profile

1. Click the extension icon in the toolbar
2. Click "New Profile"
3. Enter a profile name (e.g., "Development API")
4. Enter a URL pattern:
   - `example.com` - matches any URL containing example.com
   - `*.example.com` - matches all subdomains of example.com
   - `https://api.example.com/*` - matches all URLs starting with this
5. Add headers:
   - **Add**: Add a new header to requests
   - **Modify**: Change an existing header value
   - **Delete**: Remove a header from requests
6. Click "Save"

### Managing Profiles

- **Enable/Disable**: Use the toggle switch on each profile
- **Edit**: Click the "Edit" button to modify a profile
- **Delete**: Click the "Delete" button to remove a profile

### Example Use Cases

#### Development Environment
**Profile**: Dev API Headers
**URL Pattern**: `localhost:3000`
**Headers**:
- Add: `X-Debug-Mode` = `true`
- Add: `Authorization` = `Bearer dev-token-123`

#### API Testing
**Profile**: Custom API Headers
**URL Pattern**: `https://api.example.com/*`
**Headers**:
- Add: `X-API-Key` = `your-api-key`
- Modify: `User-Agent` = `CustomBot/1.0`
- Delete: `Referer`

#### CORS Testing
**Profile**: CORS Headers
**URL Pattern**: `example.com`
**Headers**:
- Add: `Origin` = `https://example.com`
- Add: `Access-Control-Request-Method` = `POST`

## File Structure

```
/modify-header
├── manifest.json          # Extension configuration
├── background.js          # Service worker for managing rules
├── popup.html             # Extension popup UI
├── popup.css              # Popup styling
├── popup.js               # Popup logic and interactions
├── README.md              # This file
└── icons/
    ├── icon16.png         # 16x16 icon
    ├── icon48.png         # 48x48 icon
    └── icon128.png        # 128x128 icon
```

## Technical Details

### Permissions

- `declarativeNetRequest`: For modifying HTTP headers
- `declarativeNetRequestWithHostAccess`: For host-specific modifications
- `storage`: For saving user profiles
- `<all_urls>`: For applying rules to any website

### Storage

Profiles are stored in `chrome.storage.local` with the following structure:

```javascript
{
  profiles: [
    {
      id: "unique-id",
      name: "Profile Name",
      urlPattern: "example.com",
      enabled: true,
      headers: [
        {
          action: "add",        // "add", "modify", or "delete"
          name: "X-Custom-Header",
          value: "custom-value"
        }
      ],
      createdAt: 1234567890
    }
  ]
}
```

### URL Pattern Matching

The extension converts user-friendly URL patterns to `declarativeNetRequest` URL filters:

- `example.com` → `*://*.example.com/*`
- `https://api.example.com` → `https://api.example.com*`
- `*.example.com` → Used as-is
- Wildcards (`*`) are supported

## Limitations

- Maximum of 5000 dynamic rules (Chrome limitation)
- Header modifications apply to the main document and all resource types
- Some headers cannot be modified due to browser security restrictions (e.g., `Host`, `Cookie` in some contexts)

## Troubleshooting

### Extension not working?

1. Check if the profile is enabled (toggle switch should be green)
2. Verify the URL pattern matches the target website
3. Open Chrome DevTools > Network tab to inspect headers
4. Check the extension's service worker logs:
   - Go to `chrome://extensions/`
   - Click "service worker" under `Modify Headers`
   - Look for errors in the console

### Headers not being applied?

1. Some headers are protected by the browser and cannot be modified
2. Ensure the URL pattern correctly matches the target URL
3. Try using a more specific URL pattern
4. Disable other extensions that might interfere with headers

### Profile changes not taking effect?

- Changes are applied immediately when you save a profile
- If issues persist, try:
  1. Disable and re-enable the profile
  2. Reload the extension from `chrome://extensions/`
  3. Restart Chrome

## Development

### Modifying the Extension

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the reload icon for `Modify Headers`
4. Test your changes

### Debugging

- **Background Script**: Click "service worker" in `chrome://extensions/`
- **Popup**: Right-click the popup and select "Inspect"
- **Storage**: Use Chrome DevTools > Application > Storage > Local Storage

## Privacy

This extension:
- Does NOT collect any data
- Does NOT send data to external servers
- Stores all data locally in your browser
- Only modifies headers for websites matching your URL patterns

## License

This project is provided as-is for educational and development purposes.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Chrome's [declarativeNetRequest API documentation](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/)
3. Inspect the browser console for error messages

## Version History

### v1.0 (Current)
- Profile management with enable/disable
- Import / Export / Clone Profiles
- Add, modify, and delete headers
- URL pattern matching
- Manifest V3 compatibility
