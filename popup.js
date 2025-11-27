// Popup script for Modify Headers
// Handles all UI interactions and profile management

let currentProfiles = [];
let editingProfileId = null;

// DOM Elements
const createProfileBtn = document.getElementById("createProfileBtn");
const exportProfilesBtn = document.getElementById("exportProfilesBtn");
const importProfilesBtn = document.getElementById("importProfilesBtn");
const importFileInput = document.getElementById("importFileInput");
const profileForm = document.getElementById("profileForm");
const formTitle = document.getElementById("formTitle");
const profileName = document.getElementById("profileName");
const urlPattern = document.getElementById("urlPattern");
const headersContainer = document.getElementById("headersContainer");
const addHeaderBtn = document.getElementById("addHeaderBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");
const profilesContainer = document.getElementById("profilesContainer");

// Export/Import Modal Elements
const exportModal = document.getElementById("exportModal");
const importModal = document.getElementById("importModal");
const exportProfilesList = document.getElementById("exportProfilesList");
const importProfilesList = document.getElementById("importProfilesList");
const selectAllExport = document.getElementById("selectAllExport");
const selectAllImport = document.getElementById("selectAllImport");
const confirmExportBtn = document.getElementById("confirmExportBtn");
const cancelExportBtn = document.getElementById("cancelExportBtn");
const closeExportModal = document.getElementById("closeExportModal");
const confirmImportBtn = document.getElementById("confirmImportBtn");
const cancelImportBtn = document.getElementById("cancelImportBtn");
const closeImportModal = document.getElementById("closeImportModal");

// Import state
let pendingImportData = null;

// Initialize popup
document.addEventListener("DOMContentLoaded", () => {
	loadProfiles();
	setupEventListeners();
	setupNavigationListeners();
	setupStorageListeners();
});

// Setup event listeners
function setupEventListeners() {
	createProfileBtn.addEventListener("click", showCreateForm);
	exportProfilesBtn.addEventListener("click", showExportModal);
	importProfilesBtn.addEventListener("click", () => importFileInput.click());
	importFileInput.addEventListener("change", handleImportFile);
	addHeaderBtn.addEventListener("click", addHeaderField);
	saveProfileBtn.addEventListener("click", saveProfile);
	cancelProfileBtn.addEventListener("click", hideForm);

	// Export modal listeners
	confirmExportBtn.addEventListener("click", confirmExport);
	cancelExportBtn.addEventListener("click", hideExportModal);
	closeExportModal.addEventListener("click", hideExportModal);
	selectAllExport.addEventListener("change", handleSelectAllExport);

	// Import modal listeners
	confirmImportBtn.addEventListener("click", confirmImport);
	cancelImportBtn.addEventListener("click", hideImportModal);
	closeImportModal.addEventListener("click", hideImportModal);
	selectAllImport.addEventListener("change", handleSelectAllImport);

	// Close modals when clicking outside
	exportModal.addEventListener("click", (e) => {
		if (e.target === exportModal) hideExportModal();
	});
	importModal.addEventListener("click", (e) => {
		if (e.target === importModal) hideImportModal();
	});

	// Event delegation for remove header buttons
	headersContainer.addEventListener("click", (e) => {
		if (e.target.classList.contains("remove-header-btn")) {
			e.target.closest(".header-item").remove();
		}
	});

	// Event delegation for profile card buttons
	profilesContainer.addEventListener("click", (e) => {
		const profileCard = e.target.closest(".profile-card");
		if (!profileCard) return;

		const profileId = profileCard.dataset.id;

		// Check if clicking on action badge to show dropdown
		if (e.target.classList.contains("header-action-badge")) {
			// Don't allow clicking if profile is disabled
			if (profileCard.classList.contains("disabled")) {
				return;
			}
			showActionDropdown(profileId, e.target);
			return;
		}

		// Close dropdown if clicking elsewhere
		closeActionDropdown();

		if (e.target.classList.contains("btn-edit")) {
			editProfile(profileId);
		} else if (e.target.classList.contains("btn-clone")) {
			cloneProfile(profileId);
		} else if (e.target.classList.contains("btn-danger")) {
			deleteProfile(profileId);
		}
	});

	// Event delegation for profile toggle switches
	profilesContainer.addEventListener("change", (e) => {
		if (
			e.target.type === "checkbox" &&
			e.target.closest(".toggle-switch")
		) {
			const profileCard = e.target.closest(".profile-card");
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
		const data = await chrome.storage.local.get("profiles");
		currentProfiles = data.profiles || [];
		renderProfiles();
	} catch (error) {
		console.error("Error loading profiles:", error);
		showError("Failed to load profiles");
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

	profilesContainer.innerHTML = sortedProfiles
		.map(
			(profile) => `
    <div class="profile-card ${!profile.enabled ? "disabled" : ""}" data-id="${
				profile.id
			}">
      <div class="profile-header">
        <div class="profile-info">
          <div class="profile-name">${escapeHtml(profile.name)}</div>
          <div class="profile-url">${escapeHtml(profile.urlPattern)}</div>
        </div>
        <div class="profile-toggle">
          <label class="toggle-switch">
            <input type="checkbox" ${profile.enabled ? "checked" : ""}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      ${
			profile.headers && profile.headers.length > 0
				? `
        <div class="profile-details">
          <div class="profile-headers-title">Headers (${
				profile.headers.length
			}):</div>
          <div class="profile-headers">
            ${profile.headers
				.map(
					(header) => `
              <div class="header-item-display ${header.action}">
                <div class="header-action-badge ${header.action}">
                  ${escapeHtml(header.action.toUpperCase())}
                </div>
                <div class="header-content">
                  <div class="header-name-display">
                    <span class="header-label">Header:</span>
                    <span class="header-name-value">${escapeHtml(
						header.name
					)}</span>
                  </div>
                  ${
						header.action !== "delete"
							? `
                    <div class="header-value-display">
                      <span class="header-label">Value:</span>
                      <span class="header-value-text">${escapeHtml(
							header.value || ""
						)}</span>
                    </div>
                  `
							: ""
					}
                </div>
              </div>
            `
				)
				.join("")}
          </div>
        </div>
      `
				: ""
		}

      <div class="profile-actions">
        <button class="btn btn-edit">Edit</button>
        <button class="btn btn-clone">Clone</button>
        <button class="btn btn-danger btn-small">Delete</button>
      </div>
    </div>
  `
		)
		.join("");
}

// Show create profile form
function showCreateForm() {
	editingProfileId = null;
	formTitle.textContent = "New Profile";
	profileName.value = "";
	urlPattern.value = "";
	headersContainer.innerHTML = "";
	addHeaderField(); // Add one empty header field
	profileForm.classList.remove("hidden");
	profileName.focus();
}

// Show edit profile form
function editProfile(profileId) {
	const profile = currentProfiles.find((p) => p.id === profileId);
	if (!profile) return;

	editingProfileId = profileId;
	formTitle.textContent = "Edit Profile";
	profileName.value = profile.name;
	urlPattern.value = profile.urlPattern;

	headersContainer.innerHTML = "";
	if (profile.headers && profile.headers.length > 0) {
		profile.headers.forEach((header) => {
			addHeaderField(header);
		});
	} else {
		addHeaderField();
	}

	profileForm.classList.remove("hidden");
	profileName.focus();
}

// Hide form
function hideForm() {
	profileForm.classList.add("hidden");
	editingProfileId = null;
}

// Add header field
function addHeaderField(header = null) {
	const headerItem = document.createElement("div");
	headerItem.className = "header-item";

	const action = header ? header.action : "add";
	const name = header ? header.name : "";
	const value = header ? header.value : "";

	headerItem.innerHTML = `
    <div class="header-item-row">
      <select class="header-action">
        <option value="add" ${action === "add" ? "selected" : ""}>Add</option>
        <option value="modify" ${
			action === "modify" ? "selected" : ""
		}>Modify</option>
        <option value="delete" ${
			action === "delete" ? "selected" : ""
		}>Delete</option>
      </select>
      <input type="text" class="header-name" placeholder="Header name" value="${escapeHtml(
			name
		)}" required>
      <input type="text" class="header-value" placeholder="Value" value="${escapeHtml(
			value
		)}"
             style="${action === "delete" ? "display: none;" : ""}">
      <button type="button" class="remove-header-btn">×</button>
    </div>
  `;

	// Store the original value to preserve it when toggling
	const actionSelect = headerItem.querySelector(".header-action");
	const valueInput = headerItem.querySelector(".header-value");
	let savedValue = value;

	actionSelect.addEventListener("change", (e) => {
		if (e.target.value === "delete") {
			// Save current value before hiding
			savedValue = valueInput.value;
			valueInput.style.display = "none";
		} else {
			// Restore saved value when switching back
			if (savedValue) {
				valueInput.value = savedValue;
			}
			valueInput.style.display = "";
		}
	});

	headersContainer.appendChild(headerItem);
}

// Save profile
async function saveProfile() {
	const name = profileName.value.trim();
	const pattern = urlPattern.value.trim();

	if (!name) {
		alert("Please enter a profile name");
		profileName.focus();
		return;
	}

	if (!pattern) {
		alert("Please enter a URL pattern");
		urlPattern.focus();
		return;
	}

	// Collect headers
	const headers = [];
	const headerItems = headersContainer.querySelectorAll(".header-item");

	for (const item of headerItems) {
		const action = item.querySelector(".header-action").value;
		const headerName = item.querySelector(".header-name").value.trim();
		const headerValue = item.querySelector(".header-value").value.trim();

		if (!headerName) {
			alert("Please enter a header name or remove empty header fields");
			return;
		}

		if (action !== "delete" && !headerValue) {
			alert("Please enter a value for the header or remove the field");
			return;
		}

		headers.push({
			action,
			name: headerName,
			value: headerValue,
		});
	}

	if (headers.length === 0) {
		alert("Please add at least one header");
		return;
	}

	try {
		if (editingProfileId) {
			// Update existing profile
			const index = currentProfiles.findIndex(
				(p) => p.id === editingProfileId
			);
			if (index !== -1) {
				currentProfiles[index] = {
					...currentProfiles[index],
					name,
					urlPattern: pattern,
					headers,
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
				createdAt: Date.now(),
			};
			currentProfiles.push(newProfile);
		}

		await chrome.storage.local.set({ profiles: currentProfiles });
		hideForm();
		loadProfiles();
	} catch (error) {
		console.error("Error saving profile:", error);
		alert("Failed to save profile. Please try again.");
	}
}

// Show action dropdown menu
function showActionDropdown(profileId, badgeElement) {
	// Close any existing dropdown
	closeActionDropdown();

	const profile = currentProfiles.find((p) => p.id === profileId);
	if (!profile) return;

	// Find which header was clicked
	const headerItemDisplay = badgeElement.closest(".header-item-display");
	const headerIndex = Array.from(
		headerItemDisplay.parentElement.children
	).indexOf(headerItemDisplay);

	if (headerIndex === -1 || !profile.headers[headerIndex]) return;

	// Create dropdown menu
	const dropdown = document.createElement("div");
	dropdown.className = "action-dropdown";
	dropdown.innerHTML = `
    <div class="action-dropdown-item" data-action="add">
      <span class="action-dropdown-icon" style="color: #4caf50;">●</span>
      Add
    </div>
    <div class="action-dropdown-item" data-action="modify">
      <span class="action-dropdown-icon" style="color: #ff9800;">●</span>
      Modify
    </div>
    <div class="action-dropdown-item" data-action="delete">
      <span class="action-dropdown-icon" style="color: #f44336;">●</span>
      Delete
    </div>
  `;

	// Position dropdown below badge
	const badgeRect = badgeElement.getBoundingClientRect();
	dropdown.style.top = `${badgeRect.bottom + 5}px`;
	dropdown.style.left = `${badgeRect.left}px`;

	// Add click handlers to dropdown items
	dropdown.querySelectorAll(".action-dropdown-item").forEach((item) => {
		item.addEventListener("click", async (e) => {
			e.stopPropagation();
			const newAction = item.dataset.action;
			await updateHeaderAction(profileId, headerIndex, newAction);
			closeActionDropdown();
		});
	});

	// Add to body
	document.body.appendChild(dropdown);

	// Store reference for cleanup
	dropdown.dataset.profileId = profileId;
	dropdown.dataset.headerIndex = headerIndex;
}

// Close action dropdown
function closeActionDropdown() {
	const existingDropdown = document.querySelector(".action-dropdown");
	if (existingDropdown) {
		existingDropdown.remove();
	}
}

// Update header action
async function updateHeaderAction(profileId, headerIndex, newAction) {
	try {
		const profile = currentProfiles.find((p) => p.id === profileId);
		if (!profile || !profile.headers[headerIndex]) return;

		// Update the action
		profile.headers[headerIndex].action = newAction;

		// Save to storage
		await chrome.storage.local.set({ profiles: currentProfiles });

		// Re-render profiles
		renderProfiles();
	} catch (error) {
		console.error("Error updating header action:", error);
		showError("Failed to update header action");
	}
}

// Toggle profile enabled/disabled
async function toggleProfile(profileId, enabled) {
	try {
		const profile = currentProfiles.find((p) => p.id === profileId);
		if (profile) {
			profile.enabled = enabled;
			await chrome.storage.local.set({ profiles: currentProfiles });
			renderProfiles();
		}
	} catch (error) {
		console.error("Error toggling profile:", error);
		showError("Failed to toggle profile");
	}
}

// Delete profile
async function deleteProfile(profileId) {
	if (!confirm("Are you sure you want to delete this profile?")) {
		return;
	}

	try {
		currentProfiles = currentProfiles.filter((p) => p.id !== profileId);
		await chrome.storage.local.set({ profiles: currentProfiles });
		loadProfiles();
	} catch (error) {
		console.error("Error deleting profile:", error);
		alert("Failed to delete profile. Please try again.");
	}
}

// Clone profile
async function cloneProfile(profileId) {
	try {
		const profile = currentProfiles.find((p) => p.id === profileId);
		if (!profile) return;

		// Create a new profile with cloned data
		const clonedProfile = {
			id: generateId(),
			name: `${profile.name} (Copy)`,
			urlPattern: profile.urlPattern,
			headers: JSON.parse(JSON.stringify(profile.headers)), // Deep clone headers
			enabled: false, // Start disabled by default
			createdAt: Date.now(),
		};

		currentProfiles.push(clonedProfile);
		await chrome.storage.local.set({ profiles: currentProfiles });
		loadProfiles();
	} catch (error) {
		console.error("Error cloning profile:", error);
		alert("Failed to clone profile. Please try again.");
	}
}

// Show export modal
function showExportModal() {
	if (currentProfiles.length === 0) {
		alert("No profiles to export. Create some profiles first.");
		return;
	}

	// Populate profiles list
	exportProfilesList.innerHTML = currentProfiles
		.map(
			(profile) => `
    <label class="checkbox-label profile-checkbox">
      <input type="checkbox" class="export-checkbox" value="${profile.id}">
      <span class="profile-checkbox-content">
        <span class="profile-checkbox-name">${escapeHtml(profile.name)}</span>
        <span class="profile-checkbox-url">${escapeHtml(
			profile.urlPattern
		)}</span>
      </span>
    </label>
  `
		)
		.join("");

	selectAllExport.checked = false;
	exportModal.classList.remove("hidden");
}

// Hide export modal
function hideExportModal() {
	exportModal.classList.add("hidden");
}

// Handle select all export
function handleSelectAllExport() {
	const checkboxes = exportProfilesList.querySelectorAll(".export-checkbox");
	checkboxes.forEach((cb) => (cb.checked = selectAllExport.checked));
}

// Confirm export
function confirmExport() {
	const selectedCheckboxes = exportProfilesList.querySelectorAll(
		".export-checkbox:checked"
	);

	if (selectedCheckboxes.length === 0) {
		alert("Please select at least one profile to export.");
		return;
	}

	try {
		// Get selected profile IDs
		const selectedIds = Array.from(selectedCheckboxes).map(
			(cb) => cb.value
		);
		const selectedProfiles = currentProfiles.filter((p) =>
			selectedIds.includes(p.id)
		);

		// Create export data
		const exportData = {
			version: "1.0",
			exportDate: new Date().toISOString(),
			profiles: selectedProfiles,
		};

		// Convert to JSON
		const jsonString = JSON.stringify(exportData, null, 2);

		// Create blob and download
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `modify-header-profiles-${Date.now()}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		hideExportModal();
		console.log(
			`${selectedProfiles.length} profile(s) exported successfully`
		);
	} catch (error) {
		console.error("Error exporting profiles:", error);
		alert("Failed to export profiles. Please try again.");
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
			throw new Error("Invalid file format. Expected a profiles array.");
		}

		// Validate each profile
		for (const profile of importData.profiles) {
			if (!profile.name || !profile.urlPattern || !profile.headers) {
				throw new Error(
					"Invalid profile data. Each profile must have name, urlPattern, and headers."
				);
			}
		}

		// Store import data and show modal
		pendingImportData = importData.profiles;
		showImportModal();
	} catch (error) {
		console.error("Error reading import file:", error);
		alert(`Failed to read import file: ${error.message}`);
	} finally {
		// Reset file input
		event.target.value = "";
	}
}

// Show import modal
function showImportModal() {
	if (!pendingImportData || pendingImportData.length === 0) {
		alert("No profiles found in import file.");
		return;
	}

	// Populate profiles list
	importProfilesList.innerHTML = pendingImportData
		.map(
			(profile, index) => `
    <label class="checkbox-label profile-checkbox">
      <input type="checkbox" class="import-checkbox" value="${index}">
      <span class="profile-checkbox-content">
        <span class="profile-checkbox-name">${escapeHtml(profile.name)}</span>
        <span class="profile-checkbox-url">${escapeHtml(
			profile.urlPattern
		)}</span>
        <span class="profile-checkbox-info">${
			profile.headers.length
		} header(s)</span>
      </span>
    </label>
  `
		)
		.join("");

	selectAllImport.checked = false;
	importModal.classList.remove("hidden");
}

// Hide import modal
function hideImportModal() {
	importModal.classList.add("hidden");
	pendingImportData = null;
}

// Handle select all import
function handleSelectAllImport() {
	const checkboxes = importProfilesList.querySelectorAll(".import-checkbox");
	checkboxes.forEach((cb) => (cb.checked = selectAllImport.checked));
}

// Confirm import
async function confirmImport() {
	const selectedCheckboxes = importProfilesList.querySelectorAll(
		".import-checkbox:checked"
	);

	if (selectedCheckboxes.length === 0) {
		alert("Please select at least one profile to import.");
		return;
	}

	try {
		// Get selected profile indices
		const selectedIndices = Array.from(selectedCheckboxes).map((cb) =>
			parseInt(cb.value)
		);
		const selectedProfiles = pendingImportData.filter((_, index) =>
			selectedIndices.includes(index)
		);

		// Regenerate IDs to avoid conflicts
		const newProfiles = selectedProfiles.map((profile) => ({
			...profile,
			id: generateId(),
			createdAt: Date.now(),
			enabled: false, // Start disabled for safety
		}));

		// Add to existing profiles
		currentProfiles = [...currentProfiles, ...newProfiles];

		await chrome.storage.local.set({ profiles: currentProfiles });
		loadProfiles();

		hideImportModal();
		alert(`Successfully imported ${selectedProfiles.length} profile(s)!`);
	} catch (error) {
		console.error("Error importing profiles:", error);
		alert("Failed to import profiles. Please try again.");
	}
}

// Generate unique ID
function generateId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

// Show error message
function showError(message) {
	// Simple error display - could be enhanced with a toast notification
	console.error(message);
	alert(message);
}

// Setup navigation listeners
function setupNavigationListeners() {
	const navItems = document.querySelectorAll(".nav-item");
	navItems.forEach((item) => {
		item.addEventListener("click", () => {
			const section = item.dataset.section;
			switchSection(section);
		});
	});
}

// Switch between sections
function switchSection(sectionName) {
	// Remove active class from all nav items and sections
	document.querySelectorAll(".nav-item").forEach((item) => {
		item.classList.remove("active");
	});
	document.querySelectorAll(".section").forEach((section) => {
		section.classList.remove("active");
	});

	// Add active class to selected nav item and section
	const activeNavItem = document.querySelector(
		`.nav-item[data-section="${sectionName}"]`
	);
	if (activeNavItem) {
		activeNavItem.classList.add("active");
	}

	// Show appropriate section and update header
	if (sectionName === "modify-headers") {
		document.getElementById("modifyHeadersSection").classList.add("active");
		document.getElementById("headerTitle").textContent = "Modify Headers";
		document.getElementById("headerActions").style.display = "flex";
	} else if (sectionName === "manage-storage") {
		document.getElementById("manageStorageSection").classList.add("active");
		document.getElementById("headerTitle").textContent = "Manage Storage";
		document.getElementById("headerActions").style.display = "none";
	}
}

// Setup storage management listeners
function setupStorageListeners() {
	// Local Storage
	document
		.getElementById("exportLocalStorageBtn")
		.addEventListener("click", exportLocalStorage);
	document
		.getElementById("importLocalStorageBtn")
		.addEventListener("click", () => {
			document.getElementById("importLocalStorageFile").click();
		});
	document
		.getElementById("importLocalStorageFile")
		.addEventListener("change", importLocalStorage);
	document
		.getElementById("previewLocalStorageBtn")
		.addEventListener("click", previewLocalStorage);

	// Session Storage
	document
		.getElementById("exportSessionStorageBtn")
		.addEventListener("click", exportSessionStorage);
	document
		.getElementById("importSessionStorageBtn")
		.addEventListener("click", () => {
			document.getElementById("importSessionStorageFile").click();
		});
	document
		.getElementById("importSessionStorageFile")
		.addEventListener("change", importSessionStorage);
	document
		.getElementById("previewSessionStorageBtn")
		.addEventListener("click", previewSessionStorage);

	// Cookies
	document
		.getElementById("exportCookiesBtn")
		.addEventListener("click", exportCookies);
	document
		.getElementById("importCookiesBtn")
		.addEventListener("click", () => {
			document.getElementById("importCookiesFile").click();
		});
	document
		.getElementById("importCookiesFile")
		.addEventListener("change", importCookies);
	document
		.getElementById("previewCookiesBtn")
		.addEventListener("click", previewCookies);
}

// Helper function to create storage item with expandable value
function createStorageItemHTML(key, value, index) {
	const escapedKey = escapeHtml(key);
	const escapedValue = escapeHtml(value);
	const valueLength = escapedValue.length;
	const shouldCollapse = valueLength > 200; // Collapse if value is longer than 200 characters

	return `
		<div class="storage-preview-item">
			<div class="storage-preview-key">${escapedKey}</div>
			<div class="storage-preview-value ${
				shouldCollapse ? "collapsed" : ""
			}" data-index="${index}">${escapedValue}</div>${
		shouldCollapse
			? `<div class="storage-value-toggle" data-index="${index}">See more</div>`
			: ""
	}</div>`;
}

// Setup expand/collapse listeners for storage preview
function setupStorageExpandListeners(contentId, expandBtnId, collapseBtnId) {
	const contentDiv = document.getElementById(contentId);
	const expandBtn = document.getElementById(expandBtnId);
	const collapseBtn = document.getElementById(collapseBtnId);

	// Event delegation for individual toggle buttons
	contentDiv.addEventListener("click", (e) => {
		if (e.target.classList.contains("storage-value-toggle")) {
			const index = e.target.dataset.index;
			const valueDiv = contentDiv.querySelector(
				`.storage-preview-value[data-index="${index}"]`
			);

			if (valueDiv.classList.contains("collapsed")) {
				valueDiv.classList.remove("collapsed");
				e.target.textContent = "See less";
			} else {
				valueDiv.classList.add("collapsed");
				e.target.textContent = "See more";
			}
		}
	});

	// Expand all button
	expandBtn.addEventListener("click", () => {
		contentDiv
			.querySelectorAll(".storage-preview-value.collapsed")
			.forEach((valueDiv) => {
				valueDiv.classList.remove("collapsed");
			});
		contentDiv
			.querySelectorAll(".storage-value-toggle")
			.forEach((toggle) => {
				toggle.textContent = "See less";
			});
	});

	// Collapse all button
	collapseBtn.addEventListener("click", () => {
		contentDiv
			.querySelectorAll(".storage-preview-value[data-index]")
			.forEach((valueDiv) => {
				const toggle = contentDiv.querySelector(
					`.storage-value-toggle[data-index="${valueDiv.dataset.index}"]`
				);
				if (toggle) {
					valueDiv.classList.add("collapsed");
					toggle.textContent = "See more";
				}
			});
	});
}

// Export Local Storage
async function exportLocalStorage() {
	try {
		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

		// Inject script to get localStorage from the page
		const results = await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: () => {
				const data = {};
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					data[key] = localStorage.getItem(key);
				}
				return data;
			},
		});

		const data = results[0].result;

		const exportData = {
			type: "localStorage",
			exportDate: new Date().toISOString(),
			data: data,
		};

		downloadJSON(exportData, `localStorage-${Date.now()}.json`);
		alert("Local Storage exported successfully!");
	} catch (error) {
		console.error("Error exporting local storage:", error);
		alert(`Failed to export Local Storage: ${error.message}`);
	}
}

// Import Local Storage
async function importLocalStorage(event) {
	const file = event.target.files[0];
	if (!file) return;

	try {
		const text = await file.text();
		const importData = JSON.parse(text);

		if (importData.type !== "localStorage") {
			throw new Error("Invalid file type. Expected localStorage export.");
		}

		if (
			!confirm(
				"This will overwrite existing Local Storage data. Continue?"
			)
		) {
			return;
		}

		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

		// Inject script to set localStorage in the page
		await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: (data) => {
				Object.keys(data).forEach((key) => {
					localStorage.setItem(key, data[key]);
				});
			},
			args: [importData.data],
		});

		alert("Local Storage imported successfully!");
		loadProfiles(); // Reload profiles if they were affected
	} catch (error) {
		console.error("Error importing local storage:", error);
		alert(`Failed to import Local Storage: ${error.message}`);
	} finally {
		event.target.value = "";
	}
}

// Export Session Storage
async function exportSessionStorage() {
	try {
		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

		// Inject script to get sessionStorage from the page
		const results = await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: () => {
				const data = {};
				for (let i = 0; i < sessionStorage.length; i++) {
					const key = sessionStorage.key(i);
					data[key] = sessionStorage.getItem(key);
				}
				return data;
			},
		});

		const data = results[0].result;

		const exportData = {
			type: "sessionStorage",
			exportDate: new Date().toISOString(),
			data: data,
		};

		downloadJSON(exportData, `sessionStorage-${Date.now()}.json`);
		alert("Session Storage exported successfully!");
	} catch (error) {
		console.error("Error exporting session storage:", error);
		alert(`Failed to export Session Storage: ${error.message}`);
	}
}

// Import Session Storage
async function importSessionStorage(event) {
	const file = event.target.files[0];
	if (!file) return;

	try {
		const text = await file.text();
		const importData = JSON.parse(text);

		if (importData.type !== "sessionStorage") {
			throw new Error(
				"Invalid file type. Expected sessionStorage export."
			);
		}

		if (
			!confirm(
				"This will overwrite existing Session Storage data. Continue?"
			)
		) {
			return;
		}

		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

		// Inject script to set sessionStorage in the page
		await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: (data) => {
				Object.keys(data).forEach((key) => {
					sessionStorage.setItem(key, data[key]);
				});
			},
			args: [importData.data],
		});

		alert("Session Storage imported successfully!");
	} catch (error) {
		console.error("Error importing session storage:", error);
		alert(`Failed to import Session Storage: ${error.message}`);
	} finally {
		event.target.value = "";
	}
}

// Export Cookies
async function exportCookies() {
	try {
		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		const url = tabs[0]?.url;

		if (!url) {
			throw new Error("Could not get current tab URL");
		}

		const cookies = await chrome.cookies.getAll({ url: url });

		const exportData = {
			type: "cookies",
			exportDate: new Date().toISOString(),
			url: url,
			cookies: cookies,
		};

		downloadJSON(exportData, `cookies-${Date.now()}.json`);
		alert(`Exported ${cookies.length} cookie(s) successfully!`);
	} catch (error) {
		console.error("Error exporting cookies:", error);
		alert("Failed to export Cookies.");
	}
}

// Import Cookies
async function importCookies(event) {
	const file = event.target.files[0];
	if (!file) return;

	try {
		const text = await file.text();
		const importData = JSON.parse(text);

		if (importData.type !== "cookies") {
			throw new Error("Invalid file type. Expected cookies export.");
		}

		if (!confirm(`Import ${importData.cookies.length} cookie(s)?`)) {
			return;
		}

		let successCount = 0;
		for (const cookie of importData.cookies) {
			try {
				await chrome.cookies.set({
					url: importData.url,
					name: cookie.name,
					value: cookie.value,
					domain: cookie.domain,
					path: cookie.path,
					secure: cookie.secure,
					httpOnly: cookie.httpOnly,
					sameSite: cookie.sameSite,
					expirationDate: cookie.expirationDate,
				});
				successCount++;
			} catch (err) {
				console.warn(`Failed to set cookie ${cookie.name}:`, err);
			}
		}

		alert(`Successfully imported ${successCount} cookie(s)!`);
	} catch (error) {
		console.error("Error importing cookies:", error);
		alert(`Failed to import Cookies: ${error.message}`);
	} finally {
		event.target.value = "";
	}
}

// Helper function to download JSON
function downloadJSON(data, filename) {
	const jsonString = JSON.stringify(data, null, 2);
	const blob = new Blob([jsonString], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

// Preview Local Storage
async function previewLocalStorage() {
	const previewDiv = document.getElementById("localStoragePreview");
	const contentDiv = document.getElementById("localStorageContent");

	// Toggle visibility
	if (!previewDiv.classList.contains("hidden")) {
		previewDiv.classList.add("hidden");
		return;
	}

	try {
		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		const tab = tabs[0];

		if (!tab || !tab.id) {
			throw new Error("Could not get current tab");
		}

		// Check if the current page allows script injection
		if (
			tab.url.startsWith("chrome://") ||
			tab.url.startsWith("chrome-extension://") ||
			tab.url.startsWith("edge://") ||
			tab.url.startsWith("about:") ||
			tab.url === "chrome://newtab/" ||
			!tab.url
		) {
			throw new Error(
				"Cannot access storage on this page. Please navigate to a regular website (http:// or https://)."
			);
		}

		// Inject script to get localStorage from the page
		const results = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => {
				const data = {};
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					data[key] = localStorage.getItem(key);
				}
				return data;
			},
		});

		const localStorageData = results[0].result;
		const keys = Object.keys(localStorageData);

		if (keys.length === 0) {
			contentDiv.innerHTML =
				'<div class="storage-preview-empty">No data in Local Storage</div>';
		} else {
			let html = "";
			keys.forEach((key, index) => {
				html += createStorageItemHTML(
					key,
					localStorageData[key],
					index
				);
			});
			contentDiv.innerHTML = html;

			// Setup expand/collapse listeners
			setupStorageExpandListeners(
				"localStorageContent",
				"expandAllLocalStorageBtn",
				"collapseAllLocalStorageBtn"
			);
		}
		previewDiv.classList.remove("hidden");
	} catch (error) {
		console.error("Error previewing local storage:", error);
		contentDiv.innerHTML = `<div class="storage-preview-empty" style="color: #f44336;">Error: ${escapeHtml(
			error.message
		)}</div>`;
		previewDiv.classList.remove("hidden");
	}
}

// Preview Session Storage
async function previewSessionStorage() {
	const previewDiv = document.getElementById("sessionStoragePreview");
	const contentDiv = document.getElementById("sessionStorageContent");

	// Toggle visibility
	if (!previewDiv.classList.contains("hidden")) {
		previewDiv.classList.add("hidden");
		return;
	}

	try {
		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		const tab = tabs[0];

		if (!tab || !tab.id) {
			throw new Error("Could not get current tab");
		}

		// Check if the current page allows script injection
		if (
			tab.url.startsWith("chrome://") ||
			tab.url.startsWith("chrome-extension://") ||
			tab.url.startsWith("edge://") ||
			tab.url.startsWith("about:") ||
			tab.url === "chrome://newtab/" ||
			!tab.url
		) {
			throw new Error(
				"Cannot access storage on this page. Please navigate to a regular website (http:// or https://)."
			);
		}

		// Inject script to get sessionStorage from the page
		const results = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: () => {
				const data = {};
				for (let i = 0; i < sessionStorage.length; i++) {
					const key = sessionStorage.key(i);
					data[key] = sessionStorage.getItem(key);
				}
				return data;
			},
		});

		const sessionStorageData = results[0].result;
		const keys = Object.keys(sessionStorageData);

		if (keys.length === 0) {
			contentDiv.innerHTML =
				'<div class="storage-preview-empty">No data in Session Storage</div>';
		} else {
			let html = "";
			keys.forEach((key, index) => {
				html += createStorageItemHTML(
					key,
					sessionStorageData[key],
					index
				);
			});
			contentDiv.innerHTML = html;

			// Setup expand/collapse listeners
			setupStorageExpandListeners(
				"sessionStorageContent",
				"expandAllSessionStorageBtn",
				"collapseAllSessionStorageBtn"
			);
		}
		previewDiv.classList.remove("hidden");
	} catch (error) {
		console.error("Error previewing session storage:", error);
		contentDiv.innerHTML = `<div class="storage-preview-empty" style="color: #f44336;">Error: ${escapeHtml(
			error.message
		)}</div>`;
		previewDiv.classList.remove("hidden");
	}
}

// Preview Cookies
async function previewCookies() {
	const previewDiv = document.getElementById("cookiesPreview");
	const contentDiv = document.getElementById("cookiesContent");

	// Toggle visibility
	if (!previewDiv.classList.contains("hidden")) {
		previewDiv.classList.add("hidden");
		return;
	}

	try {
		const tabs = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});
		const tab = tabs[0];

		if (!tab || !tab.url) {
			throw new Error("Could not get current tab URL");
		}

		// Check if the current page allows cookie access
		if (
			tab.url.startsWith("chrome://") ||
			tab.url.startsWith("chrome-extension://") ||
			tab.url.startsWith("edge://") ||
			tab.url.startsWith("about:") ||
			tab.url === "chrome://newtab/" ||
			!tab.url.startsWith("http")
		) {
			throw new Error(
				"Cannot access cookies on this page. Please navigate to a regular website (http:// or https://)."
			);
		}

		const cookies = await chrome.cookies.getAll({ url: tab.url });

		if (cookies.length === 0) {
			contentDiv.innerHTML =
				'<div class="storage-preview-empty">No cookies for current site</div>';
		} else {
			let html = "";
			cookies.forEach((cookie, index) => {
				const cookieInfo = `
Name: ${cookie.name}
Value: ${cookie.value}
Domain: ${cookie.domain}
Path: ${cookie.path}
Secure: ${cookie.secure}
HttpOnly: ${cookie.httpOnly}
SameSite: ${cookie.sameSite || "none"}
Expires: ${
					cookie.expirationDate
						? new Date(
								cookie.expirationDate * 1000
						  ).toLocaleString()
						: "Session"
				}
				`.trim();

				html += createStorageItemHTML(cookie.name, cookieInfo, index);
			});
			contentDiv.innerHTML = html;

			// Setup expand/collapse listeners
			setupStorageExpandListeners(
				"cookiesContent",
				"expandAllCookiesBtn",
				"collapseAllCookiesBtn"
			);
		}
		previewDiv.classList.remove("hidden");
	} catch (error) {
		console.error("Error previewing cookies:", error);
		contentDiv.innerHTML = `<div class="storage-preview-empty" style="color: #f44336;">Error: ${escapeHtml(
			error.message
		)}</div>`;
		previewDiv.classList.remove("hidden");
	}
}
