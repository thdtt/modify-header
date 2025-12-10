// QR Code Reader module

export function init() {
	const captureBtn = document.getElementById("captureQRBtn");
	const qrOutput = document.getElementById("qrOutput");
	const copyBtn = document.getElementById("copyQRBtn");

	if (captureBtn) {
		captureBtn.addEventListener("click", captureQRCode);
	}

	if (copyBtn) {
		copyBtn.addEventListener("click", () => {
			if (qrOutput.value) {
				navigator.clipboard.writeText(qrOutput.value);
				showStatus("Copied to clipboard!", "success");
			}
		});
	}

	// Listen for results from content script
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.action === "qrCaptureResult") {
			if (request.error) {
				showStatus(request.error, "error");
				qrOutput.value = "";
				copyBtn.classList.add("secret-hidden");
			} else {
				qrOutput.value = request.data;
				copyBtn.classList.remove("secret-hidden");
				localStorage.setItem("qrReaderOutput", request.data);
				showStatus("QR Code decoded successfully!", "success");
			}
			sendResponse({ received: true });
		}
		return true;
	});

	// Check for QR result from background (captured while popup was closed)
	chrome.storage.local.get(["qrResult", "qrResultTimestamp"], (data) => {
		if (data.qrResult && data.qrResultTimestamp) {
			// Only use result if it's recent (within last 30 seconds)
			const age = Date.now() - data.qrResultTimestamp;
			if (age < 30000) {
				qrOutput.value = data.qrResult;
				copyBtn.classList.remove("secret-hidden");
				localStorage.setItem("qrReaderOutput", data.qrResult);
				showStatus("QR Code decoded successfully!", "success");
				// Clear the stored result
				chrome.storage.local.remove(["qrResult", "qrResultTimestamp"]);
				return;
			}
		}

		// Restore previous output if no recent capture
		const savedOutput = localStorage.getItem("qrReaderOutput");
		if (savedOutput) {
			qrOutput.value = savedOutput;
			copyBtn.classList.remove("secret-hidden");
		}
	});
}

async function captureQRCode() {
	try {
		showStatus("Initializing capture...", "info");

		// Get active tab
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		});

		if (!tab) {
			showStatus("No active tab found", "error");
			return;
		}

		// Inject content script
		await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			files: ["js/lib/jsQR.js", "js/content/qrCapture.js"],
		});

		// Send message to start capture
		await chrome.tabs.sendMessage(tab.id, {
			action: "startQRCapture",
		});

		// Close popup to show the webpage
		window.close();
	} catch (error) {
		console.error("QR capture error:", error);
		showStatus(`Error: ${error.message}`, "error");
	}
}

function showStatus(message, type) {
	const qrStatus = document.getElementById("qrStatus");
	qrStatus.textContent = message;
	qrStatus.className = `status-message ${type}`;
	qrStatus.classList.remove("secret-hidden");

	if (type === "success" || type === "info") {
		setTimeout(() => {
			qrStatus.classList.add("hidden");
		}, 3000);
	}
}

export function restoreState() {
	// State is restored in init()
}
