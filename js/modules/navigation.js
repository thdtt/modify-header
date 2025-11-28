// Navigation module

export function init() {
	const navItems = document.querySelectorAll(".nav-item");
	navItems.forEach((item) => {
		item.addEventListener("click", () => {
			const section = item.dataset.section;
			switchSection(section);
		});
	});

	setupCollapsibleSections();
}

function switchSection(sectionName) {
	document.querySelectorAll(".nav-item").forEach((item) => {
		item.classList.remove("active");
	});
	document.querySelectorAll(".section").forEach((section) => {
		section.classList.remove("active");
	});

	const activeNavItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
	if (activeNavItem) {
		activeNavItem.classList.add("active");
	}

	if (sectionName === "modify-headers") {
		document.getElementById("modifyHeadersSection").classList.add("active");
		document.getElementById("headerTitle").textContent = "Modify Headers";
		document.getElementById("headerActions").style.display = "flex";
	} else if (sectionName === "manage-storage") {
		document.getElementById("manageStorageSection").classList.add("active");
		document.getElementById("headerTitle").textContent = "Manage Storage";
		document.getElementById("headerActions").style.display = "none";
	} else if (sectionName === "utils") {
		document.getElementById("utilsSection").classList.add("active");
		document.getElementById("headerTitle").textContent = "Utils";
		document.getElementById("headerActions").style.display = "none";
	}
}

function setupCollapsibleSections() {
	document.querySelectorAll(".utils-section-header").forEach((header) => {
		header.addEventListener("click", () => {
			const content = header.nextElementSibling;
			const isCollapsed = content.classList.contains("collapsed");

			if (isCollapsed) {
				content.classList.remove("collapsed");
				header.classList.add("expanded");
			} else {
				content.classList.add("collapsed");
				header.classList.remove("expanded");
			}
		});
	});
}
