// Popup script for Modify Headers
// Handles all UI interactions and profile management

let currentProfiles = [];
let editingProfileId = null;

// DOM Elements
const createProfileBtn = document.getElementById('createProfileBtn');
const exportProfilesBtn = document.getElementById('exportProfilesBtn');
const importProfilesBtn = document.getElementById('importProfilesBtn');
const importFileInput = document.getElementById('importFileInput');
const profileForm = document.getElementById('profileForm');
const formTitle = document.getElementById('formTitle');
const profileName = document.getElementById('profileName');
const urlPattern = document.getElementById('urlPattern');
const headersContainer = document.getElementById('headersContainer');
const addHeaderBtn = document.getElementById('addHeaderBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');
const profilesContainer = document.getElementById('profilesContainer');

// Export/Import Modal Elements
const exportModal = document.getElementById('exportModal');
const importModal = document.getElementById('importModal');
const exportProfilesList = document.getElementById('exportProfilesList');
const importProfilesList = document.getElementById('importProfilesList');
const selectAllExport = document.getElementById('selectAllExport');
const selectAllImport = document.getElementById('selectAllImport');
const confirmExportBtn = document.getElementById('confirmExportBtn');
const cancelExportBtn = document.getElementById('cancelExportBtn');
const closeExportModal = document.getElementById('closeExportModal');
const confirmImportBtn = document.getElementById('confirmImportBtn');
const cancelImportBtn = document.getElementById('cancelImportBtn');
const closeImportModal = document.getElementById('closeImportModal');

// Import state
let pendingImportData = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadProfiles();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  createProfileBtn.addEventListener('click', showCreateForm);
  exportProfilesBtn.addEventListener('click', showExportModal);
  importProfilesBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', handleImportFile);
  addHeaderBtn.addEventListener('click', addHeaderField);
  saveProfileBtn.addEventListener('click', saveProfile);
  cancelProfileBtn.addEventListener('click', hideForm);

  // Export modal listeners
  confirmExportBtn.addEventListener('click', confirmExport);
  cancelExportBtn.addEventListener('click', hideExportModal);
  closeExportModal.addEventListener('click', hideExportModal);
  selectAllExport.addEventListener('change', handleSelectAllExport);

  // Import modal listeners
  confirmImportBtn.addEventListener('click', confirmImport);
  cancelImportBtn.addEventListener('click', hideImportModal);
  closeImportModal.addEventListener('click', hideImportModal);
  selectAllImport.addEventListener('change', handleSelectAllImport);

  // Close modals when clicking outside
  exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) hideExportModal();
  });
  importModal.addEventListener('click', (e) => {
    if (e.target === importModal) hideImportModal();
  });

  // Event delegation for remove header buttons
  headersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-header-btn')) {
      e.target.closest('.header-item').remove();
    }
  });

  // Event delegation for profile card buttons
  profilesContainer.addEventListener('click', (e) => {
    const profileCard = e.target.closest('.profile-card');
    if (!profileCard) return;

    const profileId = profileCard.dataset.id;

    if (e.target.classList.contains('btn-edit')) {
      editProfile(profileId);
    } else if (e.target.classList.contains('btn-clone')) {
      cloneProfile(profileId);
    } else if (e.target.classList.contains('btn-danger')) {
      deleteProfile(profileId);
    }
  });

  // Event delegation for profile toggle switches
  profilesContainer.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox' && e.target.closest('.toggle-switch')) {
      const profileCard = e.target.closest('.profile-card');
      if (profileCard) {
        const profileId = profileCard.dataset.id;
        toggleProfile(profileId, e.target.checked);
      }
    }
  });
}

// Load profiles from storage
async function loadProfiles() {
  try {
    const data = await chrome.storage.local.get('profiles');
    currentProfiles = data.profiles || [];
    renderProfiles();
  } catch (error) {
    console.error('Error loading profiles:', error);
    showError('Failed to load profiles');
  }
}

// Render profiles list
function renderProfiles() {
  if (currentProfiles.length === 0) {
    profilesContainer.innerHTML = `
      <div class="empty-state">
        <p>No profiles yet. Create one to get started!</p>
      </div>
    `;
    return;
  }

  // Sort profiles: active (enabled) profiles first, then inactive ones
  const sortedProfiles = [...currentProfiles].sort((a, b) => {
    if (a.enabled === b.enabled) return 0;
    return a.enabled ? -1 : 1;
  });

  profilesContainer.innerHTML = sortedProfiles.map(profile => `
    <div class="profile-card ${!profile.enabled ? 'disabled' : ''}" data-id="${profile.id}">
      <div class="profile-header">
        <div class="profile-info">
          <div class="profile-name">${escapeHtml(profile.name)}</div>
          <div class="profile-url">${escapeHtml(profile.urlPattern)}</div>
        </div>
        <div class="profile-toggle">
          <label class="toggle-switch">
            <input type="checkbox" ${profile.enabled ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      ${profile.headers && profile.headers.length > 0 ? `
        <div class="profile-details">
          <div class="profile-headers-title">Headers (${profile.headers.length}):</div>
          <div class="profile-headers">
            ${profile.headers.map(header => `
              <div class="header-item-display ${header.action}">
                <div class="header-action-badge ${header.action}">
                  ${escapeHtml(header.action.toUpperCase())}
                </div>
                <div class="header-content">
                  <div class="header-name-display">
                    <span class="header-label">Header:</span>
                    <span class="header-name-value">${escapeHtml(header.name)}</span>
                  </div>
                  ${header.action !== 'delete' ? `
                    <div class="header-value-display">
                      <span class="header-label">Value:</span>
                      <span class="header-value-text">${escapeHtml(header.value || '')}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="profile-actions">
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-clone">Clone</button>
        <button class="btn btn-danger btn-small">Delete</button>
      </div>
    </div>
  `).join('');
}

// Show create profile form
function showCreateForm() {
  editingProfileId = null;
  formTitle.textContent = 'New Profile';
  profileName.value = '';
  urlPattern.value = '';
  headersContainer.innerHTML = '';
  addHeaderField(); // Add one empty header field
  profileForm.classList.remove('hidden');
  profileName.focus();
}

// Show edit profile form
function editProfile(profileId) {
  const profile = currentProfiles.find(p => p.id === profileId);
  if (!profile) return;

  editingProfileId = profileId;
  formTitle.textContent = 'Edit Profile';
  profileName.value = profile.name;
  urlPattern.value = profile.urlPattern;

  headersContainer.innerHTML = '';
  if (profile.headers && profile.headers.length > 0) {
    profile.headers.forEach(header => {
      addHeaderField(header);
    });
  } else {
    addHeaderField();
  }

  profileForm.classList.remove('hidden');
  profileName.focus();
}

// Hide form
function hideForm() {
  profileForm.classList.add('hidden');
  editingProfileId = null;
}

// Add header field
function addHeaderField(header = null) {
  const headerItem = document.createElement('div');
  headerItem.className = 'header-item';

  const action = header ? header.action : 'add';
  const name = header ? header.name : '';
  const value = header ? header.value : '';

  headerItem.innerHTML = `
    <div class="header-item-row">
      <select class="header-action">
        <option value="add" ${action === 'add' ? 'selected' : ''}>Add</option>
        <option value="modify" ${action === 'modify' ? 'selected' : ''}>Modify</option>
        <option value="delete" ${action === 'delete' ? 'selected' : ''}>Delete</option>
      </select>
      <input type="text" class="header-name" placeholder="Header name" value="${escapeHtml(name)}" required>
      <input type="text" class="header-value" placeholder="Value" value="${escapeHtml(value)}"
             ${action === 'delete' ? 'disabled' : ''}>
      <button type="button" class="remove-header-btn">×</button>
    </div>
  `;

  // Add event listener to disable value input when action is 'delete'
  const actionSelect = headerItem.querySelector('.header-action');
  const valueInput = headerItem.querySelector('.header-value');

  actionSelect.addEventListener('change', (e) => {
    if (e.target.value === 'delete') {
      valueInput.disabled = true;
      valueInput.value = '';
    } else {
      valueInput.disabled = false;
    }
  });

  headersContainer.appendChild(headerItem);
}

// Save profile
async function saveProfile() {
  const name = profileName.value.trim();
  const pattern = urlPattern.value.trim();

  if (!name) {
    alert('Please enter a profile name');
    profileName.focus();
    return;
  }

  if (!pattern) {
    alert('Please enter a URL pattern');
    urlPattern.focus();
    return;
  }

  // Collect headers
  const headers = [];
  const headerItems = headersContainer.querySelectorAll('.header-item');

  for (const item of headerItems) {
    const action = item.querySelector('.header-action').value;
    const headerName = item.querySelector('.header-name').value.trim();
    const headerValue = item.querySelector('.header-value').value.trim();

    if (!headerName) {
      alert('Please enter a header name or remove empty header fields');
      return;
    }

    if (action !== 'delete' && !headerValue) {
      alert('Please enter a value for the header or remove the field');
      return;
    }

    headers.push({
      action,
      name: headerName,
      value: headerValue
    });
  }

  if (headers.length === 0) {
    alert('Please add at least one header');
    return;
  }

  try {
    if (editingProfileId) {
      // Update existing profile
      const index = currentProfiles.findIndex(p => p.id === editingProfileId);
      if (index !== -1) {
        currentProfiles[index] = {
          ...currentProfiles[index],
          name,
          urlPattern: pattern,
          headers
        };
      }
    } else {
      // Create new profile
      const newProfile = {
        id: generateId(),
        name,
        urlPattern: pattern,
        headers,
        enabled: true,
        createdAt: Date.now()
      };
      currentProfiles.push(newProfile);
    }

    await chrome.storage.local.set({ profiles: currentProfiles });
    hideForm();
    loadProfiles();
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Failed to save profile. Please try again.');
  }
}

// Toggle profile enabled/disabled
async function toggleProfile(profileId, enabled) {
  try {
    const profile = currentProfiles.find(p => p.id === profileId);
    if (profile) {
      profile.enabled = enabled;
      await chrome.storage.local.set({ profiles: currentProfiles });
      renderProfiles();
    }
  } catch (error) {
    console.error('Error toggling profile:', error);
    showError('Failed to toggle profile');
  }
}

// Delete profile
async function deleteProfile(profileId) {
  if (!confirm('Are you sure you want to delete this profile?')) {
    return;
  }

  try {
    currentProfiles = currentProfiles.filter(p => p.id !== profileId);
    await chrome.storage.local.set({ profiles: currentProfiles });
    loadProfiles();
  } catch (error) {
    console.error('Error deleting profile:', error);
    alert('Failed to delete profile. Please try again.');
  }
}

// Clone profile
async function cloneProfile(profileId) {
  try {
    const profile = currentProfiles.find(p => p.id === profileId);
    if (!profile) return;

    // Create a new profile with cloned data
    const clonedProfile = {
      id: generateId(),
      name: `${profile.name} (Copy)`,
      urlPattern: profile.urlPattern,
      headers: JSON.parse(JSON.stringify(profile.headers)), // Deep clone headers
      enabled: false, // Start disabled by default
      createdAt: Date.now()
    };

    currentProfiles.push(clonedProfile);
    await chrome.storage.local.set({ profiles: currentProfiles });
    loadProfiles();
  } catch (error) {
    console.error('Error cloning profile:', error);
    alert('Failed to clone profile. Please try again.');
  }
}

// Show export modal
function showExportModal() {
  if (currentProfiles.length === 0) {
    alert('No profiles to export. Create some profiles first.');
    return;
  }

  // Populate profiles list
  exportProfilesList.innerHTML = currentProfiles.map(profile => `
    <label class="checkbox-label profile-checkbox">
      <input type="checkbox" class="export-checkbox" value="${profile.id}">
      <span class="profile-checkbox-content">
        <span class="profile-checkbox-name">${escapeHtml(profile.name)}</span>
        <span class="profile-checkbox-url">${escapeHtml(profile.urlPattern)}</span>
      </span>
    </label>
  `).join('');

  selectAllExport.checked = false;
  exportModal.classList.remove('hidden');
}

// Hide export modal
function hideExportModal() {
  exportModal.classList.add('hidden');
}

// Handle select all export
function handleSelectAllExport() {
  const checkboxes = exportProfilesList.querySelectorAll('.export-checkbox');
  checkboxes.forEach(cb => cb.checked = selectAllExport.checked);
}

// Confirm export
function confirmExport() {
  const selectedCheckboxes = exportProfilesList.querySelectorAll('.export-checkbox:checked');

  if (selectedCheckboxes.length === 0) {
    alert('Please select at least one profile to export.');
    return;
  }

  try {
    // Get selected profile IDs
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
    const selectedProfiles = currentProfiles.filter(p => selectedIds.includes(p.id));

    // Create export data
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      profiles: selectedProfiles
    };

    // Convert to JSON
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `modify-header-profiles-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    hideExportModal();
    console.log(`${selectedProfiles.length} profile(s) exported successfully`);
  } catch (error) {
    console.error('Error exporting profiles:', error);
    alert('Failed to export profiles. Please try again.');
  }
}

// Handle import file selection
async function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const importData = JSON.parse(text);

    // Validate import data
    if (!importData.profiles || !Array.isArray(importData.profiles)) {
      throw new Error('Invalid file format. Expected a profiles array.');
    }

    // Validate each profile
    for (const profile of importData.profiles) {
      if (!profile.name || !profile.urlPattern || !profile.headers) {
        throw new Error('Invalid profile data. Each profile must have name, urlPattern, and headers.');
      }
    }

    // Store import data and show modal
    pendingImportData = importData.profiles;
    showImportModal();
  } catch (error) {
    console.error('Error reading import file:', error);
    alert(`Failed to read import file: ${error.message}`);
  } finally {
    // Reset file input
    event.target.value = '';
  }
}

// Show import modal
function showImportModal() {
  if (!pendingImportData || pendingImportData.length === 0) {
    alert('No profiles found in import file.');
    return;
  }

  // Populate profiles list
  importProfilesList.innerHTML = pendingImportData.map((profile, index) => `
    <label class="checkbox-label profile-checkbox">
      <input type="checkbox" class="import-checkbox" value="${index}">
      <span class="profile-checkbox-content">
        <span class="profile-checkbox-name">${escapeHtml(profile.name)}</span>
        <span class="profile-checkbox-url">${escapeHtml(profile.urlPattern)}</span>
        <span class="profile-checkbox-info">${profile.headers.length} header(s)</span>
      </span>
    </label>
  `).join('');

  selectAllImport.checked = false;
  importModal.classList.remove('hidden');
}

// Hide import modal
function hideImportModal() {
  importModal.classList.add('hidden');
  pendingImportData = null;
}

// Handle select all import
function handleSelectAllImport() {
  const checkboxes = importProfilesList.querySelectorAll('.import-checkbox');
  checkboxes.forEach(cb => cb.checked = selectAllImport.checked);
}

// Confirm import
async function confirmImport() {
  const selectedCheckboxes = importProfilesList.querySelectorAll('.import-checkbox:checked');

  if (selectedCheckboxes.length === 0) {
    alert('Please select at least one profile to import.');
    return;
  }

  try {
    // Get selected profile indices
    const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
    const selectedProfiles = pendingImportData.filter((_, index) => selectedIndices.includes(index));

    // Regenerate IDs to avoid conflicts
    const newProfiles = selectedProfiles.map(profile => ({
      ...profile,
      id: generateId(),
      createdAt: Date.now(),
      enabled: false // Start disabled for safety
    }));

    // Add to existing profiles
    currentProfiles = [...currentProfiles, ...newProfiles];

    await chrome.storage.local.set({ profiles: currentProfiles });
    loadProfiles();

    hideImportModal();
    alert(`Successfully imported ${selectedProfiles.length} profile(s)!`);
  } catch (error) {
    console.error('Error importing profiles:', error);
    alert('Failed to import profiles. Please try again.');
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show error message
function showError(message) {
  // Simple error display - could be enhanced with a toast notification
  console.error(message);
  alert(message);
}
