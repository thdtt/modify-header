// QR Code capture content script
(function () {
	// Always set up message listener (even if elements exist)
	if (!window.__mh_qrCaptureInitialized) {
		window.__mh_qrCaptureInitialized = true;
		window.__mh_isDragging = false;
		window.__mh_startX = 0;
		window.__mh_startY = 0;

		chrome.runtime.onMessage.addListener(
			(message, sender, sendResponse) => {
				if (message.action === "startQRCapture") {
					sendResponse("beginCapture");
					showGrayLayout();
				} else if (message.action === "sendCaptureUrl") {
					qrDecode(
						message.url,
						message.captureBoxLeft,
						message.captureBoxTop,
						message.captureBoxWidth,
						message.captureBoxHeight
					);
				}
				return true;
			}
		);

		// ESC key handler
		window.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				event.preventDefault();
				cleanup();
			}
		});
	}

	function showGrayLayout() {
		// Remove existing elements first
		cleanup(true);

		// Create hidden canvas for QR decoding
		const qrCanvas = document.createElement("canvas");
		qrCanvas.id = "__mh_qrCanvas__";
		qrCanvas.style.display = "none";
		document.body.appendChild(qrCanvas);

		// Create overlay
		const grayLayout = document.createElement("div");
		grayLayout.id = "__mh_grayLayout__";
		grayLayout.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: rgba(0, 0, 0, 0.5);
			z-index: 2147483647;
			cursor: crosshair;
			display: block;
		`;
		document.body.appendChild(grayLayout);

		// Create instruction
		const instruction = document.createElement("div");
		instruction.id = "__mh_instruction__";
		instruction.style.cssText = `
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: white;
			padding: 20px 40px;
			border-radius: 8px;
			font-size: 16px;
			font-weight: 600;
			color: #333;
			box-shadow: 0 4px 20px rgba(0,0,0,0.3);
			pointer-events: none;
			font-family: system-ui, -apple-system, sans-serif;
			text-align: center;
			z-index: 2147483648;
		`;
		instruction.innerHTML = `
			<div style="font-size: 18px; margin-bottom: 10px;">📷 Select QR Code Area</div>
			<div style="font-size: 14px; color: #666;">Click and drag to select the QR code</div>
			<div style="font-size: 12px; color: #999; margin-top: 8px;">Press ESC to cancel</div>
		`;
		grayLayout.appendChild(instruction);

		// Create capture box
		const captureBox = document.createElement("div");
		captureBox.id = "__mh_captureBox__";
		captureBox.style.cssText = `
			position: fixed;
			border: 2px dashed #016b61;
			background: rgba(1, 107, 97, 0.1);
			display: none;
			z-index: 2147483648;
			pointer-events: none;
		`;
		grayLayout.appendChild(captureBox);

		// Event listeners
		grayLayout.addEventListener("mousedown", onMouseDown);
		grayLayout.addEventListener("mousemove", onMouseMove);
		grayLayout.addEventListener("mouseup", onMouseUp);
		grayLayout.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			return false;
		});

		// Hide instruction after 2 seconds
		setTimeout(() => {
			if (instruction && instruction.parentNode) {
				instruction.style.opacity = "0";
				instruction.style.transition = "opacity 0.3s";
				setTimeout(() => instruction.remove(), 300);
			}
		}, 2000);
	}

	function onMouseDown(event) {
		if (event.button !== 0) {
			event.preventDefault();
			return;
		}

		const captureBox = document.getElementById("__mh_captureBox__");
		if (!captureBox) return;

		window.__mh_isDragging = true;
		window.__mh_startX = event.clientX;
		window.__mh_startY = event.clientY;

		captureBox.style.left = event.clientX + "px";
		captureBox.style.top = event.clientY + "px";
		captureBox.style.width = "1px";
		captureBox.style.height = "1px";
		captureBox.style.display = "block";

		// Hide instruction
		const instruction = document.getElementById("__mh_instruction__");
		if (instruction) {
			instruction.style.display = "none";
		}
	}

	function onMouseMove(event) {
		if (!window.__mh_isDragging) return;

		const captureBox = document.getElementById("__mh_captureBox__");
		if (!captureBox) return;

		const startX = window.__mh_startX;
		const startY = window.__mh_startY;

		const left = Math.min(startX, event.clientX);
		const top = Math.min(startY, event.clientY);
		const width = Math.abs(startX - event.clientX);
		const height = Math.abs(startY - event.clientY);

		captureBox.style.left = left + "px";
		captureBox.style.top = top + "px";
		captureBox.style.width = width + "px";
		captureBox.style.height = height + "px";
	}

	function onMouseUp(event) {
		if (!window.__mh_isDragging) return;
		window.__mh_isDragging = false;

		const grayLayout = document.getElementById("__mh_grayLayout__");
		const captureBox = document.getElementById("__mh_captureBox__");
		if (!captureBox || !grayLayout) return;

		if (event.button !== 0) {
			event.preventDefault();
			return;
		}

		const startX = window.__mh_startX;
		const startY = window.__mh_startY;

		const captureBoxLeft = Math.min(startX, event.clientX);
		const captureBoxTop = Math.min(startY, event.clientY);
		const captureBoxWidth = Math.abs(startX - event.clientX);
		const captureBoxHeight = Math.abs(startY - event.clientY);

		// Minimum size check
		if (captureBoxWidth < 20 || captureBoxHeight < 20) {
			cleanup();
			return;
		}

		// Hide overlay immediately
		captureBox.style.display = "none";
		grayLayout.style.display = "none";

		// Wait for overlay to hide, then request capture from background
		setTimeout(() => {
			chrome.runtime.sendMessage({
				action: "getCapture",
				info: {
					captureBoxLeft,
					captureBoxTop,
					captureBoxWidth,
					captureBoxHeight,
				},
			});
		}, 150);
	}

	function qrDecode(url, left, top, width, height) {
		const canvas = document.getElementById("__mh_qrCanvas__");
		if (!canvas) {
			console.error("QR Canvas not found");
			return;
		}

		const img = new Image();
		img.onload = () => {
			try {
				// Calculate device pixel ratio from image vs window size
				const devicePixelRatio = img.width / window.innerWidth;

				// Draw full image to canvas
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0);

				// Get image data for selected area (scaled by device pixel ratio)
				const scaledLeft = Math.round(left * devicePixelRatio);
				const scaledTop = Math.round(top * devicePixelRatio);
				const scaledWidth = Math.round(width * devicePixelRatio);
				const scaledHeight = Math.round(height * devicePixelRatio);

				const imageData = ctx.getImageData(
					scaledLeft,
					scaledTop,
					scaledWidth,
					scaledHeight
				);

				// Decode QR code using jsQR
				if (typeof jsQR === "undefined") {
					alert("QR decoder not loaded. Please try again.");
					cleanup(true);
					return;
				}

				const code = jsQR(
					imageData.data,
					imageData.width,
					imageData.height,
					{
						inversionAttempts: "attemptBoth",
					}
				);

				if (code && code.data) {
					// Send result back to extension
					chrome.runtime.sendMessage({
						action: "qrResult",
						data: code.data,
					});
					cleanup(true);
				} else {
					alert(
						"No QR code found in selected area. Try selecting a larger or clearer area."
					);
					cleanup(true);
				}
			} catch (err) {
				console.error("QR decode error:", err);
				alert("Error decoding QR code: " + err.message);
				cleanup(true);
			}
		};

		img.onerror = () => {
			alert("Failed to load captured image.");
			cleanup(true);
		};

		img.src = url;
	}

	function cleanup(removeElements) {
		window.__mh_isDragging = false;

		const grayLayout = document.getElementById("__mh_grayLayout__");
		const captureBox = document.getElementById("__mh_captureBox__");
		const qrCanvas = document.getElementById("__mh_qrCanvas__");

		if (removeElements) {
			if (grayLayout) grayLayout.remove();
			if (qrCanvas) qrCanvas.remove();
		} else {
			if (grayLayout) grayLayout.style.display = "none";
			if (captureBox) captureBox.style.display = "none";
		}
	}

	// Expose functions to window for debugging
	window.__mh_showGrayLayout = showGrayLayout;
	window.__mh_cleanup = cleanup;
})();
