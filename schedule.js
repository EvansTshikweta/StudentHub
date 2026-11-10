// CALENDAR ELEMENTS
const calendarMonth = document.getElementById("calendarMonth");
const calendarDates = document.getElementById("calendarDates");

const previousMonthBtn = document.getElementById("previousMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");

// EVENT ELEMENTS
const addEventBtn = document.getElementById("addEventBtn");
const testNotificationBtn = document.getElementById("testNotificationBtn");
const eventModal = document.getElementById("eventModal");
const closeModal = document.getElementById("closeModal");
const eventForm = document.getElementById("eventForm");

const eventsContainer = document.getElementById("eventsContainer");

// WEEKLY TIMETABLE ELEMENTS
const timetableGrid = document.getElementById("timetableGrid");
const weekRange = document.getElementById("weekRange");

const previousWeekBtn = document.getElementById("previousWeek");
const nextWeekBtn = document.getElementById("nextWeek");

// CURRENT WEEK
let weekOffset = 0;

const showAllEventsBtn = document.getElementById("showAllEvents");

// LOAD SAVED EVENTS
let events = JSON.parse(localStorage.getItem("studentHubEvents")) || [];
let editingEventId = null;
// TRACK SENT REMINDERS
let sentReminders =
  JSON.parse(localStorage.getItem("studentHubSentReminders")) || [];
let selectedDate = null;

// CURRENT DATE
const today = new Date();

let currentMonth = today.getMonth();
let currentYear = today.getFullYear();

// GET TODAY'S DATE IN YYYY-MM-DD FORMAT
function getTodayString() {
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// SAVE EVENTS
function saveEvents() {
  localStorage.setItem("studentHubEvents", JSON.stringify(events));
}

// DISPLAY CALENDAR
function displayCalendar() {
  calendarDates.innerHTML = "";

  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    "en-US",
    { month: "long" },
  );

  calendarMonth.textContent = `${monthName} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // EMPTY SPACES BEFORE FIRST DAY
  for (let i = 0; i < firstDay; i++) {
    const emptyDate = document.createElement("div");
    emptyDate.classList.add("calendar-date", "empty");
    calendarDates.appendChild(emptyDate);
  }

  // GENERATE CALENDAR DATES
  for (let day = 1; day <= daysInMonth; day++) {
    const dateElement = document.createElement("div");
    dateElement.classList.add("calendar-date");

    const month = String(currentMonth + 1).padStart(2, "0");
    const dayString = String(day).padStart(2, "0");

    const dateString = `${currentYear}-${month}-${dayString}`;

    dateElement.dataset.date = dateString;

    // SELECT A CALENDAR DATE
    dateElement.addEventListener("click", () => {
      selectedDate = dateString;

      displayCalendar();
      displayEvents();
    });

    const dateNumber = document.createElement("span");
    dateNumber.textContent = day;

    dateElement.appendChild(dateNumber);

    // HIGHLIGHT TODAY
    if (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    ) {
      dateElement.classList.add("today");
    }

    // HIGHLIGHT SELECTED DATE
    if (selectedDate === dateString) {
      dateElement.classList.add("selected");
    }

    // SHOW EVENT INDICATORS
    const dayEvents = events.filter((event) => event.date === dateString);

    if (dayEvents.length > 0) {
      const indicator = document.createElement("small");
      indicator.classList.add("event-indicator");
      indicator.textContent = `${dayEvents.length} event(s)`;

      dateElement.appendChild(indicator);
    }

    calendarDates.appendChild(dateElement);
  }
}

// DISPLAY EVENT LIST
function displayEvents() {
  eventsContainer.innerHTML = "";

  const sortedEvents = [...events]
    .filter((event) => {
      return selectedDate === null || event.date === selectedDate;
    })
    .sort((a, b) => {
      return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
    });

  document.getElementById("eventCount").textContent =
    `${sortedEvents.length} event${sortedEvents.length === 1 ? "" : "s"}`;

  if (sortedEvents.length === 0) {
    eventsContainer.innerHTML =
      '<p class="no-events">No events yet. Click "Add Event" to create one.</p>';
    return;
  }

  sortedEvents.forEach((event) => {
    const eventCard = document.createElement("div");
    eventCard.classList.add("event-card");

    const title = document.createElement("h3");
    title.textContent = event.title;

    const type = document.createElement("span");
    type.classList.add("event-type");
    type.textContent = event.type;

    const date = document.createElement("p");
    date.textContent = new Date(event.date + "T00:00:00").toLocaleDateString(
      "en-ZA",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );

    const time = document.createElement("p");
    time.textContent = `Time: ${event.time}`;

    eventCard.appendChild(title);
    eventCard.appendChild(type);
    eventCard.appendChild(date);
    eventCard.appendChild(time);

    // DISPLAY EVENT REMINDER
    if (event.reminder && event.reminder !== "none") {
      const reminder = document.createElement("p");

      const reminderLabels = {
        15: "15 minutes before",
        30: "30 minutes before",
        60: "1 hour before",
        1440: "1 day before",
      };

      reminder.textContent = `🔔 Reminder: ${
        reminderLabels[event.reminder] || "Set"
      }`;

      eventCard.appendChild(reminder);
    }

    // EDIT EVENT BUTTON
    const editBtn = document.createElement("button");

    editBtn.textContent = "Edit";
    editBtn.classList.add("edit-event-btn");

    editBtn.addEventListener("click", () => {
      document.getElementById("eventTitle").value = event.title;
      document.getElementById("eventType").value = event.type;
      document.getElementById("eventDate").value = event.date;
      document.getElementById("eventTime").value = event.time;
      document.getElementById("eventReminder").value = event.reminder || "none";
      document.getElementById("eventDescription").value =
        event.description || "";

      editingEventId = event.id;

      eventModal.classList.add("active");
    });

    eventCard.appendChild(editBtn);

    // DELETE EVENT BUTTON
    const deleteBtn = document.createElement("button");

    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-event-btn");

    deleteBtn.addEventListener("click", () => {
      const confirmDelete = confirm(
        "Are you sure you want to delete this event?",
      );

      if (confirmDelete) {
        events = events.filter((item) => item.id !== event.id);
        refreshEvents();
      }
    });

    eventCard.appendChild(deleteBtn);

    if (event.description) {
      const description = document.createElement("p");
      description.textContent = event.description;
      eventCard.appendChild(description);
    }

    eventsContainer.appendChild(eventCard);
  });
}

// UPDATE OVERVIEW COUNTERS
function updateOverview() {
  const todayString = getTodayString();

  document.getElementById("totalEvents").textContent = events.length;

  document.getElementById("classEvents").textContent = events.filter(
    (event) => event.type === "Class",
  ).length;

  document.getElementById("studyEvents").textContent = events.filter(
    (event) => event.type === "Study Session",
  ).length;

  document.getElementById("upcomingEvents").textContent = events.filter(
    (event) => event.date >= todayString,
  ).length;
}

// REFRESH EVENT INFORMATION
function refreshEvents() {
  saveEvents();
  displayEvents();
  updateOverview();
  displayCalendar();
  displayWeeklyTimetable();
}

// PREVIOUS MONTH
previousMonthBtn.addEventListener("click", () => {
  currentMonth--;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  displayCalendar();
});

// NEXT MONTH
nextMonthBtn.addEventListener("click", () => {
  currentMonth++;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  displayCalendar();
});

// RETURN TO TODAY
todayBtn.addEventListener("click", () => {
  currentMonth = today.getMonth();
  currentYear = today.getFullYear();

  displayCalendar();
});

// OPEN ADD EVENT MODAL
addEventBtn.addEventListener("click", () => {
  eventModal.classList.add("active");
});

// CLOSE MODAL
closeModal.addEventListener("click", () => {
  eventModal.classList.remove("active");
});

// CLOSE MODAL WHEN CLICKING OUTSIDE
eventModal.addEventListener("click", (event) => {
  if (event.target === eventModal) {
    eventModal.classList.remove("active");
  }
});

// SAVE NEW EVENT
eventForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const newEvent = {
    id: editingEventId !== null ? editingEventId : Date.now(),
    title: document.getElementById("eventTitle").value.trim(),
    type: document.getElementById("eventType").value,
    date: document.getElementById("eventDate").value,
    time: document.getElementById("eventTime").value,
    reminder: document.getElementById("eventReminder").value,
    description: document.getElementById("eventDescription").value.trim(),
  };

  if (!newEvent.title || !newEvent.type || !newEvent.date || !newEvent.time) {
    alert("Please complete all required fields.");
    return;
  }

  // CHECK IF WE ARE EDITING OR CREATING
  if (editingEventId !== null) {
    events = events.map((item) =>
      item.id === editingEventId ? { ...newEvent, id: editingEventId } : item,
    );

    editingEventId = null;
  } else {
    events.push(newEvent);
  }

  refreshEvents();

  eventForm.reset();
  editingEventId = null;
  eventModal.classList.remove("active");

  alert("Event saved successfully!");
});

// SHOW ALL EVENTS
showAllEventsBtn.addEventListener("click", () => {
  selectedDate = null;

  displayCalendar();
  displayEvents();
});

// REQUEST NOTIFICATION PERMISSION
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// TEST BROWSER NOTIFICATION
testNotificationBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Your browser does not support notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("StudentHub", {
      body: "Great! Your notifications are working.",
    });
  } else {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      new Notification("StudentHub", {
        body: "Great! Your notifications are working.",
      });
    } else {
      alert("Please allow notifications in your browser settings.");
    }
  }
});

// AUTOMATIC EVENT REMINDER CHECKER
function checkEventReminders() {
  const now = new Date();

  events.forEach((event) => {
    if (!event.reminder || event.reminder === "none") {
      return;
    }

    const eventDateTime = new Date(`${event.date}T${event.time}`);

    const reminderMinutes = Number(event.reminder);

    const reminderTime = new Date(
      eventDateTime.getTime() - reminderMinutes * 60 * 1000,
    );

    const reminderKey = `${event.id}-${event.date}-${event.time}`;

    // CHECK IF IT IS TIME FOR THE REMINDER
    if (
      now >= reminderTime &&
      now < eventDateTime &&
      !sentReminders.includes(reminderKey)
    ) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("StudentHub Reminder", {
          body: `${event.title} starts in ${reminderMinutes} minutes.`,
        });
      }

      sentReminders.push(reminderKey);

      localStorage.setItem(
        "studentHubSentReminders",
        JSON.stringify(sentReminders),
      );
    }
  });
}

// DISPLAY WEEKLY TIMETABLE
function displayWeeklyTimetable() {
  timetableGrid.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find Monday of the current week
  const day = today.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + difference + weekOffset * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Display the week range
  const options = { day: "numeric", month: "short" };

  weekRange.textContent = `${monday.toLocaleDateString("en-ZA", options)} - ${sunday.toLocaleDateString("en-ZA", options)}`;

  // Create seven days
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayNumber = String(date.getDate()).padStart(2, "0");

    const dateString = `${year}-${month}-${dayNumber}`;

    const dayEvents = events
      .filter((event) => event.date === dateString)
      .sort((a, b) => a.time.localeCompare(b.time));

    const dayColumn = document.createElement("div");
    dayColumn.className = "timetable-day";

    const heading = document.createElement("h3");
    heading.textContent = date.toLocaleDateString("en-ZA", {
      weekday: "long",
    });

    const dateLabel = document.createElement("p");
    dateLabel.className = "day-date";
    dateLabel.textContent = date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
    });

    dayColumn.appendChild(heading);
    dayColumn.appendChild(dateLabel);

    if (dayEvents.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "day-date";
      emptyMessage.textContent = "No events";
      dayColumn.appendChild(emptyMessage);
    }

    dayEvents.forEach((event) => {
      const eventCard = document.createElement("div");
      eventCard.className = "timetable-event";

      const title = document.createElement("h4");
      title.textContent = event.title;

      const time = document.createElement("p");
      time.textContent = event.time;

      const type = document.createElement("p");
      type.textContent = event.type;

      eventCard.appendChild(title);
      eventCard.appendChild(time);
      eventCard.appendChild(type);

      dayColumn.appendChild(eventCard);
    });

    timetableGrid.appendChild(dayColumn);
  }
}

// WEEK NAVIGATION
previousWeekBtn.addEventListener("click", () => {
  weekOffset--;
  displayWeeklyTimetable();
});

nextWeekBtn.addEventListener("click", () => {
  weekOffset++;
  displayWeeklyTimetable();
});

// INITIALIZE PAGE
displayCalendar();
displayEvents();
updateOverview();
displayWeeklyTimetable();

// CHECK REMINDERS EVERY 10 SECONDS
checkEventReminders();

setInterval(() => {
  checkEventReminders();
}, 10000);
