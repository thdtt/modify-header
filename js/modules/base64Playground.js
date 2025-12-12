// Base64 Playground module

export function init() {
	const encodeBtn = document.getElementById("encodeBase64Btn");
	const decodeBtn = document.getElementById("decodeBase64Btn");
	const clearBtn = document.getElementById("clearBase64Btn");
	const copyBtn = document.getElementById("copyBase64OutputBtn");

	if (encodeBtn) {
		encodeBtn.addEventListener("click", encodeBase64);
	}

	if (decodeBtn) {
		decodeBtn.addEventListener("click", decodeBase64);
	}

	if (clearBtn) {
		clearBtn.addEventListener("click", clearBase64);
	}

	if (copyBtn) {
		copyBtn.addEventListener("click", () => {
			const output = document.getElementById("base64Output");
			const text = output.value;

			if (text) {
				navigator.clipboard
					.writeText(text)
					.then(() => {
						copyBtn.textContent = "Copied!";
						copyBtn.classList.add("copied");

						setTimeout(() => {
							copyBtn.textContent = "Copy";
							copyBtn.classList.remove("copied");
						}, 1500);
					})
					.catch((err) => {
						console.error("Failed to copy:", err);
						copyBtn.textContent = "Failed";
						setTimeout(() => {
							copyBtn.textContent = "Copy";
						}, 1500);
					});
			}
		});
	}
}

function encodeBase64() {
	const input = document.getElementById("base64Input").value;
	const output = document.getElementById("base64Output");
	const copyBtn = document.getElementById("copyBase64OutputBtn");

	localStorage.setItem("base64PlaygroundInput", input);

	if (!input) {
		output.value = "";
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("base64PlaygroundOutput");
		return;
	}

	try {
		const encoded = btoa(unescape(encodeURIComponent(input)));
		output.value = encoded;
		if (copyBtn) copyBtn.classList.remove("hidden");

		localStorage.setItem("base64PlaygroundOutput", encoded);
	} catch (error) {
		output.value = `Error: ${error.message}`;
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("base64PlaygroundOutput");
	}
}

function decodeBase64() {
	const input = document.getElementById("base64Input").value.trim();
	const output = document.getElementById("base64Output");
	const copyBtn = document.getElementById("copyBase64OutputBtn");

	localStorage.setItem("base64PlaygroundInput", input);

	if (!input) {
		output.value = "";
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("base64PlaygroundOutput");
		return;
	}

	try {
		const decoded = decodeURIComponent(escape(atob(input)));
		output.value = decoded;
		if (copyBtn) copyBtn.classList.remove("hidden");

		localStorage.setItem("base64PlaygroundOutput", decoded);
	} catch (error) {
		output.value = `Error: Invalid Base64 string - ${error.message}`;
		if (copyBtn) copyBtn.classList.add("hidden");
		localStorage.removeItem("base64PlaygroundOutput");
	}
}

function clearBase64() {
	document.getElementById("base64Input").value = "";
	document.getElementById("base64Output").value = "";
	const copyBtn = document.getElementById("copyBase64OutputBtn");
	if (copyBtn) copyBtn.classList.add("hidden");

	localStorage.removeItem("base64PlaygroundInput");
	localStorage.removeItem("base64PlaygroundOutput");
}

export function restoreState() {
	const base64Input = localStorage.getItem("base64PlaygroundInput");
	const base64Output = localStorage.getItem("base64PlaygroundOutput");
	if (base64Input) {
		document.getElementById("base64Input").value = base64Input;
	}
	if (base64Output) {
		document.getElementById("base64Output").value = base64Output;
		const copyBtn = document.getElementById("copyBase64OutputBtn");
		if (copyBtn) copyBtn.classList.remove("hidden");
	}
}
