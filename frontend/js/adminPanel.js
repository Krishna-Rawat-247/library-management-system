// ********************************************************************************************************************************************************
// 1. Admin Reservation OverSight Panel:
// ********************************************************************************************************************************************************

function getUserName(userId) {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  let user = users.find((u) => u.id === userId);
  return user ? user.name : "Unknown";
}

function getResourceLabel(resourceId) {
  let resources = JSON.parse(localStorage.getItem("resources")) || [];
  let resource = resources.find((r) => r.id === resourceId);
  return resource ? resource.label : "Unknown";
}

function renderReservationTable() {
  let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
  let tbody = document.getElementById("reservationsTableBody");
  tbody.innerHTML = "";

  reservations.sort((a, b) => {
    return getDateTime(a) - getDateTime(b);
  });

  let filters = currentReservationFilters();

  if (filters.status !== "all") {
    reservations = reservations.filter(
      (reservation) => reservation.status === filters.status,
    );
  }
  if (filters.date) {
    reservations = reservations.filter(
      (reservation) => reservation.date === filters.date,
    );
  }
  if (filters.userId !== "all") {
    reservations = reservations.filter(
      (reservation) => reservation.userId === filters.userId,
    );
  }
  if (filters.resourceId !== "all") {
    reservations = reservations.filter(
      (reservation) => reservation.resourceId === filters.resourceId,
    );
  }

  let emptyNote = document.getElementById("reservationsEmptyNote");
  emptyNote.hidden = reservations.length > 0;

  reservations.forEach((reservation) => {
    let row = document.createElement("tr");

    let data = [
      getUserName(reservation.userId),
      getResourceLabel(reservation.resourceId),
      reservation.date,
      reservation.startTime + " - " + reservation.endTime,
      reservation.priorityScore ?? "—",
      reservation.status,
      reservation.checkedIn ? "Yes" : "No",
    ];

    data.forEach((value) => {
      let td = document.createElement("td");
      td.innerText = value;
      row.appendChild(td);
    });

    let actionsTd = createActionButtons(reservation);
    row.appendChild(actionsTd);

    tbody.appendChild(row);
  });
}

function getDateTime(reservation) {
  return new Date(`${reservation.date}T${reservation.startTime}`);
}

function currentReservationFilters() {
  return {
    status: document.getElementById("resFilterStatus").value,
    date: document.getElementById("resFilterDate").value,
    userId: document.getElementById("resFilterUser").value,
    resourceId: document.getElementById("resFilterResource").value,
  };
}

function wireReservationFilters() {
  document
    .getElementById("resFilterStatus")
    .addEventListener("change", renderReservationTable);
  document
    .getElementById("resFilterDate")
    .addEventListener("change", renderReservationTable);
  document
    .getElementById("resFilterUser")
    .addEventListener("change", renderReservationTable);
  document
    .getElementById("resFilterResource")
    .addEventListener("change", renderReservationTable);

  let clearBtn = document.getElementById("resFilterClear");
  clearBtn.addEventListener("click", function () {
    document.getElementById("resFilterStatus").value = "all";
    document.getElementById("resFilterDate").value = "";
    document.getElementById("resFilterUser").value = "all";
    document.getElementById("resFilterResource").value = "all";
    renderReservationTable();
  });
}

function createActionButtons(reservation) {
  let actionsTd = document.createElement("td");

  // Force Confirm Button
  if (reservation.status === "pending") {
    actionsTd.appendChild(
      createButton("Force Confirm", function () {
        updateReservationStatus(reservation.id, "confirmed");
      }),
    );
  }
  // Mark No-show
  if (reservation.status === "confirmed" && !reservation.checkedIn) {
    actionsTd.appendChild(
      createButton("Mark No-show", function () {
        markAsNoShow(reservation.id);
      }),
    );
  }
  // Cancel
  if (reservation.status === "pending" || reservation.status === "confirmed") {
    actionsTd.appendChild(
      createButton("Cancel", function () {
        updateReservationStatus(reservation.id, "cancelled");
      }),
    );
  }
  // Delete
  actionsTd.appendChild(
    createButton("Delete", function () {
      deleteReservation(reservation.id);
    }),
  );

  return actionsTd;
}

function createButton(text, onClick) {
  let button = document.createElement("button");
  button.innerText = text;
  button.addEventListener("click", onClick);
  return button;
}

function updateReservationStatus(id, newStatus) {
  let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
  let reservation = reservations.find((r) => r.id === id);
  if (reservation) {
    reservation.status = newStatus;
    localStorage.setItem("reservations", JSON.stringify(reservations));
    renderReservationTable();
  }
}

function deleteReservation(id) {
  let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
  let reservation = reservations.find((r) => r.id === id);
  if (reservation) {
    let confirmDelete = confirm(
      `Are you sure you want to delete the reservation for ${getUserName(reservation.userId)} on ${reservation.date}?`,
    );
    if (confirmDelete) {
      reservations = reservations.filter((r) => r.id !== id);
      localStorage.setItem("reservations", JSON.stringify(reservations));
      renderReservationTable();
    }
  }
}

function markAsNoShow(id) {
  let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
  let reservation = reservations.find((r) => r.id === id);
  if (!reservation) return;

  reservation.status = "no_show";
  localStorage.setItem("reservations", JSON.stringify(reservations));

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let user = users.find((u) => u.id === reservation.userId);
  if (user) {
    user.noShowCount = (user.noShowCount || 0) + 1;
    localStorage.setItem("users", JSON.stringify(users));
  }
  renderReservationTable();
}

renderReservationTable();
wireReservationFilters();

// ********************************************************************************************************************************************************
// 2. Admin Resource Management Panel:
// ********************************************************************************************************************************************************

function renderResourcesTable() {
  let resources = JSON.parse(localStorage.getItem("resources")) || [];
  let tbody = document.getElementById("resourcesTableBody");
  tbody.innerHTML = "";

  resources.forEach((resource) => {
    let row = document.createElement("tr");

    let data = [
      resource.label,
      resource.type.replace("_", " "),
      resource.zone,
      resource.capacity,
    ];

    data.forEach((value) => {
      let td = document.createElement("td");
      td.innerText = value;
      row.appendChild(td);
    });

    row.appendChild(createResourceButtons(resource));

    tbody.appendChild(row);
  });
}

function createResourceButtons(resource) {
  let actionsTd = document.createElement("td");

  actionsTd.appendChild(
    createButton("Edit", function () {
      loadResourceIntoForm(resource);
    }),
  );

  actionsTd.appendChild(
    createButton("Delete", function () {
      deleteResource(resource.id);
    }),
  );

  return actionsTd;
}

function deleteResource(id) {
  let resources = JSON.parse(localStorage.getItem("resources")) || [];
  let resource = resources.find((r) => r.id === id);

  if (!resource) return;

  let confirmDelete = confirm(`Are you sure you want to delete "${resource.label}"?\nExisting reservations will not be removed.`);

  if (confirmDelete) {
    resources = resources.filter((r) => r.id !== id);

    localStorage.setItem("resources", JSON.stringify(resources));

    renderResourcesTable();
  }
}

function loadResourceIntoForm(resource) {
  document.getElementById("resourceEditId").value = resource.id;
  document.getElementById("resourceLabel").value = resource.label;
  document.getElementById("resourceType").value = resource.type;
  document.getElementById("resourceZone").value = resource.zone;
  document.getElementById("resourceCapacity").value = resource.capacity;

  document.getElementById("resourceSubmitBtn").innerText = "Save Changes";
  document.getElementById("resourceCancelEditBtn").hidden = false;
}

function resetResourceForm() {
  document.getElementById("resourceEditId").value = "";

  document.getElementById("resourceForm").reset();
  document.getElementById("resourceCapacity").value = 1;
  document.getElementById("resourceSubmitBtn").innerText = "Add Resource";
  document.getElementById("resourceCancelEditBtn").hidden = true;
}

function addResource(resource) {
  let resources = JSON.parse(localStorage.getItem("resources")) || [];

  let newResource = {
    id: "r_" + Date.now(),
    label: resource.label,
    type: resource.type,
    zone: resource.zone,
    capacity: Number(resource.capacity),
  };

  resources.push(newResource);
  localStorage.setItem("resources", JSON.stringify(resources));
  renderResourcesTable();
}

function updateResource(id, resource) {
  let resources = JSON.parse(localStorage.getItem("resources")) || [];

  let existingResource = resources.find((r) => r.id === id);

  if (!existingResource) return;

  existingResource.label = resource.label;
  existingResource.type = resource.type;
  existingResource.zone = resource.zone;
  existingResource.capacity = Number(resource.capacity);

  localStorage.setItem("resources", JSON.stringify(resources));

  renderResourcesTable();
}

function wireResourceForm() {
  let resourceForm = document.getElementById("resourceForm");

  resourceForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let id = document.getElementById("resourceEditId").value;

    let resource = {
      label: document.getElementById("resourceLabel").value,
      type: document.getElementById("resourceType").value,
      zone: document.getElementById("resourceZone").value,
      capacity: document.getElementById("resourceCapacity").value,
    };

    if (id) {
      updateResource(id, resource);
    } else {
      addResource(resource);
    }

    resetResourceForm();
  });

  document.getElementById("resourceCancelEditBtn")
    .addEventListener("click", function () {
      resetResourceForm();
    });
}

renderResourcesTable();
wireResourceForm();



// ********************************************************************************************************************************************************
// 3. Admin User Management Panel:
// ********************************************************************************************************************************************************

let selectedUserId = null;

const ROLE_WEIGHTS = {
  final_year: 100,
  pg: 75,
  faculty: 60,
  ug_senior: 50,
  ug_junior: 30,
};

const ROLE_LABELS = {
  final_year: "Final-year / Thesis",
  pg: "Postgraduate",
  faculty: "Faculty",
  ug_senior: "UG Senior",
  ug_junior: "UG Junior",
};

// ---------------------------------------------------------
// SEARCH
// ---------------------------------------------------------

function wireUserSearch() {
  let searchInput = document.getElementById("userSearchInput");

  searchInput.addEventListener("input", function () {
    renderUserSearchResults(searchInput.value);
  });
}

function renderUserSearchResults(term) {
  let resultsDiv = document.getElementById("userSearchResults");
  resultsDiv.innerHTML = "";

  let cleanTerm = term.trim().toLowerCase();
  if (!cleanTerm) return;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let matches = users.filter((user) =>
    user.name.toLowerCase().includes(cleanTerm)
  );

  if (matches.length === 0) {
    let empty = document.createElement("div");
    empty.className = "search-result-row";
    empty.innerText = "No users found.";
    resultsDiv.appendChild(empty);
    return;
  }

  matches.forEach((user) => {
    let row = document.createElement("div");
    row.className = "search-result-row";

    let left = document.createElement("span");
    left.innerText = user.name;

    let right = document.createElement("span");
    right.className = "tag";
    right.innerText = ROLE_LABELS[user.role] || user.role;

    row.appendChild(left);
    row.appendChild(right);

    row.addEventListener("click", function () {
      openUserProfile(user.id);
    });

    resultsDiv.appendChild(row);
  });
}

// ---------------------------------------------------------
// PROFILE
// ---------------------------------------------------------

function openUserProfile(userId) {
  selectedUserId = userId;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let user = users.find((u) => u.id === userId);
  if (!user) return;

  document.getElementById("section-user-profile").hidden = false;

  document.getElementById("userProfileName").innerText = user.name;
  document.getElementById("userProfileRole").innerText =
    ROLE_LABELS[user.role] || user.role;
  document.getElementById("userProfileNoShows").innerText =
    user.noShowCount || 0;
  document.getElementById("userProfileReliability").innerText =
    getReliabilityScore(user);

  renderPriorityBreakdown(user);
  renderUserBookingHistory(userId);
  renderSuspendStatus(user);
}

function getReliabilityScore(user) {
  let strikes = Math.min(user.noShowCount || 0, 6);
  return Math.max(0, 100 - strikes * 15);
}

function renderPriorityBreakdown(user) {
  let breakdownList = document.getElementById("userProfilePriorityBreakdown");
  breakdownList.innerHTML = "";

  let roleRaw = ROLE_WEIGHTS[user.role] ?? 30;
  let reliRaw = getReliabilityScore(user);
let examRaw = getExamProximityScore(user.role, getTodayDate());
  let roleWeighted = roleRaw * 0.5;
  let reliWeighted = reliRaw * 0.3;
  let examWeighted = examRaw * 0.2;

  let total = Math.round(roleWeighted + reliWeighted + examWeighted);

  let rows = [
    { label: "Role (" + (ROLE_LABELS[user.role] || user.role) + ")", value: roleRaw + " → " + roleWeighted.toFixed(1) },
    { label: "Reliability", value: reliRaw + " → " + reliWeighted.toFixed(1) },
    { label: "Exam proximity", value: examRaw + " → " + examWeighted.toFixed(1) },
    { label: "Total priority score", value: total },
  ];

  rows.forEach((row) => {
    let li = document.createElement("li");

    let left = document.createElement("span");
    left.innerText = row.label;

    let right = document.createElement("span");
    right.innerText = row.value;

    li.appendChild(left);
    li.appendChild(right);
    breakdownList.appendChild(li);
  });
}

// ---------------------------------------------------------
// BOOKING HISTORY
// ---------------------------------------------------------

function renderUserBookingHistory(userId) {
  let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
  let userReservations = reservations.filter((r) => r.userId === userId);

  userReservations.sort((a, b) => {
    return getDateTime(b) - getDateTime(a); // most recent first
  });

  let tbody = document.getElementById("userBookingHistoryTableBody");
  let emptyNote = document.getElementById("userHistoryEmptyNote");
  tbody.innerHTML = "";

  emptyNote.hidden = userReservations.length > 0;

  userReservations.forEach((reservation) => {
    let row = document.createElement("tr");

    let data = [
      getResourceLabel(reservation.resourceId),
      reservation.date,
      reservation.startTime + " - " + reservation.endTime,
      reservation.status,
    ];

    data.forEach((value) => {
      let td = document.createElement("td");
      td.innerText = value;
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
}


// ---------------------------------------------------------
// ACCESS CONTROL (suspend / unsuspend)
// ---------------------------------------------------------

function renderSuspendStatus(user) {
  let statusEl = document.getElementById("userSuspendStatus");
  let form = document.getElementById("userSuspendForm");
  let unsuspendBtn = document.getElementById("userUnsuspendBtn");

  if (user.suspended) {
    let untilText = user.suspendedUntil
      ? "until " + user.suspendedUntil
      : "indefinitely";
    let reasonText = user.suspendReason ? " — " + user.suspendReason : "";

    statusEl.innerText = "Suspended " + untilText + reasonText;
    form.hidden = true;
    unsuspendBtn.hidden = false;
  } else {
    statusEl.innerText = "Not suspended.";
    form.hidden = false;
    unsuspendBtn.hidden = true;
  }
}

function suspendUser(userId, durationValue, reason) {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  let user = users.find((u) => u.id === userId);
  if (!user) return;

  user.suspended = true;
  user.suspendReason = reason;

  if (durationValue === "indefinite") {
    user.suspendedUntil = null;
  } else {
    let until = new Date();
    until.setDate(until.getDate() + Number(durationValue));
    user.suspendedUntil = until.toISOString().slice(0, 10);
  }

  localStorage.setItem("users", JSON.stringify(users));
  renderSuspendStatus(user);
}

function unsuspendUser(userId) {
  let users = JSON.parse(localStorage.getItem("users")) || [];
  let user = users.find((u) => u.id === userId);
  if (!user) return;

  user.suspended = false;
  user.suspendedUntil = null;
  user.suspendReason = "";

  localStorage.setItem("users", JSON.stringify(users));
  renderSuspendStatus(user);
}

function wireSuspendControls() {
  let form = document.getElementById("userSuspendForm");
  let unsuspendBtn = document.getElementById("userUnsuspendBtn");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!selectedUserId) return;

    let duration = document.getElementById("userSuspendDuration").value;
    let reason = document.getElementById("userSuspendReason").value;

    suspendUser(selectedUserId, duration, reason);
    form.reset();
  });

  unsuspendBtn.addEventListener("click", function () {
    if (!selectedUserId) return;
    unsuspendUser(selectedUserId);
  });
}

wireUserSearch();
wireSuspendControls();

// ********************************************************************************************************************************************************
// 4. Admin Dashboard Panel:
// ********************************************************************************************************************************************************

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isHappeningNow(reservation) {
  if (reservation.status !== "confirmed") return false;

  let today = getTodayDate();
  if (reservation.date !== today) return false;

  let now = new Date();
  let start = new Date(today + "T" + reservation.startTime);
  let end = new Date(today + "T" + reservation.endTime);

  return now >= start && now <= end;
}

function renderDashboardStats() {
  let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
  let today = getTodayDate();

  let totalToday = reservations.filter((r) => r.date === today).length;
  let pendingCount = reservations.filter((r) => r.status === "pending").length;
  let noShowsToday = reservations.filter(
    (r) => r.date === today && r.status === "no_show"
  ).length;
  let liveNow = reservations.filter(isHappeningNow).length;

  document.getElementById("statTotalToday").innerText = totalToday;
  document.getElementById("statLiveNow").innerText = liveNow;
  document.getElementById("statPending").innerText = pendingCount;
  document.getElementById("statNoShowsToday").innerText = noShowsToday;
}

function renderLiveBookings() {
  let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
  let liveReservations = reservations.filter(isHappeningNow);

  let tbody = document.getElementById("liveBookingsTableBody");
  let emptyNote = document.getElementById("liveBookingsEmptyNote");
  tbody.innerHTML = "";

  emptyNote.hidden = liveReservations.length > 0;

  liveReservations.forEach((reservation) => {
    let row = document.createElement("tr");

    let data = [
      getUserName(reservation.userId),
      getResourceLabel(reservation.resourceId),
      reservation.startTime,
      reservation.endTime,
      reservation.checkedIn ? "Yes" : "No",
    ];

    data.forEach((value) => {
      let td = document.createElement("td");
      td.innerText = value;
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
}


function renderDashboard() {
  renderDashboardStats();
  renderLiveBookings();
}
renderDashboard();
document.addEventListener("adminview:shown", function (e) {
  if (e.detail.view === "dashboard") {
    renderDashboard();
  }
});

// ********************************************************************************************************************************************************
// 5. Admin Settings — Exam Window Management:
// ********************************************************************************************************************************************************

function getExamWindows() {
  return JSON.parse(localStorage.getItem("examWindows")) || [];
}

function saveExamWindows(windows) {
  localStorage.setItem("examWindows", JSON.stringify(windows));
}

function renderExamWindowsTable() {
  let windows = getExamWindows();
  let tbody = document.getElementById("examWindowsTableBody");
  tbody.innerHTML = "";

  windows.forEach((window, index) => {
    let row = document.createElement("tr");

    let data = [window.start, window.end];

    data.forEach((value) => {
      let td = document.createElement("td");
      td.innerText = value;
      row.appendChild(td);
    });

    let actionsTd = document.createElement("td");
    actionsTd.appendChild(
      createButton("Remove", function () {
        removeExamWindow(index);
      })
    );
    row.appendChild(actionsTd);

    tbody.appendChild(row);
  });
}

function removeExamWindow(index) {
  let windows = getExamWindows();
  windows.splice(index, 1);
  saveExamWindows(windows);
  renderExamWindowsTable();
}

function wireExamWindowForm() {
  let form = document.getElementById("examWindowForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let start = document.getElementById("examStart").value;
    let end = document.getElementById("examEnd").value;

    if (!start || !end || start > end) {
      alert("Pick a valid start and end date (start must be before end).");
      return;
    }

    let windows = getExamWindows();
    windows.push({ start: start, end: end });
    saveExamWindows(windows);

    form.reset();
    renderExamWindowsTable();
  });
}

function getExamProximityScore(role, dateStr) {
  if (role !== "final_year" && role !== "pg") return 0;

  let windows = getExamWindows();
  if (windows.length === 0) return 0;

  let checkDate = new Date(dateStr + "T00:00:00");

  for (let i = 0; i < windows.length; i++) {
    let start = new Date(windows[i].start + "T00:00:00");
    let end = new Date(windows[i].end + "T23:59:59");

    if (checkDate >= start && checkDate <= end) {
      let msPerDay = 1000 * 60 * 60 * 24;
      let daysToExam = Math.ceil((end - checkDate) / msPerDay);
      return Math.max(0, 100 - daysToExam * 8);
    }
  }

  return 0; // not inside any exam window
}

renderExamWindowsTable();
wireExamWindowForm();

