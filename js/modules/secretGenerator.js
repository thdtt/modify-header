// Secret Generator module

export function init() {
	const typeRadios = document.querySelectorAll('input[name="secretType"]');
	const regenerateBtn = document.getElementById('regenerateSecretBtn');
	const copyBtn = document.getElementById('copySecretBtn');

	const randomLength = document.getElementById('randomLength');
	const slugWords = document.getElementById('slugWords');
	const pinLength = document.getElementById('pinLength');

	if (randomLength) {
		randomLength.addEventListener('input', (e) => {
			document.getElementById('randomLengthValue').textContent = e.target.value;
		});
	}

	if (slugWords) {
		slugWords.addEventListener('input', (e) => {
			document.getElementById('slugWordsValue').textContent = e.target.value;
		});
	}

	if (pinLength) {
		pinLength.addEventListener('input', (e) => {
			document.getElementById('pinLengthValue').textContent = e.target.value;
		});
	}

	typeRadios.forEach(radio => {
		radio.addEventListener('change', (e) => {
			showSecretOptions(e.target.value);
		});
	});

	if (regenerateBtn) {
		regenerateBtn.addEventListener('click', generateSecret);
	}

	if (copyBtn) {
		copyBtn.addEventListener('click', () => {
			const output = document.getElementById('secretOutput');
			const text = output.value;

			if (text) {
				navigator.clipboard.writeText(text).then(() => {
					const originalText = copyBtn.textContent;
					copyBtn.textContent = 'Copied!';
					copyBtn.classList.add('btn-primary');
					copyBtn.classList.remove('btn-secondary');

					setTimeout(() => {
						copyBtn.textContent = originalText;
						copyBtn.classList.remove('btn-primary');
						copyBtn.classList.add('btn-secondary');
					}, 1500);
				}).catch((err) => {
					console.error('Failed to copy:', err);
				});
			}
		});
	}

	showSecretOptions('random');
}

function showSecretOptions(type) {
	document.getElementById('randomOptions').classList.add('secret-hidden');
	document.getElementById('slugOptions').classList.add('secret-hidden');
	document.getElementById('pinOptions').classList.add('secret-hidden');

	if (type === 'random') {
		document.getElementById('randomOptions').classList.remove('secret-hidden');
	} else if (type === 'slug') {
		document.getElementById('slugOptions').classList.remove('secret-hidden');
	} else if (type === 'pin') {
		document.getElementById('pinOptions').classList.remove('secret-hidden');
	}
}

function generateSecret() {
	const selectedType = document.querySelector('input[name="secretType"]:checked').value;
	const output = document.getElementById('secretOutput');

	let secret = '';

	if (selectedType === 'random') {
		secret = generateRandomString();
	} else if (selectedType === 'slug') {
		secret = generateSlugString();
	} else if (selectedType === 'pin') {
		secret = generatePinCode();
	}

	output.value = secret;
}

function generateRandomString() {
	const length = parseInt(document.getElementById('randomLength').value);
	const includeUppercase = document.getElementById('includeUppercase').checked;
	const includeLowercase = document.getElementById('includeLowercase').checked;
	const includeNumbers = document.getElementById('includeNumbers').checked;
	const includeSpecial = document.getElementById('includeSpecial').checked;
	const includeSymbols = document.getElementById('includeSymbols').checked;

	let chars = '';
	if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
	if (includeNumbers) chars += '0123456789';
	if (includeSpecial) chars += '!@#$%^&*';
	if (includeSymbols) chars += '+=[]{}|;:,.<>?';

	if (chars === '') {
		return 'Please select at least one character type';
	}

	let result = '';
	const array = new Uint32Array(length);
	crypto.getRandomValues(array);

	for (let i = 0; i < length; i++) {
		result += chars[array[i] % chars.length];
	}

	return result;
}

function generateSlugString() {
	// Import COMMON_WORDS and SHORT_WORDS from global scope (loaded from words.js)
	const numWords = parseInt(document.getElementById('slugWords').value);
	const capitalize = document.getElementById('slugCapitalize').checked;
	const fullWord = document.getElementById('slugFullWord').checked;

	const wordList = fullWord ? window.COMMON_WORDS : window.SHORT_WORDS;
	const selectedWords = [];

	const array = new Uint32Array(numWords);
	crypto.getRandomValues(array);

	for (let i = 0; i < numWords; i++) {
		const index = array[i] % wordList.length;
		let word = wordList[index];

		if (capitalize) {
			word = word.charAt(0).toUpperCase() + word.slice(1);
		}

		selectedWords.push(word);
	}

	return selectedWords.join('-');
}

function generatePinCode() {
	const length = parseInt(document.getElementById('pinLength').value);
	const array = new Uint32Array(length);
	crypto.getRandomValues(array);

	let pin = '';
	for (let i = 0; i < length; i++) {
		pin += array[i] % 10;
	}

	return pin;
}
