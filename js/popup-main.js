// Main popup entry point
import * as profileManager from "./modules/profileManager.js";
import * as importExport from "./modules/importExport.js";
import * as storageManager from "./modules/storageManager.js";
import * as navigation from "./modules/navigation.js";
import * as jsonPlayground from "./modules/jsonPlayground.js";
import * as base64Playground from "./modules/base64Playground.js";
import * as jwtPlayground from "./modules/jwtPlayground.js";
import * as secretGenerator from "./modules/secretGenerator.js";
import * as autoClick from "./modules/autoClick.js";

// Initialize all modules
document.addEventListener("DOMContentLoaded", () => {
	// Core functionality
	profileManager.init();
	importExport.init();
	storageManager.init();
	navigation.init();
	navigation.restoreState();

	// Playground modules
	jsonPlayground.init();
	base64Playground.init();
	jwtPlayground.init();
	secretGenerator.init();
	autoClick.init();

	// Restore playground states
	restorePlaygroundStates();
});

function restorePlaygroundStates() {
	jsonPlayground.restoreState();
	base64Playground.restoreState();
	jwtPlayground.restoreState();
	secretGenerator.restoreState();
	autoClick.restoreState();
}
