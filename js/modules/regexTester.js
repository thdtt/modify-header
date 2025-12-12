// RegEx Tester Module

let patternInput, flagsInput, testStringInput;
let highlightArea, matchDetails, matchCount, errorDiv;

export function init() {
	patternInput = document.getElementById("regexPattern");
	flagsInput = document.getElementById("regexFlags");
	testStringInput = document.getElementById("regexTestString");
	highlightArea = document.getElementById("regexHighlight");
	matchDetails = document.getElementById("regexMatchDetails");
	matchCount = document.getElementById("matchCount");
	errorDiv = document.getElementById("regexError");

	if (!patternInput) return;

	// Event listeners for live testing
	patternInput.addEventListener("input", debounce(runTest, 150));
	flagsInput.addEventListener("input", debounce(runTest, 150));
	testStringInput.addEventListener("input", debounce(runTest, 150));

	// Common pattern buttons
	document.querySelectorAll(".regex-pattern-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			patternInput.value = btn.dataset.pattern;
			flagsInput.value = btn.dataset.flags || "g";
			runTest();
			patternInput.focus();
		});
	});
}

function runTest() {
	const pattern = patternInput.value;
	const flags = flagsInput.value;
	const testString = testStringInput.value;

	// Clear previous results
	errorDiv.classList.add("hidden");
	errorDiv.textContent = "";

	// Handle empty pattern
	if (!pattern) {
		highlightArea.innerHTML =
			escapeHtml(testString) ||
			'<span class="regex-placeholder">Matches will be highlighted here...</span>';
		matchDetails.innerHTML =
			'<span class="regex-placeholder">No matches yet</span>';
		matchCount.textContent = "(0)";
		return;
	}

	// Handle empty test string
	if (!testString) {
		highlightArea.innerHTML =
			'<span class="regex-placeholder">Matches will be highlighted here...</span>';
		matchDetails.innerHTML =
			'<span class="regex-placeholder">No matches yet</span>';
		matchCount.textContent = "(0)";
		return;
	}

	try {
		const regex = new RegExp(pattern, flags);
		const matches = [];
		let match;
		let lastIndex = 0;
		let highlighted = "";
		let iterations = 0;
		const maxIterations = 10000;

		// Reset regex for global patterns
		regex.lastIndex = 0;

		if (flags.includes("g")) {
			while (
				(match = regex.exec(testString)) !== null &&
				iterations < maxIterations
			) {
				iterations++;

				// Prevent infinite loops on zero-length matches
				if (match.index === regex.lastIndex) {
					regex.lastIndex++;
				}

				matches.push({
					value: match[0],
					index: match.index,
					groups: match.slice(1),
				});

				// Build highlighted string
				highlighted += escapeHtml(
					testString.slice(lastIndex, match.index)
				);
				highlighted += `<mark class="regex-match">${escapeHtml(
					match[0]
				)}</mark>`;
				lastIndex = match.index + match[0].length;
			}
			highlighted += escapeHtml(testString.slice(lastIndex));
		} else {
			match = regex.exec(testString);
			if (match) {
				matches.push({
					value: match[0],
					index: match.index,
					groups: match.slice(1),
				});

				highlighted = escapeHtml(testString.slice(0, match.index));
				highlighted += `<mark class="regex-match">${escapeHtml(
					match[0]
				)}</mark>`;
				highlighted += escapeHtml(
					testString.slice(match.index + match[0].length)
				);
			} else {
				highlighted = escapeHtml(testString);
			}
		}

		// Update highlight area
		highlightArea.innerHTML = highlighted || escapeHtml(testString);

		// Update match count
		matchCount.textContent = `(${matches.length})`;

		// Update match details
		if (matches.length > 0) {
			matchDetails.innerHTML = matches
				.slice(0, 50) // Limit displayed matches
				.map((m, i) => {
					let detail = `<div class="regex-match-item">
						<span class="regex-match-index">#${i + 1}</span>
						<span class="regex-match-value">"${escapeHtml(m.value)}"</span>
						<span class="regex-match-position">pos: ${m.index}</span>`;

					if (m.groups.length > 0) {
						detail += `<span class="regex-match-groups">groups: [${m.groups
							.map((g) => `"${escapeHtml(g || "")}"`)
							.join(", ")}]</span>`;
					}

					detail += "</div>";
					return detail;
				})
				.join("");

			if (matches.length > 50) {
				matchDetails.innerHTML += `<div class="regex-match-more">... and ${
					matches.length - 50
				} more matches</div>`;
			}
		} else {
			matchDetails.innerHTML =
				'<span class="regex-placeholder">No matches found</span>';
		}
	} catch (e) {
		errorDiv.textContent = e.message;
		errorDiv.classList.remove("hidden");
		highlightArea.innerHTML = escapeHtml(testString);
		matchDetails.innerHTML =
			'<span class="regex-placeholder">Invalid pattern</span>';
		matchCount.textContent = "(0)";
	}
}

function escapeHtml(text) {
	if (!text) return "";
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

export function restoreState() {
	// Could restore last pattern/test string from localStorage if needed
}
