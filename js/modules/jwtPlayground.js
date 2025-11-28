// JWT Playground module

export function init() {
	const jwtInput = document.getElementById("jwtInput");
	const jwtSecret = document.getElementById("jwtSecret");
	const clearBtn = document.getElementById("clearJwtBtn");
	const verifyBtn = document.getElementById("verifyJwtBtn");

	if (jwtInput) {
		jwtInput.addEventListener("input", decodeJwt);
	}

	if (jwtSecret) {
		jwtSecret.addEventListener("input", () => {
			localStorage.setItem("jwtPlaygroundSecret", jwtSecret.value);
		});
	}

	if (clearBtn) {
		clearBtn.addEventListener("click", clearJwt);
	}

	if (verifyBtn) {
		verifyBtn.addEventListener("click", verifyJwtSignature);
	}

	document.querySelectorAll(".jwt-copy-btn").forEach((btn) => {
		btn.addEventListener("click", function () {
			const target = this.dataset.target;
			let textToCopy = "";

			if (target === "header") {
				textToCopy = document.getElementById("jwtHeader").textContent;
			} else if (target === "payload") {
				textToCopy = document.getElementById("jwtPayload").textContent;
			}

			if (textToCopy) {
				navigator.clipboard
					.writeText(textToCopy)
					.then(() => {
						this.textContent = "Copied!";
						this.classList.add("copied");

						setTimeout(() => {
							this.textContent = "Copy";
							this.classList.remove("copied");
						}, 1500);
					})
					.catch((err) => {
						console.error("Failed to copy:", err);
					});
			}
		});
	});
}

function decodeJwt() {
	const input = document.getElementById("jwtInput").value.trim();
	const headerOutput = document.getElementById("jwtHeader");
	const payloadOutput = document.getElementById("jwtPayload");
	const statusDiv = document.getElementById("jwtValidationStatus");
	const signatureStatus = document.getElementById("jwtSignatureStatus");
	const headerCopyBtn = document.querySelector('.jwt-copy-btn[data-target="header"]');
	const payloadCopyBtn = document.querySelector('.jwt-copy-btn[data-target="payload"]');

	localStorage.setItem("jwtPlaygroundInput", input);

	signatureStatus.classList.add("hidden");
	signatureStatus.classList.remove("verified", "failed");

	if (!input) {
		headerOutput.textContent = "";
		payloadOutput.textContent = "";
		statusDiv.classList.add("hidden");
		if (headerCopyBtn) headerCopyBtn.classList.add("hidden");
		if (payloadCopyBtn) payloadCopyBtn.classList.add("hidden");
		localStorage.removeItem("jwtPlaygroundHeader");
		localStorage.removeItem("jwtPlaygroundPayload");
		return;
	}

	try {
		const parts = input.split(".");

		if (parts.length !== 3) {
			throw new Error("Invalid JWT format. Expected 3 parts separated by dots.");
		}

		const header = JSON.parse(base64UrlDecode(parts[0]));
		const headerText = JSON.stringify(header, null, 2);
		headerOutput.textContent = headerText;

		const payload = JSON.parse(base64UrlDecode(parts[1]));
		const payloadText = JSON.stringify(payload, null, 2);
		payloadOutput.textContent = payloadText;

		localStorage.setItem("jwtPlaygroundHeader", headerText);
		localStorage.setItem("jwtPlaygroundPayload", payloadText);

		statusDiv.textContent = "✓ Valid JWT Format";
		statusDiv.className = "jwt-status valid";
		statusDiv.classList.remove("hidden");

		if (headerCopyBtn) headerCopyBtn.classList.remove("hidden");
		if (payloadCopyBtn) payloadCopyBtn.classList.remove("hidden");
	} catch (error) {
		headerOutput.textContent = "";
		payloadOutput.textContent = "";
		statusDiv.textContent = `✗ ${error.message}`;
		statusDiv.className = "jwt-status invalid";
		statusDiv.classList.remove("hidden");

		if (headerCopyBtn) headerCopyBtn.classList.add("hidden");
		if (payloadCopyBtn) payloadCopyBtn.classList.add("hidden");

		localStorage.removeItem("jwtPlaygroundHeader");
		localStorage.removeItem("jwtPlaygroundPayload");
	}
}

function base64UrlDecode(str) {
	let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

	const pad = base64.length % 4;
	if (pad) {
		if (pad === 1) {
			throw new Error(
				"Invalid base64url string. Length cannot be 1 more than a multiple of 4."
			);
		}
		base64 += new Array(5 - pad).join("=");
	}

	try {
		return decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		);
	} catch (e) {
		throw new Error("Invalid base64 encoding");
	}
}

async function verifyJwtSignature() {
	const jwtInput = document.getElementById("jwtInput").value.trim();
	const secret = document.getElementById("jwtSecret").value.trim();
	const statusDiv = document.getElementById("jwtSignatureStatus");

	if (!jwtInput) {
		alert("Please enter a JWT token first");
		return;
	}

	if (!secret) {
		alert("Please enter a secret to verify the signature");
		return;
	}

	try {
		const parts = jwtInput.split(".");
		if (parts.length !== 3) {
			throw new Error("Invalid JWT format");
		}

		const header = JSON.parse(base64UrlDecode(parts[0]));
		const algorithm = header.alg;

		if (algorithm !== "HS256") {
			statusDiv.textContent = `⚠ Signature verification for ${algorithm} is not supported in browser. Only HS256 is supported.`;
			statusDiv.className = "jwt-signature-status failed";
			statusDiv.classList.remove("hidden");
			return;
		}

		const signingInput = parts[0] + "." + parts[1];

		const encoder = new TextEncoder();
		const keyData = encoder.encode(secret);

		const cryptoKey = await crypto.subtle.importKey(
			"raw",
			keyData,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"]
		);

		const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(signingInput));

		const signatureArray = new Uint8Array(signature);
		let binary = "";
		for (let i = 0; i < signatureArray.length; i++) {
			binary += String.fromCharCode(signatureArray[i]);
		}
		const base64Signature = btoa(binary)
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");

		if (base64Signature === parts[2]) {
			statusDiv.textContent = "✓ Signature verified successfully!";
			statusDiv.className = "jwt-signature-status verified";
		} else {
			statusDiv.textContent = "✗ Signature verification failed. Invalid secret or corrupted token.";
			statusDiv.className = "jwt-signature-status failed";
		}

		statusDiv.classList.remove("hidden");
	} catch (error) {
		statusDiv.textContent = `✗ Error: ${error.message}`;
		statusDiv.className = "jwt-signature-status failed";
		statusDiv.classList.remove("hidden");
	}
}

function clearJwt() {
	document.getElementById("jwtInput").value = "";
	document.getElementById("jwtHeader").textContent = "";
	document.getElementById("jwtPayload").textContent = "";
	document.getElementById("jwtSecret").value = "";
	document.getElementById("jwtValidationStatus").classList.add("hidden");
	document.getElementById("jwtSignatureStatus").classList.add("hidden");

	document.querySelectorAll(".jwt-copy-btn").forEach((btn) => {
		btn.classList.add("hidden");
	});

	localStorage.removeItem("jwtPlaygroundInput");
	localStorage.removeItem("jwtPlaygroundHeader");
	localStorage.removeItem("jwtPlaygroundPayload");
	localStorage.removeItem("jwtPlaygroundSecret");
}

export function restoreState() {
	const jwtInput = localStorage.getItem("jwtPlaygroundInput");
	const jwtHeader = localStorage.getItem("jwtPlaygroundHeader");
	const jwtPayload = localStorage.getItem("jwtPlaygroundPayload");
	const jwtSecret = localStorage.getItem("jwtPlaygroundSecret");

	if (jwtInput) {
		document.getElementById("jwtInput").value = jwtInput;
	}
	if (jwtSecret) {
		document.getElementById("jwtSecret").value = jwtSecret;
	}
	if (jwtHeader) {
		document.getElementById("jwtHeader").textContent = jwtHeader;
		const headerCopyBtn = document.querySelector('.jwt-copy-btn[data-target="header"]');
		if (headerCopyBtn) headerCopyBtn.classList.remove("hidden");
	}
	if (jwtPayload) {
		document.getElementById("jwtPayload").textContent = jwtPayload;
		const payloadCopyBtn = document.querySelector('.jwt-copy-btn[data-target="payload"]');
		if (payloadCopyBtn) payloadCopyBtn.classList.remove("hidden");
	}
	if (jwtInput && jwtHeader && jwtPayload) {
		const statusDiv = document.getElementById("jwtValidationStatus");
		statusDiv.textContent = "✓ Valid JWT Format";
		statusDiv.className = "jwt-status valid";
		statusDiv.classList.remove("hidden");
	}
}
