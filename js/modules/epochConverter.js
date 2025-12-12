// Epoch Time Converter Module

let currentTimestampEl, currentDateEl, copyCurrentTimestampBtn;
let timestampInput, dateInput;
let timestampToLocal, timestampToUTC, timestampToRelative;
let dateToSeconds, dateToMilliseconds;
let dateToNowBtn;
let updateInterval;

export function init() {
	// Get DOM elements
	currentTimestampEl = document.getElementById("currentTimestamp");
	currentDateEl = document.getElementById("currentDate");
	copyCurrentTimestampBtn = document.getElementById("copyCurrentTimestamp");

	timestampInput = document.getElementById("timestampInput");
	dateInput = document.getElementById("dateInput");

	timestampToLocal = document.getElementById("timestampToLocal");
	timestampToUTC = document.getElementById("timestampToUTC");
	timestampToRelative = document.getElementById("timestampToRelative");

	dateToSeconds = document.getElementById("dateToSeconds");
	dateToMilliseconds = document.getElementById("dateToMilliseconds");

	dateToNowBtn = document.getElementById("dateToNowBtn");

	// Initialize
	updateCurrent();
	startCurrentTimestampUpdate();

	// Event listeners
	copyCurrentTimestampBtn.addEventListener("click", () =>
		copyToClipboard(currentTimestampEl.textContent)
	);
	timestampInput.addEventListener("input", onTimestampInput);
	document
		.querySelectorAll('input[name="timestampFormat"]')
		.forEach((radio) => {
			radio.addEventListener("change", onTimestampInput);
		});
	dateInput.addEventListener("input", onDateInput);
	dateToNowBtn.addEventListener("click", setDateToNow);

	// Copy buttons for date→timestamp outputs
	document.querySelectorAll(".epoch-copy-btn").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const target = e.target.dataset.target;
			const value = document.getElementById(target).textContent;
			copyToClipboard(value);
			showCopyFeedback(e.target);
		});
	});
}

function startCurrentTimestampUpdate() {
	// Update every second
	updateInterval = setInterval(updateCurrent, 1000);
}

function updateCurrent() {
	const now = Date.now();
	const seconds = Math.floor(now / 1000);

	currentTimestampEl.textContent = seconds;
	currentDateEl.textContent = formatDateTime(new Date(now));
}

function onTimestampInput() {
	const value = timestampInput.value.trim();

	if (!value) {
		timestampToLocal.textContent = "-";
		timestampToUTC.textContent = "-";
		timestampToRelative.textContent = "-";
		return;
	}

	const isMillis =
		document.querySelector('input[name="timestampFormat"]:checked')
			.value === "milliseconds";
	const timestamp = parseInt(value, 10);

	if (isNaN(timestamp)) {
		timestampToLocal.textContent = "Invalid timestamp";
		timestampToUTC.textContent = "Invalid timestamp";
		timestampToRelative.textContent = "Invalid timestamp";
		return;
	}

	try {
		const ms = isMillis ? timestamp : timestamp * 1000;
		const date = new Date(ms);

		if (isNaN(date.getTime())) {
			throw new Error("Invalid date");
		}

		timestampToLocal.textContent = formatDateTime(date);
		timestampToUTC.textContent = formatDateTimeUTC(date);
		timestampToRelative.textContent = getRelativeTime(ms);
	} catch (error) {
		timestampToLocal.textContent = "Error: " + error.message;
		timestampToUTC.textContent = "-";
		timestampToRelative.textContent = "-";
	}
}

function onDateInput() {
	const value = dateInput.value;

	if (!value) {
		dateToSeconds.textContent = "-";
		dateToMilliseconds.textContent = "-";
		hideAllCopyButtons();
		return;
	}

	try {
		const date = new Date(value);
		const ms = date.getTime();

		if (isNaN(ms)) {
			throw new Error("Invalid date");
		}

		const seconds = Math.floor(ms / 1000);

		dateToSeconds.textContent = seconds;
		dateToMilliseconds.textContent = ms;
		showAllCopyButtons();
	} catch (error) {
		dateToSeconds.textContent = "Error: " + error.message;
		dateToMilliseconds.textContent = "-";
		hideAllCopyButtons();
	}
}

function setDateToNow() {
	const now = new Date();
	// Format for datetime-local input: YYYY-MM-DDThh:mm
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");

	dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
	onDateInput();
}

function formatDateTime(date) {
	return date.toLocaleString("en-US", {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
}

function formatDateTimeUTC(date) {
	return (
		date.toLocaleString("en-US", {
			year: "numeric",
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: false,
			timeZone: "UTC",
		}) + " UTC"
	);
}

function getRelativeTime(timestamp) {
	const now = Date.now();
	const diff = now - timestamp;
	const absDiff = Math.abs(diff);

	const seconds = Math.floor(absDiff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	let result;
	if (years > 0) {
		result = `${years} year${years > 1 ? "s" : ""}`;
	} else if (months > 0) {
		result = `${months} month${months > 1 ? "s" : ""}`;
	} else if (days > 0) {
		result = `${days} day${days > 1 ? "s" : ""}`;
	} else if (hours > 0) {
		result = `${hours} hour${hours > 1 ? "s" : ""}`;
	} else if (minutes > 0) {
		result = `${minutes} minute${minutes > 1 ? "s" : ""}`;
	} else {
		result = `${seconds} second${seconds > 1 ? "s" : ""}`;
	}

	return diff > 0 ? `${result} ago` : `in ${result}`;
}

function showAllCopyButtons() {
	document.querySelectorAll(".epoch-copy-btn").forEach((btn) => {
		btn.classList.remove("hidden");
	});
}

function hideAllCopyButtons() {
	document.querySelectorAll(".epoch-copy-btn").forEach((btn) => {
		btn.classList.add("hidden");
	});
}

function copyToClipboard(text) {
	navigator.clipboard
		.writeText(text)
		.then(() => {
			console.log("Copied to clipboard:", text);
		})
		.catch((err) => {
			console.error("Failed to copy:", err);
			// Fallback
			const textArea = document.createElement("textarea");
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand("copy");
			document.body.removeChild(textArea);
		});
}

function showCopyFeedback(button) {
	const originalText = button.textContent;
	button.textContent = "Copied!";
	setTimeout(() => {
		button.textContent = originalText;
	}, 1500);
}

// Cleanup on unload
export function cleanup() {
	if (updateInterval) {
		clearInterval(updateInterval);
	}
}
