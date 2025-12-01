// Profile management module
import { escapeHtml, generateId, showError } from "../utils/dom.js";

let currentProfiles = [];
let editingProfileId = null;

// DOM Elements
let profileForm, formTitle, profileName, urlPattern, headersContainer;
let addHeaderBtn, saveProfileBtn, cancelProfileBtn, profilesContainer;

export function init() {
	// Cache DOM elements
	profileForm = document.getElementById("profileForm");
	formTitle = document.getElementById("formTitle");
	profileName = document.getElementById("profileName");
	urlPattern = document.getElementById("urlPattern");
	headersContainer = document.getElementById("headersContainer");
	addHeaderBtn = document.getElementById("addHeaderBtn");
	saveProfileBtn = document.getElementById("saveProfileBtn");
	cancelProfileBtn = document.getElementById("cancelProfileBtn");
	profilesContainer = document.getElementById("profilesContainer");

	// Setup event listeners
	const createProfileBtnBottom = document.getElementById(
		"createProfileBtnBottom"
	);
	if (createProfileBtnBottom) {
		createProfileBtnBottom.addEventListener("click", showCreateForm);
	}

	addHeaderBtn.addEventListener("click", addHeaderField);
	saveProfileBtn.addEventListener("click", saveProfile);
	cancelProfileBtn.addEventListener("click", hideForm);

	// Event delegation for header removal
	headersContainer.addEventListener("click", (e) => {
		if (e.target.classList.contains("remove-header-btn")) {
			e.target.closest(".header-item").remove();
		}
	});

	// Event delegation for profile card actions
	profilesContainer.addEventListener("click", handleProfileAction);
	profilesContainer.addEventListener("change", handleProfileToggle);

	// Load profiles
	loadProfiles();
}

export async function loadProfiles() {
	try {
		const data = await chrome.storage.local.get("profiles");
		currentProfiles = data.profiles || [];
		renderProfiles();
	} catch (error) {
		console.error("Error loading profiles:", error);
		showError("Failed to load profiles");
	}
}

function renderProfiles() {
	const bottomBtn = document.getElementById("createProfileBtnBottom");

	if (currentProfiles.length === 0) {
		profilesContainer.innerHTML = `
      <div class="empty-state">
        <p>No profiles yet. Create one to get started!</p>
      </div>
    `;
		return;
	}

	if (bottomBtn) bottomBtn.classList.remove("hidden");

	const sortedProfiles = [...currentProfiles].sort((a, b) => {
		if (a.enabled === b.enabled) return 0;
		return a.enabled ? -1 : 1;
	});

	profilesContainer.innerHTML = sortedProfiles
		.map((profile) => createProfileCard(profile))
		.join("");
}

function createProfileCard(profile) {
	return `
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
				.map((header, index) => createHeaderDisplay(header, index))
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
  `;
}

function createHeaderDisplay(header, index) {
	return `
    <div class="header-item-display ${header.action}">
      <div class="header-action-badge ${header.action}" data-index="${index}">
        ${escapeHtml(header.action.toUpperCase())} ▾
      </div>
      
      <div class="action-dropdown hidden" id="dropdown-${index}">
        <div class="action-dropdown-item add" data-action="add" data-index="${index}">Add</div>
        <div class="action-dropdown-item modify" data-action="modify" data-index="${index}">Modify</div>
        <div class="action-dropdown-item delete" data-action="delete" data-index="${index}">Delete</div>
      </div>

      <div class="header-content">
        <div class="header-name-display">
          <span class="header-label">Header:</span>
          <span class="header-name-value">${escapeHtml(header.name)}</span>
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
  `;
}

function showCreateForm() {
	editingProfileId = null;
	formTitle.textContent = "New Profile";
	profileName.value = "";
	urlPattern.value = "";
	headersContainer.innerHTML = "";
	addHeaderField();
	profileForm.classList.remove("hidden");
	profileName.focus();
}

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

function hideForm() {
	profileForm.classList.add("hidden");
	editingProfileId = null;
}

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

	const actionSelect = headerItem.querySelector(".header-action");
	const valueInput = headerItem.querySelector(".header-value");
	let savedValue = value;

	actionSelect.addEventListener("change", (e) => {
		if (e.target.value === "delete") {
			savedValue = valueInput.value;
			valueInput.style.display = "none";
		} else {
			if (savedValue) {
				valueInput.value = savedValue;
			}
			valueInput.style.display = "";
		}
	});

	headersContainer.appendChild(headerItem);
}

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

async function cloneProfile(profileId) {
	try {
		const profile = currentProfiles.find((p) => p.id === profileId);
		if (!profile) return;

		const clonedProfile = {
			id: generateId(),
			name: `${profile.name} (Copy)`,
			urlPattern: profile.urlPattern,
			headers: JSON.parse(JSON.stringify(profile.headers)),
			enabled: false,
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

async function handleProfileAction(e) {
	const profileCard = e.target.closest(".profile-card");
	if (!profileCard) return;

	const profileId = profileCard.dataset.id;

	// Handle Header Action Dropdown Toggle
	if (e.target.classList.contains("header-action-badge")) {
		// Prevent action if profile is disabled
		if (profileCard.classList.contains("disabled")) return;

		const index = e.target.dataset.index;
		const dropdown = profileCard.querySelector(`#dropdown-${index}`);

		// Close all other dropdowns first
		document.querySelectorAll(".action-dropdown").forEach((d) => {
			if (d !== dropdown) d.classList.add("hidden");
		});

		if (dropdown) {
			dropdown.classList.toggle("hidden");
		}
		return;
	}

	// Handle Dropdown Item Selection
	if (e.target.classList.contains("action-dropdown-item")) {
		const index = parseInt(e.target.dataset.index, 10);
		const newAction = e.target.dataset.action;
		const profileIndex = currentProfiles.findIndex(
			(p) => p.id === profileId
		);

		if (profileIndex !== -1 && !isNaN(index)) {
			const profile = currentProfiles[profileIndex];

			// Only update if action changed
			if (profile.headers[index].action !== newAction) {
				profile.headers[index].action = newAction;

				try {
					await chrome.storage.local.set({
						profiles: currentProfiles,
					});
					loadProfiles();
				} catch (error) {
					console.error("Error updating profile action:", error);
				}
			} else {
				// Just close dropdown if same action selected
				const dropdown = e.target.closest(".action-dropdown");
				if (dropdown) dropdown.classList.add("hidden");
			}
		}
		return;
	}

	if (e.target.classList.contains("btn-edit")) {
		editProfile(profileId);
	} else if (e.target.classList.contains("btn-clone")) {
		cloneProfile(profileId);
	} else if (e.target.classList.contains("btn-danger")) {
		deleteProfile(profileId);
	}
}

// Close dropdowns when clicking outside
document.addEventListener("click", (e) => {
	if (!e.target.closest(".header-item-display")) {
		document
			.querySelectorAll(".action-dropdown")
			.forEach((d) => d.classList.add("hidden"));
	}
});

function handleProfileToggle(e) {
	if (e.target.type === "checkbox" && e.target.closest(".toggle-switch")) {
		const profileCard = e.target.closest(".profile-card");
		if (profileCard) {
			const profileId = profileCard.dataset.id;
			toggleProfile(profileId, e.target.checked);
		}
	}
}

export function getCurrentProfiles() {
	return currentProfiles;
}
