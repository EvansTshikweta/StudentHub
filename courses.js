// ===================================
// STUDENTHUB - COURSE MANAGEMENT
// ===================================

// GET HTML ELEMENTS
const openCourseForm = document.getElementById("openCourseForm");
const cancelCourseForm = document.getElementById("cancelCourseForm");
const courseFormContainer = document.getElementById("courseFormContainer");
const courseForm = document.getElementById("courseForm");

const coursesContainer = document.getElementById("coursesContainer");
const emptyState = document.getElementById("emptyState");
const courseSearch = document.getElementById("courseSearch");

const cardViewBtn = document.getElementById("cardViewBtn");
const listViewBtn = document.getElementById("listViewBtn");

// SUMMARY ELEMENTS
const totalCourses = document.getElementById("totalCourses");
const activeCourses = document.getElementById("activeCourses");
const completedCourses = document.getElementById("completedCourses");
const averageProgress = document.getElementById("averageProgress");

// EDIT COURSE ELEMENTS
const editCourseModal = document.getElementById("editCourseModal");
const editCourseForm = document.getElementById("editCourseForm");
const closeEditModal = document.getElementById("closeEditModal");

// LOAD SAVED COURSES
let courses = [];

try {
  courses = JSON.parse(localStorage.getItem("studentHubCourses")) || [];
} catch (error) {
  courses = [];
}

// NORMALISE SAVED COURSE DATA
courses = courses.map((course) => ({
  ...course,
  progress: Math.min(100, Math.max(0, Number(course.progress) || 0)),
  status: course.status || "Active",
}));

let currentView = "cards";

// OPEN ADD COURSE FORM
openCourseForm.addEventListener("click", () => {
  courseFormContainer.classList.add("show");
});

// CLOSE ADD COURSE FORM
cancelCourseForm.addEventListener("click", () => {
  courseFormContainer.classList.remove("show");
  courseForm.reset();
});

// SAVE COURSES
function saveCourses() {
  localStorage.setItem("studentHubCourses", JSON.stringify(courses));
}

// UPDATE SUMMARY
function updateSummary() {
  const total = courses.length;

  const active = courses.filter((course) => course.status === "Active").length;

  const completed = courses.filter(
    (course) => course.status === "Completed",
  ).length;

  const progressTotal = courses.reduce(
    (sum, course) => sum + course.progress,
    0,
  );

  const average = total > 0 ? Math.round(progressTotal / total) : 0;

  totalCourses.textContent = total;
  activeCourses.textContent = active;
  completedCourses.textContent = completed;
  averageProgress.textContent = `${average}%`;
}

// DISPLAY COURSES
function displayCourses() {
  coursesContainer.querySelectorAll(".course-card").forEach((card) => {
    card.remove();
  });

  const searchTerm = courseSearch.value.toLowerCase().trim();

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm) ||
      course.code.toLowerCase().includes(searchTerm),
  );

  emptyState.style.display = filteredCourses.length === 0 ? "block" : "none";

  if (courses.length > 0 && filteredCourses.length === 0) {
    emptyState.querySelector("h3").textContent = "No matching courses";
    emptyState.querySelector("p").textContent =
      "Try searching with another course name or code.";
  } else {
    emptyState.querySelector("h3").textContent = "No courses added yet";
    emptyState.querySelector("p").textContent =
      "Start by adding your first course.";
  }

  filteredCourses.forEach((course) => {
    const card = document.createElement("article");
    card.className = "course-card";

    const header = document.createElement("div");
    header.className = "course-card-header";

    const title = document.createElement("h3");
    title.textContent = course.name;

    const status = document.createElement("span");
    status.className = "course-status";
    status.textContent = course.status;

    header.append(title, status);

    const code = document.createElement("p");
    code.className = "course-code";
    code.textContent = course.code;

    const details = document.createElement("p");
    details.className = "course-details";
    details.textContent = `${course.semester} · ${course.year}`;

    const progressInfo = document.createElement("div");
    progressInfo.className = "course-progress-info";

    const progressLabel = document.createElement("span");
    progressLabel.textContent = "Personal progress";

    const progressValue = document.createElement("strong");
    progressValue.className = "progress-value";
    progressValue.textContent = `${course.progress}%`;

    progressInfo.append(progressLabel, progressValue);

    const progressBar = document.createElement("div");
    progressBar.className = "course-progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "course-progress-fill";
    progressFill.style.width = `${course.progress}%`;

    progressBar.appendChild(progressFill);

    // PROGRESS SLIDER
    const progressSlider = document.createElement("input");
    progressSlider.type = "range";
    progressSlider.className = "course-progress-slider";
    progressSlider.min = 0;
    progressSlider.max = 100;
    progressSlider.step = 1;
    progressSlider.value = course.progress;
    progressSlider.dataset.id = course.id;

    progressSlider.setAttribute(
      "aria-label",
      `Update progress for ${course.name}`,
    );

    // COURSE ACTIONS
    const actions = document.createElement("div");
    actions.className = "course-actions";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "open-course-btn";
    openButton.dataset.action = "open";
    openButton.dataset.id = course.id;
    openButton.textContent = "Open Course";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-course-btn";
    editButton.dataset.action = "edit";
    editButton.dataset.id = course.id;
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-course-btn";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = course.id;
    deleteButton.textContent = "Delete";

    actions.append(openButton, editButton, deleteButton);

    card.append(
      header,
      code,
      details,
      progressInfo,
      progressBar,
      progressSlider,
      actions,
    );

    coursesContainer.appendChild(card);
  });

  coursesContainer.classList.toggle("list-view", currentView === "list");
}

// ADD NEW COURSE
courseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("courseName").value.trim();
  const code = document.getElementById("courseCode").value.trim();
  const semester = document.getElementById("semester").value;
  const year = document.getElementById("courseYear").value;

  const duplicate = courses.some(
    (course) => course.code.toLowerCase() === code.toLowerCase(),
  );

  if (duplicate) {
    alert("A course with this code already exists.");
    return;
  }

  const newCourse = {
    id: Date.now(),
    name,
    code,
    semester,
    year,
    progress: 0,
    status: "Active",
  };

  courses.push(newCourse);

  saveCourses();
  updateSummary();
  displayCourses();

  courseForm.reset();
  courseFormContainer.classList.remove("show");

  alert("Course added successfully!");
});

// SEARCH COURSES
courseSearch.addEventListener("input", displayCourses);

// CARD VIEW
cardViewBtn.addEventListener("click", () => {
  currentView = "cards";
  cardViewBtn.classList.add("active");
  listViewBtn.classList.remove("active");
  displayCourses();
});

// LIST VIEW
listViewBtn.addEventListener("click", () => {
  currentView = "list";
  listViewBtn.classList.add("active");
  cardViewBtn.classList.remove("active");
  displayCourses();
});

// UPDATE COURSE PROGRESS
coursesContainer.addEventListener("input", (event) => {
  if (!event.target.classList.contains("course-progress-slider")) {
    return;
  }

  const courseId = Number(event.target.dataset.id);
  const newProgress = Number(event.target.value);

  const course = courses.find((item) => item.id === courseId);
  if (!course) return;

  course.progress = newProgress;
  course.status = newProgress === 100 ? "Completed" : "Active";

  const card = event.target.closest(".course-card");

  card.querySelector(".progress-value").textContent = `${newProgress}%`;

  card.querySelector(".course-progress-fill").style.width = `${newProgress}%`;

  card.querySelector(".course-status").textContent = course.status;

  saveCourses();
  updateSummary();
});

// HANDLE COURSE ACTIONS
coursesContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const courseId = Number(button.dataset.id);

  // OPEN COURSE WORKSPACE
  if (button.dataset.action === "open") {
    window.location.href = `course.html?id=${encodeURIComponent(courseId)}`;
    return;
  }

  // EDIT COURSE
  if (button.dataset.action === "edit") {
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;

    document.getElementById("editCourseId").value = course.id;
    document.getElementById("editCourseName").value = course.name;
    document.getElementById("editCourseCode").value = course.code;
    document.getElementById("editSemester").value = course.semester;
    document.getElementById("editCourseYear").value = course.year;

    editCourseModal.classList.add("show");
    return;
  }

  // DELETE COURSE
  if (button.dataset.action === "delete") {
    const confirmed = confirm("Are you sure you want to delete this course?");

    if (!confirmed) return;

    courses = courses.filter((item) => item.id !== courseId);

    saveCourses();
    updateSummary();
    displayCourses();
  }
});

// CLOSE EDIT MODAL
closeEditModal.addEventListener("click", () => {
  editCourseModal.classList.remove("show");
  editCourseForm.reset();
});

// CLOSE MODAL WHEN CLICKING OUTSIDE
editCourseModal.addEventListener("click", (event) => {
  if (event.target === editCourseModal) {
    editCourseModal.classList.remove("show");
    editCourseForm.reset();
  }
});

// SAVE EDITED COURSE
editCourseForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = Number(document.getElementById("editCourseId").value);
  const name = document.getElementById("editCourseName").value.trim();
  const code = document.getElementById("editCourseCode").value.trim();
  const semester = document.getElementById("editSemester").value;
  const year = document.getElementById("editCourseYear").value;

  const duplicate = courses.some(
    (course) =>
      course.id !== id && course.code.toLowerCase() === code.toLowerCase(),
  );

  if (duplicate) {
    alert("Another course already uses this code.");
    return;
  }

  courses = courses.map((course) => {
    if (course.id === id) {
      return {
        ...course,
        name,
        code,
        semester,
        year,
      };
    }

    return course;
  });

  saveCourses();
  updateSummary();
  displayCourses();

  editCourseModal.classList.remove("show");
  editCourseForm.reset();

  alert("Course updated successfully!");
});

// INITIAL PAGE LOAD
saveCourses();
updateSummary();
displayCourses();
