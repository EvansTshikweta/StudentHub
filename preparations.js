/* =========================================
   STUDENTHUB - PREPARATIONS
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  // STORAGE KEYS
  const TASKS_KEY = "studentHubPreparationTasks";
  const GOALS_KEY = "studentHubStudyGoals";
  const NOTES_KEY = "studentHubPreparationNotes";
  const COURSE_PROGRESS_KEY = "studentHubCoursePreparation";

  // LOAD SAVED DATA
  let tasks = loadData(TASKS_KEY, []);
  let goals = loadData(GOALS_KEY, []);
  let courseProgress = loadData(COURSE_PROGRESS_KEY, {});

  function loadData(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
      console.error(`Could not load ${key}:`, error);
      return fallback;
    }
  }

  function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // GET COURSES FROM MY COURSES
  function getStudentCourses() {
    const savedCourses = loadData("studentHubCourses", []);

    if (Array.isArray(savedCourses)) {
      return savedCourses;
    }

    // Support a possible object containing a courses array.
    if (savedCourses && Array.isArray(savedCourses.courses)) {
      return savedCourses.courses;
    }

    return [];
  }

  function getCourseName(course) {
    return (
      course.name ||
      course.title ||
      course.courseName ||
      course.moduleName ||
      course.code ||
      "Untitled course"
    );
  }

  function getCourseId(course, index) {
    return String(
      course.id ||
        course.courseId ||
        course.code ||
        getCourseName(course) + "-" + index,
    );
  }

  // PAGE ELEMENTS
  const assessmentGrid = document.querySelector(".assessment-grid");
  const checklist = document.querySelector(".checklist");
  const goalsPanel = document.querySelector(".study-goals");
  const notesSection = document.querySelector(".notes-section");
  const notesInput = notesSection?.querySelector("textarea");
  const saveNotesButton = document.querySelector(".save-notes-btn");
  const addTaskButton = document.querySelector(".checklist button");
  const newPreparationButton = document.querySelector(".page-header button");

  // =========================================
  // COURSE PREPARATION CARDS
  // =========================================

  function renderCourses() {
    if (!assessmentGrid) return;

    const courses = getStudentCourses();

    const section = assessmentGrid.closest(".content-section");
    const heading = section?.querySelector("h2");

    if (heading) {
      heading.textContent = "Prepare for Your Courses";
    }

    assessmentGrid.innerHTML = "";

    if (courses.length === 0) {
      assessmentGrid.innerHTML = `
        <div class="empty-state">
          <h3>No courses found</h3>
          <p>Add courses on your My Courses page to see them here.</p>
          <a href="/html/courses.html">Go to My Courses</a>
        </div>
      `;
      return;
    }

    courses.forEach((course, index) => {
      const courseId = getCourseId(course, index);
      const courseName = getCourseName(course);

      const completed = Number(courseProgress[courseId] || 0);
      const percentage = Math.min(100, Math.max(0, completed));

      const card = document.createElement("div");
      card.className = "assessment-card";

      card.innerHTML = `
        <div class="assessment-top">
          <span class="assessment-type">Course preparation</span>
          <span class="assessment-status">
            ${percentage === 100 ? "Completed" : "In progress"}
          </span>
        </div>

        <h3 class="course-preparation-title"></h3>

        <p>Track your preparation for this course.</p>

        <div class="assessment-progress">
          <div class="progress-label">
            <span>Preparation progress</span>
            <span class="progress-percentage">${percentage}%</span>
          </div>

          <div class="progress-track">
            <div
              class="progress-fill"
              style="width: ${percentage}%"
            ></div>
          </div>
        </div>

        <button class="update-progress-btn" type="button">
          Update Progress
        </button>
      `;

      card.querySelector(".course-preparation-title").textContent = courseName;

      card
        .querySelector(".update-progress-btn")
        .addEventListener("click", () => {
          const answer = prompt(
            `Enter your preparation progress for ${courseName} (0–100):`,
            String(percentage),
          );

          if (answer === null) return;

          const newProgress = Number(answer);

          if (
            answer.trim() === "" ||
            !Number.isFinite(newProgress) ||
            newProgress < 0 ||
            newProgress > 100
          ) {
            alert("Please enter a number between 0 and 100.");
            return;
          }

          courseProgress[courseId] = newProgress;
          saveData(COURSE_PROGRESS_KEY, courseProgress);

          renderCourses();
          updateOverview();
        });

      assessmentGrid.appendChild(card);
    });
  }

  // =========================================
  // STUDY CHECKLIST
  // =========================================

  function renderTasks() {
    if (!checklist) return;

    checklist.innerHTML = "";

    if (tasks.length === 0) {
      checklist.innerHTML = `
        <p class="empty-state">
          You have no study tasks yet. Add your first task.
        </p>
      `;
    }

    tasks.forEach((task) => {
      const item = document.createElement("div");
      item.className = "checklist-item";

      item.innerHTML = `
        <label class="task-label">
          <input type="checkbox" class="task-checkbox">
          <span class="task-text"></span>
        </label>

        <button
          type="button"
          class="delete-task-btn"
          aria-label="Delete task"
        >
          Delete
        </button>
      `;

      const checkbox = item.querySelector(".task-checkbox");
      const taskText = item.querySelector(".task-text");
      const deleteButton = item.querySelector(".delete-task-btn");

      taskText.textContent = task.text;
      checkbox.checked = task.completed;

      if (task.completed) {
        taskText.style.textDecoration = "line-through";
        taskText.style.opacity = "0.6";
      }

      checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;

        saveData(TASKS_KEY, tasks);
        renderTasks();
        updateOverview();
      });

      deleteButton.addEventListener("click", () => {
        tasks = tasks.filter((savedTask) => savedTask.id !== task.id);

        saveData(TASKS_KEY, tasks);
        renderTasks();
        updateOverview();
      });

      checklist.appendChild(item);
    });

    updateTaskCount();
  }

  function addTask() {
    const taskText = prompt("Enter your new study task:");

    if (!taskText || !taskText.trim()) return;

    tasks.push({
      id: Date.now().toString(),
      text: taskText.trim(),
      completed: false,
    });

    saveData(TASKS_KEY, tasks);
    renderTasks();
    updateOverview();
  }

  function updateTaskCount() {
    const countElement = document.querySelector(".task-count");

    if (!countElement) return;

    const completedTasks = tasks.filter((task) => task.completed).length;

    countElement.textContent = `${completedTasks} / ${tasks.length} completed`;
  }

  // =========================================
  // STUDY GOALS
  // =========================================

  function getGoalsContainer() {
    if (goalsPanel) return goalsPanel;

    const firstGoal = document.querySelector(".goal-card");

    return firstGoal?.parentElement || null;
  }

  function renderGoals() {
    const container = getGoalsContainer();

    if (!container) return;

    // Remove old example goal cards.
    container.querySelectorAll(".goal-card").forEach((card) => {
      card.remove();
    });

    let addGoalButton = container.querySelector(".add-goal-btn");

    if (!addGoalButton) {
      addGoalButton = document.createElement("button");
      addGoalButton.className = "add-goal-btn";
      addGoalButton.type = "button";
      addGoalButton.textContent = "Add Study Goal";

      container.appendChild(addGoalButton);
    }

    addGoalButton.onclick = addGoal;

    if (goals.length === 0) {
      let emptyMessage = container.querySelector(".goals-empty");

      if (!emptyMessage) {
        emptyMessage = document.createElement("p");
        emptyMessage.className = "goals-empty";
        container.insertBefore(emptyMessage, addGoalButton);
      }

      emptyMessage.textContent = "You have not added any study goals yet.";
    } else {
      container.querySelector(".goals-empty")?.remove();
    }

    goals.forEach((goal) => {
      const card = document.createElement("div");
      card.className = "goal-card";

      card.innerHTML = `
        <div class="goal-icon">🎯</div>
        <div class="goal-details">
          <h3 class="goal-title"></h3>
          <p class="goal-status"></p>
        </div>
        <button type="button" class="complete-goal-btn"></button>
        <button type="button" class="delete-goal-btn">Delete</button>
      `;

      card.querySelector(".goal-title").textContent = goal.text;

      const status = card.querySelector(".goal-status");
      const completeButton = card.querySelector(".complete-goal-btn");

      status.textContent = goal.completed ? "Completed" : "In progress";

      completeButton.textContent = goal.completed
        ? "Mark Incomplete"
        : "Complete";

      if (goal.completed) {
        card.style.opacity = "0.7";
      }

      completeButton.addEventListener("click", () => {
        goal.completed = !goal.completed;

        saveData(GOALS_KEY, goals);
        renderGoals();
        updateOverview();
      });

      card.querySelector(".delete-goal-btn").addEventListener("click", () => {
        goals = goals.filter((savedGoal) => savedGoal.id !== goal.id);

        saveData(GOALS_KEY, goals);
        renderGoals();
        updateOverview();
      });

      container.insertBefore(card, addGoalButton);
    });
  }

  function addGoal() {
    const goalText = prompt("What study goal would you like to set?");

    if (!goalText || !goalText.trim()) return;

    goals.push({
      id: Date.now().toString(),
      text: goalText.trim(),
      completed: false,
    });

    saveData(GOALS_KEY, goals);
    renderGoals();
    updateOverview();
  }

  // =========================================
  // PREPARATION NOTES
  // =========================================

  function loadNotes() {
    if (!notesInput) return;

    notesInput.value = localStorage.getItem(NOTES_KEY) || "";
  }

  function saveNotes() {
    if (!notesInput) return;

    localStorage.setItem(NOTES_KEY, notesInput.value);

    alert("Your preparation notes have been saved.");
  }

  // =========================================
  // OVERVIEW CARDS
  // =========================================

  function updateOverview() {
    const overviewCards = document.querySelectorAll(".overview-card");

    const completedTasks = tasks.filter((task) => task.completed).length;

    const completedGoals = goals.filter((goal) => goal.completed).length;

    const totalCourses = getStudentCourses().length;

    const values = [totalCourses, 0, completedTasks, completedGoals];

    overviewCards.forEach((card, index) => {
      if (index >= values.length) return;

      let valueElement = card.querySelector(".js-overview-value");

      if (!valueElement) {
        valueElement = document.createElement("span");
        valueElement.className = "js-overview-value";
        valueElement.style.display = "block";
        valueElement.style.fontSize = "28px";
        valueElement.style.fontWeight = "700";

        card.insertBefore(valueElement, card.firstChild);
      }

      valueElement.textContent = values[index];
    });
  }

  // =========================================
  // BUTTON EVENTS
  // =========================================

  if (addTaskButton) {
    addTaskButton.addEventListener("click", addTask);
  }

  if (newPreparationButton) {
    newPreparationButton.addEventListener("click", addTask);
  }

  if (saveNotesButton) {
    saveNotesButton.addEventListener("click", saveNotes);
  }

  // =========================================
  // START THE PAGE
  // =========================================

  renderCourses();
  renderTasks();
  renderGoals();
  loadNotes();
  updateOverview();
});
