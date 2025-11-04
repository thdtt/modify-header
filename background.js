// Background service worker for Modify Headers
// Manages declarativeNetRequest rules based on user profiles

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Modify Headers installed');
  updateRules();
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.profiles) {
    console.log('Profiles changed, updating rules');
    updateRules();
  }
});

// Main function to update declarativeNetRequest rules
async function updateRules() {
  try {
    // Get all profiles from storage
    const data = await chrome.storage.local.get('profiles');
    const profiles = data.profiles || [];

    // Filter enabled profiles
    const enabledProfiles = profiles.filter(profile => profile.enabled);

    // Get existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const existingRuleIds = existingRules.map(rule => rule.id);

    // Generate new rules
    const newRules = [];
    let ruleId = 1;

    for (const profile of enabledProfiles) {
      const rules = generateRulesForProfile(profile, ruleId);
      newRules.push(...rules);
      ruleId += rules.length;
    }

    // Update dynamic rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules
    });

    console.log(`Updated rules: ${newRules.length} rules added`);
  } catch (error) {
    console.error('Error updating rules:', error);
  }
}

// Generate declarativeNetRequest rules for a profile
function generateRulesForProfile(profile, startRuleId) {
  const rules = [];
  let ruleId = startRuleId;

  if (!profile.headers || profile.headers.length === 0) {
    return rules;
  }

  // Convert URL pattern to match pattern
  const urlFilter = convertToUrlFilter(profile.urlPattern);

  // Group headers by action type
  const addHeaders = [];
  const modifyHeaders = [];
  const removeHeaders = [];

  for (const header of profile.headers) {
    if (!header.name) continue;

    switch (header.action) {
      case 'add':
        addHeaders.push({
          header: header.name.toLowerCase(),
          operation: 'set',
          value: header.value || ''
        });
        break;
      case 'modify':
        modifyHeaders.push({
          header: header.name.toLowerCase(),
          operation: 'set',
          value: header.value || ''
        });
        break;
      case 'delete':
        removeHeaders.push({
          header: header.name.toLowerCase(),
          operation: 'remove'
        });
        break;
    }
  }

  // Create a single rule that combines all header modifications
  // We need separate rules for request and response headers

  // Request headers rule
  const requestHeaderMods = [...addHeaders, ...modifyHeaders, ...removeHeaders];
  if (requestHeaderMods.length > 0) {
    rules.push({
      id: ruleId++,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: requestHeaderMods
      },
      condition: {
        urlFilter: urlFilter,
        resourceTypes: [
          'main_frame',
          'sub_frame',
          'stylesheet',
          'script',
          'image',
          'font',
          'object',
          'xmlhttprequest',
          'ping',
          'csp_report',
          'media',
          'websocket',
          'webtransport',
          'webbundle',
          'other'
        ]
      }
    });
  }

  return rules;
}

// Convert user-friendly URL pattern to declarativeNetRequest urlFilter
function convertToUrlFilter(pattern) {
  if (!pattern) return '*';

  // If pattern is already a valid URL filter, use it
  if (pattern.includes('*') || pattern.startsWith('||')) {
    return pattern;
  }

  // If pattern looks like a domain
  if (!pattern.includes('/')) {
    return `*://*.${pattern}/*`;
  }

  // If pattern looks like a full URL
  if (pattern.startsWith('http://') || pattern.startsWith('https://')) {
    return pattern + '*';
  }

  // Default: treat as domain pattern
  return `*://*${pattern}*`;
}

// Expose updateRules for manual refresh
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateRules') {
    updateRules().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the message channel open for async response
  }
});
