// Auto Clicker module

export function init() {
	const getCoordinateBtn = document.getElementById("getCoordinateBtn");
	const startBtn = document.getElementById("startAutoClickBtn");
	const stopBtn = document.getElementById("stopAutoClickBtn");
	const xInput = document.getElementById("clickX");
	const yInput = document.getElementById("clickY");
	const intervalInput = document.getElementById("clickInterval");

	if (getCoordinateBtn) {
		getCoordinateBtn.addEventListener("click", handleGetCoordinate);
	}

	if (startBtn) {
		startBtn.addEventListener("click", handleStart);
	}

	if (stopBtn) {
		stopBtn.addEventListener("click", handleStop);
	}

	// Save inputs on change
	[xInput, yInput, intervalInput].forEach((input) => {
		if (input) {
			input.addEventListener("change", saveState);
			input.addEventListener("input", saveState);
		}
	});
}

export async function restoreState() {
	const data = await chrome.storage.local.get("autoClickState");
	const state = data.autoClickState || {};

	if (state.x) document.getElementById("clickX").value = state.x;
	if (state.y) document.getElementById("clickY").value = state.y;
	if (state.interval)
		document.getElementById("clickInterval").value = state.interval;

	// Check if running
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	if (tabs[0]?.id) {
		const result = await chrome.scripting.executeScript({
			target: { tabId: tabs[0].id },
			func: () => !!window.__autoClickerInterval,
		});

		if (result[0]?.result) {
			updateUI(true);
		} else {
			updateUI(false);
		}
	}
}

function saveState() {
	const state = {
		x: document.getElementById("clickX").value,
		y: document.getElementById("clickY").value,
		interval: document.getElementById("clickInterval").value,
	};
	chrome.storage.local.set({ autoClickState: state });
}

async function handleGetCoordinate() {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	if (!tabs[0]?.id) return;

	const status = document.getElementById("coordStatus");
	status.classList.remove("hidden");
	status.textContent = "Click anywhere on the page...";

	// Inject script to capture click
	await chrome.scripting.executeScript({
		target: { tabId: tabs[0].id },
		func: () => {
			const handler = (e) => {
				e.preventDefault();
				e.stopPropagation();

				const x = e.clientX;
				const y = e.clientY;

				chrome.storage.local.set({
					autoClickState: {
						x,
						y,
						interval: 1000, // Default or preserve existing? Simplified for now
					},
				});

				document.removeEventListener("click", handler, true);

				// Visual feedback
				const feedback = document.createElement("div");
				feedback.style.position = "fixed";
				feedback.style.left = x + "px";
				feedback.style.top = y + "px";
				feedback.style.width = "20px";
				feedback.style.height = "20px";
				feedback.style.background = "rgba(1, 107, 97, 0.5)";
				feedback.style.borderRadius = "50%";
				feedback.style.transform = "translate(-50%, -50%)";
				feedback.style.zIndex = "999999";
				feedback.style.pointerEvents = "none";
				document.body.appendChild(feedback);

				setTimeout(() => feedback.remove(), 1000);
			};

			document.addEventListener("click", handler, true);
		},
	});

	// Poll for changes or just close popup?
	// Since popup closes when clicking on page, we rely on restoreState when reopening.
	window.close();
}

async function handleStart() {
	const x = parseInt(document.getElementById("clickX").value);
	const y = parseInt(document.getElementById("clickY").value);
	const interval = parseInt(document.getElementById("clickInterval").value);

	if (isNaN(x) || isNaN(y) || isNaN(interval)) {
		alert("Please enter valid coordinates and interval");
		return;
	}

	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	if (!tabs[0]?.id) return;

	await chrome.scripting.executeScript({
		target: { tabId: tabs[0].id },
		func: (x, y, interval) => {
			if (window.__autoClickerInterval)
				clearInterval(window.__autoClickerInterval);

			window.__autoClickerInterval = setInterval(() => {
				const el = document.elementFromPoint(x, y);
				if (el) {
					el.click();

					// Visual feedback
					const pulse = document.createElement("div");
					pulse.style.position = "fixed";
					pulse.style.left = x + "px";
					pulse.style.top = y + "px";
					pulse.style.width = "20px";
					pulse.style.height = "20px";
					pulse.style.background = "rgba(244, 67, 54, 0.5)";
					pulse.style.borderRadius = "50%";
					pulse.style.transform = "translate(-50%, -50%)";
					pulse.style.zIndex = "999999";
					pulse.style.pointerEvents = "none";
					pulse.style.animation = "pulse 0.5s ease-out";

					// Add keyframes if not exists
					if (!document.getElementById("autoClickStyles")) {
						const style = document.createElement("style");
						style.id = "autoClickStyles";
						style.textContent = `
							@keyframes pulse {
								0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
								100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
							}
						`;
						document.head.appendChild(style);
					}

					document.body.appendChild(pulse);
					setTimeout(() => pulse.remove(), 500);
				}
			}, interval);
		},
		args: [x, y, interval],
	});

	updateUI(true);
}

async function handleStop() {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	if (!tabs[0]?.id) return;

	await chrome.scripting.executeScript({
		target: { tabId: tabs[0].id },
		func: () => {
			if (window.__autoClickerInterval) {
				clearInterval(window.__autoClickerInterval);
				window.__autoClickerInterval = null;
			}
		},
	});

	updateUI(false);
}

function updateUI(isRunning) {
	const startBtn = document.getElementById("startAutoClickBtn");
	const stopBtn = document.getElementById("stopAutoClickBtn");
	const status = document.getElementById("autoClickStatus");

	if (isRunning) {
		startBtn.classList.add("secret-hidden");
		stopBtn.classList.remove("secret-hidden");
		status.textContent = "Running...";
		status.classList.remove("secret-hidden");
		status.style.color = "#4caf50";
	} else {
		startBtn.classList.remove("secret-hidden");
		stopBtn.classList.add("secret-hidden");
		status.classList.add("secret-hidden");
	}
}
