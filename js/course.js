// ===================================
// STUDENTHUB - COURSE WORKSPACE
// ===================================

// GET COURSE ID FROM URL
const params = new URLSearchParams(window.location.search);
const courseId = Number(params.get("id"));

// GET HTML ELEMENTS
const workspaceCourseName = document.getElementById("workspaceCourseName");
const workspaceCourseDetails = document.getElementById(
  "workspaceCourseDetails",
);

const workspaceProgress = document.getElementById("workspaceProgress");
const resourceCount = document.getElementById("resourceCount");
const assignmentCount = document.getElementById("assignmentCount");
const deadlineCount = document.getElementById("deadlineCount");

const fileResourceForm = document.getElementById("fileResourceForm");
const linkResourceForm = document.getElementById("linkResourceForm");
const assignmentForm = document.getElementById("assignmentForm");

const resourcesContainer = document.getElementById("resourcesContainer");
const resourceSearch = document.getElementById("resourceSearch");
const resourceCategoryFilter = document.getElementById(
  "resourceCategoryFilter",
);
const resourceSort = document.getElementById("resourceSort");
const assignmentsContainer = document.getElementById("assignmentsContainer");
const deadlinesContainer = document.getElementById("deadlinesContainer");

// ASSIGNMENT PROGRESS ELEMENTS
const progressTotal = document.getElementById("progressTotal");
const progressCompleted = document.getElementById("progressCompleted");
const progressPending = document.getElementById("progressPending");
const progressPercentage = document.getElementById("progressPercentage");
const assignmentProgressBar = document.getElementById("assignmentProgressBar");
const progressMessage = document.getElementById("progressMessage");

// ===================================
// LOAD THE SELECTED COURSE
// ===================================

let allCourses = [];

try {
  allCourses = JSON.parse(localStorage.getItem("studentHubCourses")) || [];
} catch (error) {
  allCourses = [];
}

const currentCourse = allCourses.find(
  (course) => Number(course.id) === courseId,
);

if (!currentCourse) {
  workspaceCourseName.textContent = "Course not found";
  workspaceCourseDetails.textContent =
    "This course could not be found. Return to My Courses.";
  document.querySelector("main").style.display = "none";
  throw new Error("Course not found.");
}

// DISPLAY COURSE INFORMATION
document.title = `${currentCourse.name} | Study Portal`;

workspaceCourseName.textContent = currentCourse.name;

workspaceCourseDetails.textContent = `${currentCourse.code} · ${currentCourse.semester} · ${currentCourse.year}`;

workspaceProgress.textContent = `${currentCourse.progress}%`;

// ===================================
// INDEXEDDB - FILE STORAGE
// ===================================

let database;

const databaseRequest = indexedDB.open("StudentHubDatabase", 1);

databaseRequest.onupgradeneeded = (event) => {
  database = event.target.result;

  if (!database.objectStoreNames.contains("resources")) {
    database.createObjectStore("resources", {
      keyPath: "id",
    });
  }
};

databaseRequest.onsuccess = (event) => {
  database = event.target.result;
  displayResources();
};

databaseRequest.onerror = () => {
  alert("Could not open the file storage database.");
};

// SAVE RESOURCE TO INDEXEDDB
function saveResource(resource) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("resources", "readwrite");
    const store = transaction.objectStore("resources");

    store.put(resource);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// GET RESOURCES FOR THIS COURSE
function getResources() {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("resources", "readonly");
    const store = transaction.objectStore("resources");
    const request = store.getAll();

    request.onsuccess = () => {
      const courseResources = request.result.filter(
        (resource) => Number(resource.courseId) === courseId,
      );

      resolve(courseResources);
    };

    request.onerror = () => reject(request.error);
  });
}

// DELETE RESOURCE FROM INDEXEDDB
function deleteResource(id) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("resources", "readwrite");
    const store = transaction.objectStore("resources");

    store.delete(id);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ===================================
// HELPER FUNCTIONS
// ===================================

// GENERATE UNIQUE IDs
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// PREVENT HTML INJECTION
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

// ===================================
// FILE UPLOAD
// ===================================

fileResourceForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!database) {
    alert("File storage is still loading. Please try again.");
    return;
  }

  const fileInput = document.getElementById("resourceFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please choose a file first.");
    return;
  }

  const allowedExtensions = [
    "pdf",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "txt",
  ];

  const extension = file.name.split(".").pop().toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    alert("This file type is not supported.");
    return;
  }

  const category = document.getElementById("fileResourceCategory").value;

  const resource = {
    id: generateId(),
    courseId,
    name: file.name,
    type: "file",
    file: file,
    category: category,
    dateAdded: new Date().toISOString(),
  };

  try {
    await saveResource(resource);

    fileResourceForm.reset();
    displayResources();

    alert("File uploaded successfully!");
  } catch (error) {
    alert("Could not save this file. Please try again.");
  }
});

// ===================================
// ADD EXTERNAL RESOURCE LINK
// ===================================

linkResourceForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!database) {
    alert("File storage is still loading. Please try again.");
    return;
  }

  const title = document.getElementById("resourceTitle").value.trim();
  const urlValue = document.getElementById("resourceUrl").value.trim();

  let validURL;

  try {
    validURL = new URL(urlValue);
  } catch (error) {
    alert("Please enter a valid web address.");
    return;
  }

  if (!["http:", "https:"].includes(validURL.protocol)) {
    alert("Only HTTP and HTTPS links are allowed.");
    return;
  }

  const category = document.getElementById("linkResourceCategory").value;

  const resource = {
    id: generateId(),
    courseId,
    name: title,
    type: "link",
    url: validURL.href,
    category: category,
    dateAdded: new Date().toISOString(),
  };

  try {
    await saveResource(resource);

    linkResourceForm.reset();
    displayResources();

    alert("Resource link saved successfully!");
  } catch (error) {
    alert("Could not save this resource link.");
  }
});

// ===================================
// DISPLAY RESOURCES
// ===================================

async function displayResources() {
  if (!database) return;

  try {
    const resources = await getResources();
    const searchValue = resourceSearch.value.trim().toLowerCase();
    const selectedCategory = resourceCategoryFilter.value;

    const filteredResources = resources.filter((resource) => {
      const matchesSearch = resource.name.toLowerCase().includes(searchValue);

      const category = resource.category || "Other Resources";

      const matchesCategory =
        selectedCategory === "All" || category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    const sortValue = resourceSort.value;

    filteredResources.sort((a, b) => {
      if (sortValue === "newest") {
        return new Date(b.dateAdded) - new Date(a.dateAdded);
      }

      if (sortValue === "oldest") {
        return new Date(a.dateAdded) - new Date(b.dateAdded);
      }

      if (sortValue === "az") {
        return a.name.localeCompare(b.name);
      }

      if (sortValue === "za") {
        return b.name.localeCompare(a.name);
      }

      return 0;
    });

    resourceCount.textContent = resources.length;

    if (resources.length === 0) {
      resourcesContainer.innerHTML =
        '<p class="empty-message">No resources added yet.</p>';
      return;
    }

    if (filteredResources.length === 0) {
      resourcesContainer.innerHTML =
        '<p class="empty-message">No matching resources found.</p>';
      return;
    }

    resourcesContainer.innerHTML = "";

    filteredResources.forEach((resource) => {
      const item = document.createElement("div");
      item.className = "resource-item";

      const isFile = resource.type === "file";

      const fileURL = isFile
        ? URL.createObjectURL(resource.file)
        : resource.url;

      const information = document.createElement("div");
      information.className = "item-information";

      information.innerHTML = `
        <h4>${escapeHTML(resource.name)}</h4>
        <p class="resource-type">
          ${isFile ? "Uploaded File" : "External Link"}
        </p>
        <p class="resource-category">
          ${escapeHTML(resource.category || "Other Resources")}
        </p>
      `;

      const actions = document.createElement("div");
      actions.className = "resource-actions";

      const openLink = document.createElement("a");
      openLink.className = "resource-open-link";
      openLink.href = fileURL;
      openLink.target = "_blank";
      openLink.rel = "noopener noreferrer";
      openLink.textContent = isFile ? "Open / Download" : "Open Link";

      if (isFile) {
        openLink.download = resource.name;
      }

      const editButton = document.createElement("button");
      editButton.className = "edit-resource-btn";
      editButton.dataset.id = resource.id;
      editButton.textContent = "Edit";

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-resource-btn";
      deleteButton.dataset.id = resource.id;
      deleteButton.textContent = "Delete";

      actions.append(openLink, editButton, deleteButton);
      item.append(information, actions);

      resourcesContainer.appendChild(item);
    });
  } catch (error) {
    console.error("Resource loading error:", error);

    resourcesContainer.innerHTML =
      '<p class="empty-message">Could not load resources.</p>';
  }
}

// EDIT OR DELETE RESOURCE
resourcesContainer.addEventListener("click", async (event) => {
  const editButton = event.target.closest(".edit-resource-btn");
  const deleteButton = event.target.closest(".delete-resource-btn");

  // EDIT RESOURCE
  if (editButton) {
    try {
      const resources = await getResources();

      const resource = resources.find(
        (item) => item.id === editButton.dataset.id,
      );

      if (!resource) return;

      const updatedName = prompt("Enter the resource name:", resource.name);

      if (updatedName === null) return;

      if (!updatedName.trim()) {
        alert("Resource name cannot be empty.");
        return;
      }

      const updatedCategory = prompt(
        "Enter category:\nLecture Notes\nTextbooks\nPresentations\nVideos\nPast Papers\nOther Resources",
        resource.category || "Other Resources",
      );

      if (updatedCategory === null) return;

      const categories = [
        "Lecture Notes",
        "Textbooks",
        "Presentations",
        "Videos",
        "Past Papers",
        "Other Resources",
      ];

      if (!categories.includes(updatedCategory.trim())) {
        alert("Please enter one of the listed categories exactly.");
        return;
      }

      // Update external link URL
      if (resource.type === "link") {
        const updatedUrl = prompt(
          "Enter the updated resource URL:",
          resource.url,
        );

        if (updatedUrl === null) return;

        try {
          const validURL = new URL(updatedUrl.trim());

          if (!["http:", "https:"].includes(validURL.protocol)) {
            alert("Only HTTP and HTTPS links are allowed.");
            return;
          }

          resource.url = validURL.href;
        } catch (error) {
          alert("Please enter a valid web address.");
          return;
        }
      }

      resource.name = updatedName.trim();
      resource.category = updatedCategory.trim();

      await saveResource(resource);

      await displayResources();

      alert("Resource updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Could not update this resource.");
    }

    return;
  }

  // DELETE RESOURCE
  if (deleteButton) {
    const confirmed = confirm("Delete this resource?");

    if (!confirmed) return;

    try {
      await deleteResource(deleteButton.dataset.id);
      await displayResources();
    } catch (error) {
      alert("Could not delete this resource.");
    }
  }
});

// ===================================
// ASSIGNMENTS - LOCAL STORAGE
// ===================================

const assignmentStorageKey = `studentHubAssignments_${courseId}`;

let assignments = [];

try {
  assignments = JSON.parse(localStorage.getItem(assignmentStorageKey)) || [];
} catch (error) {
  assignments = [];
}

// SAVE ASSIGNMENTS
function saveAssignments() {
  localStorage.setItem(assignmentStorageKey, JSON.stringify(assignments));
}

// ===================================
// ASSIGNMENT PROGRESS TRACKING
// ===================================

function updateAssignmentProgress() {
  const total = assignments.length;

  const completed = assignments.filter(
    (assignment) => assignment.status === "Completed",
  ).length;

  const pending = total - completed;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Update numbers
  progressTotal.textContent = total;
  progressCompleted.textContent = completed;
  progressPending.textContent = pending;
  progressPercentage.textContent = `${percentage}%`;

  // Update progress bar
  assignmentProgressBar.style.width = `${percentage}%`;

  // Update message
  if (total === 0) {
    progressMessage.textContent =
      "Add assignments to start tracking your progress.";
  } else if (percentage === 100) {
    progressMessage.textContent =
      "Excellent! You have completed all your assignments!";
  } else {
    progressMessage.textContent = `You've completed ${completed} out of ${total} assignments. Keep going!`;
  }
}

// ===================================
// ADD ASSIGNMENT
// ===================================

assignmentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = document.getElementById("assignmentTitle").value.trim();

  const dueDate = document.getElementById("assignmentDueDate").value;

  const description = document
    .getElementById("assignmentDescription")
    .value.trim();

  const newAssignment = {
    id: generateId(),
    title,
    description,
    dueDate,
    status: "Pending",
  };

  assignments.push(newAssignment);

  saveAssignments();
  assignmentForm.reset();

  displayAssignments();
  displayDeadlines();
  updateWorkspaceSummary();
});

// ===================================
// DISPLAY ASSIGNMENTS
// ===================================

function displayAssignments() {
  assignmentCount.textContent = assignments.length;

  if (assignments.length === 0) {
    assignmentsContainer.innerHTML =
      '<p class="empty-message">No assignments added yet.</p>';

    return;
  }

  assignmentsContainer.innerHTML = "";

  assignments.forEach((assignment) => {
    const item = document.createElement("div");
    item.className = "assignment-item";

    const information = document.createElement("div");
    information.className = "item-information";

    const dueDate = new Date(`${assignment.dueDate}T00:00:00`);

    const formattedDate = dueDate.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    information.innerHTML = `
      <h4>${escapeHTML(assignment.title)}</h4>
      <p>${escapeHTML(assignment.description || "No description provided.")}</p>
      <p>Due: ${formattedDate}</p>
      <span class="assignment-status ${
        assignment.status === "Completed" ? "completed" : ""
      }">
        ${escapeHTML(assignment.status)}
      </span>
    `;

    const controls = document.createElement("div");
    controls.className = "assignment-controls";

    const statusSelect = document.createElement("select");
    statusSelect.dataset.id = assignment.id;
    statusSelect.className = "assignment-status-select";

    ["Pending", "Completed"].forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusSelect.appendChild(option);
    });

    statusSelect.value = assignment.status;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-assignment-btn";
    deleteButton.dataset.id = assignment.id;
    deleteButton.textContent = "Delete";

    const editButton = document.createElement("button");
    editButton.className = "edit-assignment-btn";
    editButton.dataset.id = assignment.id;
    editButton.textContent = "Edit";

    controls.append(statusSelect, editButton, deleteButton);
    item.append(information, controls);

    assignmentsContainer.appendChild(item);
  });
}

// CHANGE ASSIGNMENT STATUS
assignmentsContainer.addEventListener("change", (event) => {
  if (!event.target.classList.contains("assignment-status-select")) {
    return;
  }

  const assignment = assignments.find(
    (item) => item.id === event.target.dataset.id,
  );

  if (!assignment) return;

  assignment.status = event.target.value;

  saveAssignments();
  displayAssignments();
  displayDeadlines();
  updateWorkspaceSummary();
});

// ===================================
// EDIT OR DELETE ASSIGNMENT
// ===================================

assignmentsContainer.addEventListener("click", (event) => {
  // EDIT ASSIGNMENT
  const editButton = event.target.closest(".edit-assignment-btn");

  if (editButton) {
    const assignment = assignments.find(
      (item) => item.id === editButton.dataset.id,
    );

    if (!assignment) return;

    // Edit assignment name
    const updatedTitle = prompt("Edit assignment name:", assignment.title);

    if (updatedTitle === null) return;

    if (!updatedTitle.trim()) {
      alert("Assignment name cannot be empty.");
      return;
    }

    // Edit description
    const updatedDescription = prompt(
      "Edit assignment description:",
      assignment.description || "",
    );

    if (updatedDescription === null) return;

    // Edit due date
    const updatedDueDate = prompt(
      "Edit due date (YYYY-MM-DD):",
      assignment.dueDate,
    );

    if (updatedDueDate === null) return;

    // Validate date format
    const dateParts = updatedDueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!dateParts) {
      alert("Use YYYY-MM-DD format, for example 2026-11-15.");
      return;
    }

    const checkedDate = new Date(
      Number(dateParts[1]),
      Number(dateParts[2]) - 1,
      Number(dateParts[3]),
    );

    const validDate =
      checkedDate.getFullYear() === Number(dateParts[1]) &&
      checkedDate.getMonth() === Number(dateParts[2]) - 1 &&
      checkedDate.getDate() === Number(dateParts[3]);

    if (!validDate) {
      alert("Please enter a valid date.");
      return;
    }

    // Update assignment
    assignment.title = updatedTitle.trim();
    assignment.description = updatedDescription.trim();
    assignment.dueDate = updatedDueDate;

    // Save changes
    saveAssignments();

    // Refresh workspace
    displayAssignments();
    displayDeadlines();
    updateWorkspaceSummary();

    alert("Assignment updated successfully!");

    return;
  }

  // DELETE ASSIGNMENT
  const deleteButton = event.target.closest(".delete-assignment-btn");

  if (!deleteButton) return;

  const confirmed = confirm("Are you sure you want to delete this assignment?");

  if (!confirmed) return;

  assignments = assignments.filter(
    (item) => item.id !== deleteButton.dataset.id,
  );

  saveAssignments();

  displayAssignments();
  displayDeadlines();
  updateWorkspaceSummary();
});

// ===================================
// DEADLINES
// ===================================

function displayDeadlines() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedAssignments = [...assignments].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );

  const upcoming = assignments.filter((assignment) => {
    const dueDate = new Date(`${assignment.dueDate}T00:00:00`);

    return dueDate >= today && assignment.status !== "Completed";
  });

  deadlineCount.textContent = upcoming.length;

  if (sortedAssignments.length === 0) {
    deadlinesContainer.innerHTML =
      '<p class="empty-message">No deadlines available.</p>';

    return;
  }

  deadlinesContainer.innerHTML = "";

  sortedAssignments.forEach((assignment) => {
    const dueDate = new Date(`${assignment.dueDate}T00:00:00`);

    const isOverdue = dueDate < today && assignment.status !== "Completed";

    const isCompleted = assignment.status === "Completed";

    const item = document.createElement("div");

    item.className = "deadline-item";

    if (isOverdue) item.classList.add("overdue");
    if (isCompleted) item.classList.add("completed");

    let label = "Upcoming";

    if (isCompleted) {
      label = "Completed";
    } else if (isOverdue) {
      label = "Overdue";
    }

    const formattedDate = dueDate.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    item.innerHTML = `
      <div class="item-information">
        <h4>${escapeHTML(assignment.title)}</h4>
        <p class="deadline-date">${formattedDate}</p>
      </div>

      <span class="assignment-status ${
        isCompleted ? "completed" : isOverdue ? "overdue" : ""
      }">
        ${label}
      </span>
    `;

    deadlinesContainer.appendChild(item);
  });
}

// ===================================
// UPDATE WORKSPACE SUMMARY
// ===================================

function updateWorkspaceSummary() {
  updateAssignmentProgress();

  const upcoming = assignments.filter((assignment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(`${assignment.dueDate}T00:00:00`);

    return dueDate >= today && assignment.status !== "Completed";
  });

  deadlineCount.textContent = upcoming.length;
  assignmentCount.textContent = assignments.length;
  resourceCount.textContent =
    resourcesContainer.querySelectorAll(".resource-item").length;
}

// ===================================
// INITIAL PAGE LOAD
// ===================================

displayAssignments();
displayDeadlines();
updateWorkspaceSummary();

// RESOURCE SEARCH AND CATEGORY FILTERS

resourceSearch.addEventListener("input", () => {
  displayResources();
});

resourceCategoryFilter.addEventListener("change", () => {
  displayResources();
});

resourceSort.addEventListener("change", () => {
  displayResources();
});
