document.addEventListener("DOMContentLoaded", () => {
  // =====================================
  // 1. GET HTML ELEMENTS
  // =====================================

  const addResourceBtn = document.getElementById("addResourceBtn");
  const resourceModal = document.getElementById("resourceModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const resourceForm = document.getElementById("resourceForm");

  const resourceTitle = document.getElementById("resourceTitle");
  const resourceCategory = document.getElementById("resourceCategory");
  const resourceCourse = document.getElementById("resourceCourse");
  const resourceFile = document.getElementById("resourceFile");
  const resourceLink = document.getElementById("resourceLink");
  const resourceDescription = document.getElementById("resourceDescription");

  const resourcesContainer = document.getElementById("resourcesContainer");
  const searchResources = document.getElementById("searchResources");
  const filterCategory = document.getElementById("filterCategory");
  const sortResources = document.getElementById("sortResources");

  const totalResources = document.getElementById("totalResources");
  const lectureNotes = document.getElementById("lectureNotes");
  const pastPapers = document.getElementById("pastPapers");
  const textbooks = document.getElementById("textbooks");

  // =====================================
  // 2. DATABASE
  // =====================================

  const DB_NAME = "StudentHubResources";
  const STORE_NAME = "resources";

  let database;
  let resources = [];
  let editingId = null;
  let fileUrls = [];

  const request = indexedDB.open(DB_NAME, 1);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, {
        keyPath: "id",
      });
    }
  };

  request.onsuccess = (event) => {
    database = event.target.result;
    loadResources();
  };

  request.onerror = () => {
    console.error("Could not open the resources database.");
    alert("There was a problem opening your resources database.");
  };

  // =====================================
  // 3. OPEN AND CLOSE MODAL
  // =====================================

  addResourceBtn.addEventListener("click", () => {
    editingId = null;
    resourceForm.reset();

    const saveBtn = document.getElementById("saveResourceBtn");
    if (saveBtn) saveBtn.textContent = "Save Resource";

    resourceModal.style.display = "flex";
  });

  closeModalBtn.addEventListener("click", closeModal);

  resourceModal.addEventListener("click", (event) => {
    if (event.target === resourceModal) {
      closeModal();
    }
  });

  function closeModal() {
    resourceModal.style.display = "none";
    resourceForm.reset();
    editingId = null;

    const saveBtn = document.getElementById("saveResourceBtn");
    if (saveBtn) saveBtn.textContent = "Save Resource";
  }

  // =====================================
  // 4. SAVE RESOURCE
  // =====================================

  resourceForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = resourceTitle.value.trim();
    const category = resourceCategory.value;
    const course = resourceCourse.value.trim();
    const link = resourceLink.value.trim();
    const description = resourceDescription.value.trim();
    const file = resourceFile.files[0];

    if (!title || !category) {
      alert("Please enter a title and select a category.");
      return;
    }

    if (link) {
      try {
        const parsedLink = new URL(link);
        if (!["http:", "https:"].includes(parsedLink.protocol)) {
          throw new Error("Invalid link");
        }
      } catch {
        alert(
          "Please enter a valid web link starting with http:// or https://.",
        );
        return;
      }
    }

    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const saveResource = (existingResource = {}) => {
      const resource = {
        id: editingId || Date.now(),
        title,
        category,
        course,
        link,
        description,
        fileName: file ? file.name : existingResource.fileName || "",
        file: file || existingResource.file || null,
        dateAdded: existingResource.dateAdded || new Date().toISOString(),
      };

      store.put(resource);

      transaction.oncomplete = () => {
        closeModal();
        loadResources();
      };

      transaction.onerror = () => {
        alert("Could not save this resource. Please try again.");
      };
    };

    if (editingId) {
      const getRequest = store.get(editingId);

      getRequest.onsuccess = () => {
        saveResource(getRequest.result || {});
      };
    } else {
      saveResource();
    }
  });

  // =====================================
  // 5. LOAD RESOURCES
  // =====================================

  function loadResources() {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resources = request.result || [];
      displayResources();
      updateOverview();
    };

    request.onerror = () => {
      console.error("Could not load resources.");
    };
  }

  // =====================================
  // 6. DISPLAY RESOURCES
  // =====================================

  function displayResources() {
    const searchText = searchResources.value.toLowerCase().trim();
    const selectedCategory = filterCategory.value;
    const selectedSort = sortResources.value;

    let filteredResources = resources.filter((resource) => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchText) ||
        (resource.course || "").toLowerCase().includes(searchText) ||
        (resource.description || "").toLowerCase().includes(searchText);

      const matchesCategory =
        selectedCategory === "All" || resource.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // SORT RESOURCES

    if (selectedSort === "newest") {
      filteredResources.sort(
        (a, b) => new Date(b.dateAdded) - new Date(a.dateAdded),
      );
    }

    if (selectedSort === "oldest") {
      filteredResources.sort(
        (a, b) => new Date(a.dateAdded) - new Date(b.dateAdded),
      );
    }

    if (selectedSort === "az") {
      filteredResources.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (selectedSort === "za") {
      filteredResources.sort((a, b) => b.title.localeCompare(a.title));
    }

    // CLEAR OLD FILE URLS

    fileUrls.forEach((url) => URL.revokeObjectURL(url));
    fileUrls = [];

    resourcesContainer.innerHTML = "";

    if (filteredResources.length === 0) {
      resourcesContainer.innerHTML = `
                <p class="empty-message">
                    No resources found.
                </p>
            `;
      return;
    }

    filteredResources.forEach((resource) => {
      const card = document.createElement("article");
      card.className = "resource-card";

      const date = new Date(resource.dateAdded).toLocaleDateString();

      let fileButton = "";

      if (resource.file) {
        const fileUrl = URL.createObjectURL(resource.file);
        fileUrls.push(fileUrl);

        fileButton = `
                    <a href="${fileUrl}" download="${escapeHTML(resource.fileName)}"
                       class="resource-open-btn">
                        <i class="bx bx-download"></i> Download File
                    </a>
                `;
      }

      let linkButton = "";

      if (resource.link) {
        linkButton = `
                    <a href="${escapeHTML(resource.link)}"
                       target="_blank"
                       rel="noopener noreferrer"
                       class="resource-open-btn">
                        <i class="bx bx-link-external"></i> Open Link
                    </a>
                `;
      }

      card.innerHTML = `
                <div class="resource-card-top">
                    <span class="resource-category">
                        ${escapeHTML(resource.category)}
                    </span>

                    <span class="resource-date">
                        ${date}
                    </span>
                </div>

                <div class="resource-info">
                    <h3>${escapeHTML(resource.title)}</h3>

                    <p class="resource-course">
                        ${escapeHTML(resource.course || "No course selected")}
                    </p>

                    <p class="resource-description">
                        ${escapeHTML(resource.description || "No description provided.")}
                    </p>

                    <p class="resource-filename">
                        ${resource.fileName ? "File: " + escapeHTML(resource.fileName) : ""}
                    </p>
                </div>

                <div class="resource-actions">
                    ${fileButton}
                    ${linkButton}

                    <button type="button" class="edit-resource-btn">
                        <i class="bx bx-edit"></i> Edit
                    </button>

                    <button type="button" class="delete-resource-btn">
                        <i class="bx bx-trash"></i> Delete
                    </button>
                </div>
            `;

      card.querySelector(".edit-resource-btn").addEventListener("click", () => {
        editResource(resource.id);
      });

      card
        .querySelector(".delete-resource-btn")
        .addEventListener("click", () => {
          deleteResource(resource.id);
        });

      resourcesContainer.appendChild(card);
    });
  }

  // =====================================
  // 7. EDIT RESOURCE
  // =====================================

  function editResource(id) {
    const resource = resources.find((item) => item.id === id);

    if (!resource) return;

    editingId = id;

    resourceTitle.value = resource.title;
    resourceCategory.value = resource.category;
    resourceCourse.value = resource.course || "";
    resourceLink.value = resource.link || "";
    resourceDescription.value = resource.description || "";

    // File inputs cannot be filled automatically for security reasons.
    resourceFile.value = "";

    const saveBtn = document.getElementById("saveResourceBtn");
    if (saveBtn) saveBtn.textContent = "Update Resource";

    resourceModal.style.display = "flex";
  }

  // =====================================
  // 8. DELETE RESOURCE
  // =====================================

  function deleteResource(id) {
    const confirmed = confirm("Are you sure you want to delete this resource?");

    if (!confirmed) return;

    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.delete(id);

    transaction.oncomplete = () => {
      loadResources();
    };

    transaction.onerror = () => {
      alert("Could not delete this resource.");
    };
  }

  // =====================================
  // 9. SEARCH, FILTER AND SORT
  // =====================================

  searchResources.addEventListener("input", displayResources);

  filterCategory.addEventListener("change", displayResources);

  sortResources.addEventListener("change", displayResources);

  // =====================================
  // 10. UPDATE OVERVIEW CARDS
  // =====================================

  function updateOverview() {
    totalResources.textContent = resources.length;

    lectureNotes.textContent = resources.filter(
      (resource) => resource.category === "Lecture Notes",
    ).length;

    pastPapers.textContent = resources.filter(
      (resource) => resource.category === "Past Papers",
    ).length;

    textbooks.textContent = resources.filter(
      (resource) => resource.category === "Textbooks",
    ).length;
  }

  // =====================================
  // 11. PREVENT HTML INJECTION
  // =====================================

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };

      return replacements[character];
    });
  }

  // =====================================
  // 12. INITIAL SETUP
  // =====================================

  console.log("StudentHub Resources is ready!");
});
