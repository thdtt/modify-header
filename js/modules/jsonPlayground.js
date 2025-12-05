// JSON Playground module
import { escapeHtml } from "../utils/dom.js";

export function init() {
	const beautifyBtn = document.getElementById("beautifyJsonBtn");
	const minifyBtn = document.getElementById("minifyJsonBtn");
	const escapeBtn = document.getElementById("escapeJsonBtn");
	const unescapeBtn = document.getElementById("unescapeJsonBtn");
	const clearBtn = document.getElementById("clearJsonBtn");
	const copyFormattedBtn = document.getElementById("copyFormattedJsonBtn");

	if (beautifyBtn) {
		beautifyBtn.addEventListener("click", beautifyJSON);
	}

	if (minifyBtn) {
		minifyBtn.addEventListener("click", minifyJSON);
	}

	if (escapeBtn) {
		escapeBtn.addEventListener("click", escapeJSON);
	}

	if (unescapeBtn) {
		unescapeBtn.addEventListener("click", unescapeJSON);
	}

	if (clearBtn) {
		clearBtn.addEventListener("click", clearJSON);
	}

	if (copyFormattedBtn) {
		copyFormattedBtn.addEventListener("click", () => {
			const formattedOutput = document.getElementById(
				"formattedJsonOutput"
			);
			const text = formattedOutput.textContent;

			if (text) {
				navigator.clipboard
					.writeText(text)
					.then(() => {
						copyFormattedBtn.textContent = "Copied!";
						copyFormattedBtn.classList.add("copied");

						setTimeout(() => {
							copyFormattedBtn.textContent = "Copy";
							copyFormattedBtn.classList.remove("copied");
						}, 1500);
					})
					.catch((err) => {
						console.error("Failed to copy:", err);
						copyFormattedBtn.textContent = "Failed";
						setTimeout(() => {
							copyFormattedBtn.textContent = "Copy";
						}, 1500);
					});
			}
		});
	}

	document.querySelectorAll(".json-view-tab").forEach((tab) => {
		tab.addEventListener("click", () => {
			switchJsonView(tab.dataset.view);
		});
	});
}

function beautifyJSON() {
	const input = document.getElementById("jsonInput").value.trim();
	const formattedOutput = document.getElementById("formattedJsonOutput");
	const treeOutput = document.getElementById("treeJsonOutput");
	const copyBtn = document.getElementById("copyFormattedJsonBtn");

	localStorage.setItem("jsonPlaygroundInput", input);

	if (!input) {
		formattedOutput.innerHTML =
			'<div class="json-error">Please enter JSON to beautify</div>';
		treeOutput.innerHTML =
			'<div class="json-error">Please enter JSON to beautify</div>';
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("jsonPlaygroundOutput");
		return;
	}

	try {
		const parsed = JSON.parse(input);
		const formatted = JSON.stringify(parsed, null, 2);

		formattedOutput.textContent = formatted;

		if (copyBtn) copyBtn.classList.remove("hidden");

		treeOutput.innerHTML = createTreeNode(null, parsed);
		setupTreeToggleListeners();

		localStorage.setItem("jsonPlaygroundOutput", formatted);

		switchJsonView("formatted");
	} catch (error) {
		const errorMsg = `<div class="json-error">Invalid JSON: ${escapeHtml(
			error.message
		)}</div>`;
		formattedOutput.innerHTML = errorMsg;
		treeOutput.innerHTML = errorMsg;
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("jsonPlaygroundOutput");
	}
}

function minifyJSON() {
	const input = document.getElementById("jsonInput").value.trim();
	const formattedOutput = document.getElementById("formattedJsonOutput");
	const treeOutput = document.getElementById("treeJsonOutput");
	const copyBtn = document.getElementById("copyFormattedJsonBtn");

	localStorage.setItem("jsonPlaygroundInput", input);

	if (!input) {
		formattedOutput.innerHTML =
			'<div class="json-error">Please enter JSON to minify</div>';
		treeOutput.innerHTML =
			'<div class="json-error">Please enter JSON to minify</div>';
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("jsonPlaygroundOutput");
		return;
	}

	try {
		const parsed = JSON.parse(input);
		const minified = JSON.stringify(parsed);

		formattedOutput.textContent = minified;

		if (copyBtn) copyBtn.classList.remove("hidden");

		treeOutput.innerHTML = createTreeNode(null, parsed);
		setupTreeToggleListeners();

		localStorage.setItem("jsonPlaygroundOutput", minified);

		switchJsonView("formatted");
	} catch (error) {
		const errorMsg = `<div class="json-error">Invalid JSON: ${escapeHtml(
			error.message
		)}</div>`;
		formattedOutput.innerHTML = errorMsg;
		treeOutput.innerHTML = errorMsg;
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("jsonPlaygroundOutput");
	}
}

function escapeJSON() {
	const input = document.getElementById("jsonInput").value.trim();
	const formattedOutput = document.getElementById("formattedJsonOutput");
	const treeOutput = document.getElementById("treeJsonOutput");
	const copyBtn = document.getElementById("copyFormattedJsonBtn");

	localStorage.setItem("jsonPlaygroundInput", input);

	if (!input) {
		formattedOutput.innerHTML =
			'<div class="json-error">Please enter JSON to escape</div>';
		treeOutput.innerHTML =
			'<div class="json-error">Please enter JSON to escape</div>';
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("jsonPlaygroundOutput");
		return;
	}

	try {
		const parsed = JSON.parse(input);
		const escaped = JSON.stringify(JSON.stringify(parsed));

		formattedOutput.textContent = escaped;

		if (copyBtn) copyBtn.classList.remove("hidden");

		treeOutput.innerHTML = createTreeNode(null, parsed);
		setupTreeToggleListeners();

		localStorage.setItem("jsonPlaygroundOutput", escaped);

		switchJsonView("formatted");
	} catch (error) {
		const errorMsg = `<div class="json-error">Invalid JSON: ${escapeHtml(
			error.message
		)}</div>`;
		formattedOutput.innerHTML = errorMsg;
		treeOutput.innerHTML = errorMsg;
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("jsonPlaygroundOutput");
	}
}

function unescapeJSON() {
	const input = document.getElementById("jsonInput").value.trim();
	const formattedOutput = document.getElementById("formattedJsonOutput");
	const treeOutput = document.getElementById("treeJsonOutput");
	const copyBtn = document.getElementById("copyFormattedJsonBtn");

	localStorage.setItem("jsonPlaygroundInput", input);

	if (!input) {
		formattedOutput.innerHTML =
			'<div class="json-error">Please enter JSON to unescape</div>';
		treeOutput.innerHTML =
			'<div class="json-error">Please enter JSON to unescape</div>';
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("jsonPlaygroundOutput");
		return;
	}

	try {
		// Try to parse as JSON first (handles Unicode escapes automatically)
		const parsed = JSON.parse(input);

		// Custom function to stringify without escaping Unicode
		function stringifyWithUnicode(obj, indent = 0) {
			const spaces = '  '.repeat(indent);
			const nextSpaces = '  '.repeat(indent + 1);

			if (obj === null) return 'null';
			if (typeof obj === 'boolean') return obj.toString();
			if (typeof obj === 'number') return obj.toString();
			if (typeof obj === 'string') return `"${obj}"`;

			if (Array.isArray(obj)) {
				if (obj.length === 0) return '[]';
				const items = obj.map(item => `${nextSpaces}${stringifyWithUnicode(item, indent + 1)}`).join(',\n');
				return `[\n${items}\n${spaces}]`;
			}

			if (typeof obj === 'object') {
				const keys = Object.keys(obj);
				if (keys.length === 0) return '{}';
				const items = keys.map(key => {
					const value = stringifyWithUnicode(obj[key], indent + 1);
					return `${nextSpaces}"${key}": ${value}`;
				}).join(',\n');
				return `{\n${items}\n${spaces}}`;
			}

			return String(obj);
		}

		const formatted = stringifyWithUnicode(parsed, 0);

		formattedOutput.textContent = formatted;

		if (copyBtn) copyBtn.classList.remove("hidden");

		treeOutput.innerHTML = createTreeNode(null, parsed);
		setupTreeToggleListeners();

		localStorage.setItem("jsonPlaygroundOutput", formatted);

		switchJsonView("formatted");
	} catch (firstError) {
		// If direct parsing fails, try to handle it as an escaped JSON string
		try {
			const unescaped = JSON.parse(input);

			if (typeof unescaped === 'string') {
				// Try to parse the unescaped string as JSON
				try {
					const parsed = JSON.parse(unescaped);
					const formatted = JSON.stringify(parsed, null, 2);

					formattedOutput.textContent = formatted;

					if (copyBtn) copyBtn.classList.remove("hidden");

					treeOutput.innerHTML = createTreeNode(null, parsed);
					setupTreeToggleListeners();

					localStorage.setItem("jsonPlaygroundOutput", formatted);

					switchJsonView("formatted");
				} catch (e) {
					// If it's not valid JSON, just show the unescaped string
					formattedOutput.textContent = unescaped;
					treeOutput.innerHTML = '<div class="json-error">Unescaped content is not valid JSON</div>';
					if (copyBtn) copyBtn.classList.remove("hidden");
					localStorage.setItem("jsonPlaygroundOutput", unescaped);
					switchJsonView("formatted");
				}
			} else {
				throw new Error("Input format not recognized");
			}
		} catch (error) {
			const errorMsg = `<div class="json-error">Invalid input: ${escapeHtml(
				error.message
			)}</div>`;
			formattedOutput.innerHTML = errorMsg;
			treeOutput.innerHTML = errorMsg;
			if (copyBtn) copyBtn.classList.add("hidden");
			localStorage.removeItem("jsonPlaygroundOutput");
		}
	}
}

function createTreeNode(key, value, level = 0) {
	const type = value === null ? "null" : typeof value;
	const isExpandable = type === "object" && value !== null;
	const isArray = Array.isArray(value);

	let html = '<div class="json-tree-node">';

	if (isExpandable) {
		html += '<span class="json-tree-toggle">▼</span>';
	} else {
		html +=
			'<span class="json-tree-toggle" style="visibility: hidden;">▼</span>';
	}

	if (key !== null) {
		html += `<span class="json-tree-key">${escapeHtml(key)}</span>: `;
	}

	if (isExpandable) {
		const entries = isArray ? value.length : Object.keys(value).length;
		const containerType = isArray ? "Array" : "Object";
		html += `<span class="json-tree-value">${containerType}(${entries})</span>`;

		html += '<div class="json-tree-children">';
		if (isArray) {
			value.forEach((item, index) => {
				html += createTreeNode(`[${index}]`, item, level + 1);
			});
		} else {
			Object.keys(value).forEach((childKey) => {
				html += createTreeNode(childKey, value[childKey], level + 1);
			});
		}
		html += "</div>";
	} else {
		let displayValue = value;
		if (type === "string") {
			displayValue = `"${escapeHtml(value)}"`;
		}
		html += `<span class="json-tree-value ${type}">${displayValue}</span>`;
	}

	html += "</div>";
	return html;
}

function setupTreeToggleListeners() {
	const treeOutput = document.getElementById("treeJsonOutput");

	treeOutput.addEventListener("click", (e) => {
		if (e.target.classList.contains("json-tree-toggle")) {
			const node = e.target.parentElement;
			const children = node.querySelector(".json-tree-children");

			if (children) {
				children.classList.toggle("collapsed");
				e.target.textContent = children.classList.contains("collapsed")
					? "▶"
					: "▼";
			}
		}
	});
}

function switchJsonView(view) {
	document.querySelectorAll(".json-view-tab").forEach((tab) => {
		if (tab.dataset.view === view) {
			tab.classList.add("active");
		} else {
			tab.classList.remove("active");
		}
	});

	document.querySelectorAll(".json-view").forEach((viewDiv) => {
		if (
			viewDiv.id ===
			`${view === "formatted" ? "formattedJson" : "treeJson"}View`
		) {
			viewDiv.classList.add("active");
			viewDiv.classList.remove("hidden");
		} else {
			viewDiv.classList.remove("active");
			viewDiv.classList.add("hidden");
		}
	});
}

function clearJSON() {
	document.getElementById("jsonInput").value = "";
	document.getElementById("formattedJsonOutput").textContent = "";
	document.getElementById("treeJsonOutput").innerHTML = "";
	const copyBtn = document.getElementById("copyFormattedJsonBtn");
	if (copyBtn) copyBtn.classList.add("hidden");

	localStorage.removeItem("jsonPlaygroundInput");
	localStorage.removeItem("jsonPlaygroundOutput");
}

export function restoreState() {
	const jsonInput = localStorage.getItem("jsonPlaygroundInput");
	const jsonOutput = localStorage.getItem("jsonPlaygroundOutput");
	if (jsonInput) {
		document.getElementById("jsonInput").value = jsonInput;
		if (jsonOutput) {
			document.getElementById("formattedJsonOutput").textContent =
				jsonOutput;
			const copyBtn = document.getElementById("copyFormattedJsonBtn");
			if (copyBtn) copyBtn.classList.remove("hidden");

			try {
				const parsed = JSON.parse(jsonInput);
				document.getElementById("treeJsonOutput").innerHTML =
					createTreeNode(null, parsed);
				setupTreeToggleListeners();
			} catch (e) {
				// Ignore parsing errors on restore
			}
		}
	}
}
