// DOM utility functions

export function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

export function generateId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function showError(message) {
	console.error(message);
	alert(message);
}

export function downloadJSON(data, filename) {
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
