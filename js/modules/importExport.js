// Import/Export functionality
import { escapeHtml, downloadJSON } from '../utils/dom.js';
import { getCurrentProfiles, loadProfiles } from './profileManager.js';

// DOM Elements
let exportModal, importModal, exportProfilesList, importProfilesList;
let selectAllExport, selectAllImport, confirmExportBtn, confirmImportBtn;
let cancelExportBtn, cancelImportBtn, closeExportModal, closeImportModal;
let exportProfilesBtn, importProfilesBtn, importFileInput;

let pendingImportData = null;

export function init() {
	// Cache DOM elements
	exportProfilesBtn = document.getElementById("exportProfilesBtn");
	importProfilesBtn = document.getElementById("importProfilesBtn");
	importFileInput = document.getElementById("importFileInput");
	exportModal = document.getElementById("exportModal");
	importModal = document.getElementById("importModal");
	exportProfilesList = document.getElementById("exportProfilesList");
	importProfilesList = document.getElementById("importProfilesList");
	selectAllExport = document.getElementById("selectAllExport");
	selectAllImport = document.getElementById("selectAllImport");
	confirmExportBtn = document.getElementById("confirmExportBtn");
	cancelExportBtn = document.getElementById("cancelExportBtn");
	closeExportModal = document.getElementById("closeExportModal");
	confirmImportBtn = document.getElementById("confirmImportBtn");
	cancelImportBtn = document.getElementById("cancelImportBtn");
	closeImportModal = document.getElementById("closeImportModal");

	// Setup event listeners
	exportProfilesBtn.addEventListener("click", showExportModal);
	importProfilesBtn.addEventListener("click", () => importFileInput.click());
	importFileInput.addEventListener("change", handleImportFile);

	confirmExportBtn.addEventListener("click", confirmExport);
	cancelExportBtn.addEventListener("click", hideExportModal);
	closeExportModal.addEventListener("click", hideExportModal);
	selectAllExport.addEventListener("change", handleSelectAllExport);

	confirmImportBtn.addEventListener("click", confirmImport);
	cancelImportBtn.addEventListener("click", hideImportModal);
	closeImportModal.addEventListener("click", hideImportModal);
	selectAllImport.addEventListener("change", handleSelectAllImport);

	exportModal.addEventListener("click", (e) => {
		if (e.target === exportModal) hideExportModal();
	});
	importModal.addEventListener("click", (e) => {
		if (e.target === importModal) hideImportModal();
	});
}

function showExportModal() {
	const profiles = getCurrentProfiles();
	if (profiles.length === 0) {
		alert("No profiles to export. Create some profiles first.");
		return;
	}

	exportProfilesList.innerHTML = profiles
		.map(
			(profile) => `
    <label class="checkbox-label profile-checkbox">
      <input type="checkbox" class="export-checkbox" value="${profile.id}">
      <span class="profile-checkbox-content">
        <span class="profile-checkbox-name">${escapeHtml(profile.name)}</span>
        <span class="profile-checkbox-url">${escapeHtml(profile.urlPattern)}</span>
      </span>
    </label>
  `
		)
		.join("");

	selectAllExport.checked = false;
	exportModal.classList.remove("hidden");
}

function hideExportModal() {
	exportModal.classList.add("hidden");
}

function handleSelectAllExport() {
	const checkboxes = exportProfilesList.querySelectorAll(".export-checkbox");
	checkboxes.forEach((cb) => (cb.checked = selectAllExport.checked));
}

function confirmExport() {
	const selectedCheckboxes = exportProfilesList.querySelectorAll(".export-checkbox:checked");

	if (selectedCheckboxes.length === 0) {
		alert("Please select at least one profile to export.");
		return;
	}

	try {
		const profiles = getCurrentProfiles();
		const selectedIds = Array.from(selectedCheckboxes).map((cb) => cb.value);
		const selectedProfiles = profiles.filter((p) => selectedIds.includes(p.id));

		const exportData = {
			version: "1.0",
			exportDate: new Date().toISOString(),
			profiles: selectedProfiles,
		};

		downloadJSON(exportData, `modify-header-profiles-${Date.now()}.json`);
		hideExportModal();
		console.log(`${selectedProfiles.length} profile(s) exported successfully`);
	} catch (error) {
		console.error("Error exporting profiles:", error);
		alert("Failed to export profiles. Please try again.");
	}
}

async function handleImportFile(event) {
	const file = event.target.files[0];
	if (!file) return;

	try {
		const text = await file.text();
		const importData = JSON.parse(text);

		if (!importData.profiles || !Array.isArray(importData.profiles)) {
			throw new Error("Invalid file format. Expected a profiles array.");
		}

		for (const profile of importData.profiles) {
			if (!profile.name || !profile.urlPattern || !profile.headers) {
				throw new Error(
					"Invalid profile data. Each profile must have name, urlPattern, and headers."
				);
			}
		}

		pendingImportData = importData.profiles;
		showImportModal();
	} catch (error) {
		console.error("Error reading import file:", error);
		alert(`Failed to read import file: ${error.message}`);
	} finally {
		event.target.value = "";
	}
}

function showImportModal() {
	if (!pendingImportData || pendingImportData.length === 0) {
		alert("No profiles found in import file.");
		return;
	}

	importProfilesList.innerHTML = pendingImportData
		.map(
			(profile, index) => `
    <label class="checkbox-label profile-checkbox">
      <input type="checkbox" class="import-checkbox" value="${index}">
      <span class="profile-checkbox-content">
        <span class="profile-checkbox-name">${escapeHtml(profile.name)}</span>
        <span class="profile-checkbox-url">${escapeHtml(profile.urlPattern)}</span>
        <span class="profile-checkbox-info">${profile.headers.length} header(s)</span>
      </span>
    </label>
  `
		)
		.join("");

	selectAllImport.checked = false;
	importModal.classList.remove("hidden");
}

function hideImportModal() {
	importModal.classList.add("hidden");
	pendingImportData = null;
}

function handleSelectAllImport() {
	const checkboxes = importProfilesList.querySelectorAll(".import-checkbox");
	checkboxes.forEach((cb) => (cb.checked = selectAllImport.checked));
}

async function confirmImport() {
	const selectedCheckboxes = importProfilesList.querySelectorAll(".import-checkbox:checked");

	if (selectedCheckboxes.length === 0) {
		alert("Please select at least one profile to import.");
		return;
	}

	try {
		const profiles = getCurrentProfiles();
		const selectedIndices = Array.from(selectedCheckboxes).map((cb) => parseInt(cb.value));
		const selectedProfiles = pendingImportData.filter((_, index) =>
			selectedIndices.includes(index)
		);

		const newProfiles = selectedProfiles.map((profile) => ({
			...profile,
			id: Date.now().toString(36) + Math.random().toString(36).substr(2),
			createdAt: Date.now(),
			enabled: false,
		}));

		const updatedProfiles = [...profiles, ...newProfiles];
		await chrome.storage.local.set({ profiles: updatedProfiles });
		await loadProfiles();

		hideImportModal();
		alert(`Successfully imported ${selectedProfiles.length} profile(s)!`);
	} catch (error) {
		console.error("Error importing profiles:", error);
		alert("Failed to import profiles. Please try again.");
	}
}
