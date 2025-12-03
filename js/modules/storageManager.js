// Browser storage management module
import { escapeHtml, downloadJSON } from '../utils/dom.js';

export function init() {
	// Local Storage
	document.getElementById("exportLocalStorageBtn").addEventListener("click", exportLocalStorage);
	document.getElementById("importLocalStorageBtn").addEventListener("click", () => {
		document.getElementById("importLocalStorageFile").click();
	});
	document.getElementById("importLocalStorageFile").addEventListener("change", importLocalStorage);
	document.getElementById("previewLocalStorageBtn").addEventListener("click", previewLocalStorage);
	document.getElementById("clearLocalStorageBtn").addEventListener("click", clearLocalStorage);

	// Session Storage
	document.getElementById("exportSessionStorageBtn").addEventListener("click", exportSessionStorage);
	document.getElementById("importSessionStorageBtn").addEventListener("click", () => {
		document.getElementById("importSessionStorageFile").click();
	});
	document.getElementById("importSessionStorageFile").addEventListener("change", importSessionStorage);
	document.getElementById("previewSessionStorageBtn").addEventListener("click", previewSessionStorage);
	document.getElementById("clearSessionStorageBtn").addEventListener("click", clearSessionStorage);

	// Cookies
	document.getElementById("exportCookiesBtn").addEventListener("click", exportCookies);
	document.getElementById("importCookiesBtn").addEventListener("click", () => {
		document.getElementById("importCookiesFile").click();
	});
	document.getElementById("importCookiesFile").addEventListener("change", importCookies);
	document.getElementById("previewCookiesBtn").addEventListener("click", previewCookies);
	document.getElementById("clearCookiesBtn").addEventListener("click", clearCookies);
}

function createStorageItemHTML(key, value, index) {
	const escapedKey = escapeHtml(key);
	const escapedValue = escapeHtml(value);
	const valueLength = escapedValue.length;
	const shouldCollapse = valueLength > 200;

	return `
		<div class="storage-preview-item" data-value="${escapeHtml(value).replace(/"/g, "&quot;")}">
			<button class="storage-copy-btn" title="Copy value">Copy</button>
			<div class="storage-preview-key">${escapedKey}</div>
			<div class="storage-preview-value ${shouldCollapse ? "collapsed" : ""}" data-index="${index}">${escapedValue}</div>${shouldCollapse ? `<div class="storage-value-toggle" data-index="${index}">See more</div>` : ""
		}</div>`;
}

function setupStorageExpandListeners(contentId, expandBtnId, collapseBtnId) {
	const contentDiv = document.getElementById(contentId);
	const expandBtn = document.getElementById(expandBtnId);
	const collapseBtn = document.getElementById(collapseBtnId);

	contentDiv.addEventListener("click", (e) => {
		if (e.target.classList.contains("storage-value-toggle")) {
			const index = e.target.dataset.index;
			const valueDiv = contentDiv.querySelector(`.storage-preview-value[data-index="${index}"]`);

			if (valueDiv.classList.contains("collapsed")) {
				valueDiv.classList.remove("collapsed");
				e.target.textContent = "See less";
			} else {
				valueDiv.classList.add("collapsed");
				e.target.textContent = "See more";
			}
		}

		if (e.target.classList.contains("storage-copy-btn")) {
			const item = e.target.closest(".storage-preview-item");
			const value = item.dataset.value;

			navigator.clipboard
				.writeText(value)
				.then(() => {
					const originalText = e.target.textContent;
					e.target.textContent = "Copied!";
					e.target.classList.add("copied");

					setTimeout(() => {
						e.target.textContent = originalText;
						e.target.classList.remove("copied");
					}, 1500);
				})
				.catch((err) => {
					console.error("Failed to copy:", err);
					e.target.textContent = "Failed";
					setTimeout(() => {
						e.target.textContent = "Copy";
					}, 1500);
				});
		}
	});

	expandBtn.addEventListener("click", () => {
		contentDiv.querySelectorAll(".storage-preview-value.collapsed").forEach((valueDiv) => {
			valueDiv.classList.remove("collapsed");
		});
		contentDiv.querySelectorAll(".storage-value-toggle").forEach((toggle) => {
			toggle.textContent = "See less";
		});
	});

	collapseBtn.addEventListener("click", () => {
		contentDiv.querySelectorAll(".storage-preview-value[data-index]").forEach((valueDiv) => {
			const toggle = contentDiv.querySelector(`.storage-value-toggle[data-index="${valueDiv.dataset.index}"]`);
			if (toggle) {
				valueDiv.classList.add("collapsed");
				toggle.textContent = "See more";
			}
		});
	});
}

async function exportLocalStorage() {
	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

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

async function importLocalStorage(event) {
	const file = event.target.files[0];
	if (!file) return;

	try {
		const text = await file.text();
		const importData = JSON.parse(text);

		if (importData.type !== "localStorage") {
			throw new Error("Invalid file type. Expected localStorage export.");
		}

		if (!confirm("This will overwrite existing Local Storage data. Continue?")) {
			return;
		}

		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

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
	} catch (error) {
		console.error("Error importing local storage:", error);
		alert(`Failed to import Local Storage: ${error.message}`);
	} finally {
		event.target.value = "";
	}
}

async function exportSessionStorage() {
	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

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

async function importSessionStorage(event) {
	const file = event.target.files[0];
	if (!file) return;

	try {
		const text = await file.text();
		const importData = JSON.parse(text);

		if (importData.type !== "sessionStorage") {
			throw new Error("Invalid file type. Expected sessionStorage export.");
		}

		if (!confirm("This will overwrite existing Session Storage data. Continue?")) {
			return;
		}

		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

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

async function exportCookies() {
	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
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

async function previewLocalStorage() {
	const previewDiv = document.getElementById("localStoragePreview");
	const contentDiv = document.getElementById("localStorageContent");

	if (!previewDiv.classList.contains("hidden")) {
		previewDiv.classList.add("hidden");
		return;
	}

	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const tab = tabs[0];

		if (!tab || !tab.id) {
			throw new Error("Could not get current tab");
		}

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
			contentDiv.innerHTML = '<div class="storage-preview-empty">No data in Local Storage</div>';
		} else {
			let html = "";
			keys.forEach((key, index) => {
				html += createStorageItemHTML(key, localStorageData[key], index);
			});
			contentDiv.innerHTML = html;

			setupStorageExpandListeners(
				"localStorageContent",
				"expandAllLocalStorageBtn",
				"collapseAllLocalStorageBtn"
			);
		}
		previewDiv.classList.remove("hidden");
	} catch (error) {
		console.error("Error previewing local storage:", error);
		contentDiv.innerHTML = `<div class="storage-preview-empty" style="color: #f44336;">Error: ${escapeHtml(error.message)}</div>`;
		previewDiv.classList.remove("hidden");
	}
}

async function previewSessionStorage() {
	const previewDiv = document.getElementById("sessionStoragePreview");
	const contentDiv = document.getElementById("sessionStorageContent");

	if (!previewDiv.classList.contains("hidden")) {
		previewDiv.classList.add("hidden");
		return;
	}

	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const tab = tabs[0];

		if (!tab || !tab.id) {
			throw new Error("Could not get current tab");
		}

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
			contentDiv.innerHTML = '<div class="storage-preview-empty">No data in Session Storage</div>';
		} else {
			let html = "";
			keys.forEach((key, index) => {
				html += createStorageItemHTML(key, sessionStorageData[key], index);
			});
			contentDiv.innerHTML = html;

			setupStorageExpandListeners(
				"sessionStorageContent",
				"expandAllSessionStorageBtn",
				"collapseAllSessionStorageBtn"
			);
		}
		previewDiv.classList.remove("hidden");
	} catch (error) {
		console.error("Error previewing session storage:", error);
		contentDiv.innerHTML = `<div class="storage-preview-empty" style="color: #f44336;">Error: ${escapeHtml(error.message)}</div>`;
		previewDiv.classList.remove("hidden");
	}
}

async function previewCookies() {
	const previewDiv = document.getElementById("cookiesPreview");
	const contentDiv = document.getElementById("cookiesContent");

	if (!previewDiv.classList.contains("hidden")) {
		previewDiv.classList.add("hidden");
		return;
	}

	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const tab = tabs[0];

		if (!tab || !tab.url) {
			throw new Error("Could not get current tab URL");
		}

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
			contentDiv.innerHTML = '<div class="storage-preview-empty">No cookies for current site</div>';
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
Expires: ${cookie.expirationDate
						? new Date(cookie.expirationDate * 1000).toLocaleString()
						: "Session"
					}
				`.trim();

				html += createStorageItemHTML(cookie.name, cookieInfo, index);
			});
			contentDiv.innerHTML = html;

			setupStorageExpandListeners(
				"cookiesContent",
				"expandAllCookiesBtn",
				"collapseAllCookiesBtn"
			);
		}
		previewDiv.classList.remove("hidden");
	} catch (error) {
		console.error("Error previewing cookies:", error);
		contentDiv.innerHTML = `<div class="storage-preview-empty" style="color: #f44336;">Error: ${escapeHtml(error.message)}</div>`;
		previewDiv.classList.remove("hidden");
	}
}

// Clear Local Storage
async function clearLocalStorage() {
	if (!confirm("⚠️ WARNING: This will permanently delete ALL Local Storage data for the current site.\n\nAre you sure you want to continue?")) {
		return;
	}

	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

		await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: () => {
				localStorage.clear();
			},
		});

		// Hide preview if it's showing
		const previewDiv = document.getElementById("localStoragePreview");
		previewDiv.classList.add("hidden");

		alert("Local Storage cleared successfully!");
	} catch (error) {
		console.error("Error clearing local storage:", error);
		alert(`Failed to clear Local Storage: ${error.message}`);
	}
}

// Clear Session Storage
async function clearSessionStorage() {
	if (!confirm("⚠️ WARNING: This will permanently delete ALL Session Storage data for the current site.\n\nAre you sure you want to continue?")) {
		return;
	}

	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const tabId = tabs[0]?.id;

		if (!tabId) {
			throw new Error("Could not get current tab");
		}

		await chrome.scripting.executeScript({
			target: { tabId: tabId },
			func: () => {
				sessionStorage.clear();
			},
		});

		// Hide preview if it's showing
		const previewDiv = document.getElementById("sessionStoragePreview");
		previewDiv.classList.add("hidden");

		alert("Session Storage cleared successfully!");
	} catch (error) {
		console.error("Error clearing session storage:", error);
		alert(`Failed to clear Session Storage: ${error.message}`);
	}
}

// Clear Cookies
async function clearCookies() {
	try {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		const url = tabs[0]?.url;

		if (!url) {
			throw new Error("Could not get current tab URL");
		}

		// Get all cookies for the current site
		const cookies = await chrome.cookies.getAll({ url: url });

		if (cookies.length === 0) {
			alert("No cookies found for the current site.");
			return;
		}

		if (!confirm(`⚠️ WARNING: This will permanently delete ${cookies.length} cookie(s) for the current site.\n\nAre you sure you want to continue?`)) {
			return;
		}

		let successCount = 0;
		for (const cookie of cookies) {
			try {
				await chrome.cookies.remove({
					url: url,
					name: cookie.name,
				});
				successCount++;
			} catch (err) {
				console.warn(`Failed to remove cookie ${cookie.name}:`, err);
			}
		}

		// Hide preview if it's showing
		const previewDiv = document.getElementById("cookiesPreview");
		previewDiv.classList.add("hidden");

		alert(`Successfully cleared ${successCount} cookie(s)!`);
	} catch (error) {
		console.error("Error clearing cookies:", error);
		alert(`Failed to clear Cookies: ${error.message}`);
	}
}
