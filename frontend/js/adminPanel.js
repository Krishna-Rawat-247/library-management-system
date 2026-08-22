// ********************************************************************************************************************************************************
const API_BASE = "http://localhost:3000";

// 1. Admin Reservation OverSight Panel:
// ********************************************************************************************************************************************************

function getUserName(userId, users) {
  let user = users.find((u) => String(u.id) === String(userId));
  return user ? user.name : "Unknown";
}

function getResourceLabel(resourceId, resources) {
  let resource = resources.find((r) => String(r.id) === String(resourceId));
  return resource ? resource.label : "Unknown";
}

async function renderReservationTable() {
  let [reservations, users, resources] = await Promise.all([
    fetch(`${API_BASE}/reservations`).then(r => r.json()),
    fetch(`${API_BASE}/users`).then(r => r.json()),
    fetch(`${API_BASE}/resources`).then(r => r.json())
  ]);

  populateReservationFilterDropdowns(users, resources);

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
      (reservation) => String(reservation.userId) === String(filters.userId),
    );
  }
  if (filters.resourceId !== "all") {
    reservations = reservations.filter(
      (reservation) => String(reservation.resourceId) === String(filters.resourceId),
    );
  }

  let emptyNote = document.getElementById("reservationsEmptyNote");
  emptyNote.hidden = reservations.length > 0;

  reservations.forEach((reservation) => {
    let row = document.createElement("tr");

    let data = [
      getUserName(reservation.userId, users),
      getResourceLabel(reservation.resourceId, resources),
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

function populateReservationFilterDropdowns(users, resources) {
  let userSelect = document.getElementById("resFilterUser");
  let resourceSelect = document.getElementById("resFilterResource");

  let selectedUser = userSelect.value;
  let selectedResource = resourceSelect.value;

  userSelect.innerHTML = "";
  let allUsersOption = document.createElement("option");
  allUsersOption.value = "all";
  allUsersOption.innerText = "All users";
  userSelect.appendChild(allUsersOption);

  users.forEach(function (user) {
    let option = document.createElement("option");
    option.value = String(user.id);
    option.innerText = user.name;
    userSelect.appendChild(option);
  });

  resourceSelect.innerHTML = "";
  let allResourcesOption = document.createElement("option");
  allResourcesOption.value = "all";
  allResourcesOption.innerText = "All resources";
  resourceSelect.appendChild(allResourcesOption);

  resources.forEach(function (resource) {
    let option = document.createElement("option");
    option.value = String(resource.id);
    option.innerText = resource.label;
    resourceSelect.appendChild(option);
  });

  userSelect.value = selectedUser;
  resourceSelect.value = selectedResource;
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
  if (reservation.status === "pending" || reservation.status === "waiting") {
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
  if (
    reservation.status === "pending" ||
    reservation.status === "confirmed" ||
    reservation.status === "waiting"
  ) {
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

async function updateReservationStatus(id, newStatus) {
  let reservation = await fetch(`${API_BASE}/reservations/${id}`).then(res => res.json());
  if (!reservation) {
    return;
  }

  if (newStatus === "confirmed") {
    let allReservations = await fetch(`${API_BASE}/reservations`).then(res => res.json());

    let occupying = allReservations.filter(function (other) {
      return String(other.id) !== String(reservation.id) &&
        String(other.resourceId) === String(reservation.resourceId) &&
        other.date === reservation.date &&
        other.startTime < reservation.endTime &&
        other.endTime > reservation.startTime &&
        (other.status === "confirmed" || other.status === "pending");
    });

    if (occupying.length > 0) {
      alert("This time slot is already occupied by a confirmed booking. Force Confirm was not applied.");
      return;
    }
  }

  await fetch(`${API_BASE}/reservations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus })
  });

  if (reservation.status === "confirmed" && newStatus === "cancelled") {
    await promoteWaitingReservation(
      reservation.resourceId,
      reservation.date,
      reservation.startTime,
      reservation.endTime
    );
  }

  renderReservationTable();
}

async function deleteReservation(id) {
  let reservation = await fetch(`${API_BASE}/reservations/${id}`).then(res => res.json());
  if (!reservation) return;

  let user = await fetch(`${API_BASE}/users/${reservation.userId}`).then(res => res.json());
  let userName = user ? user.name : "Unknown";

  let confirmDelete = confirm(
    `Are you sure you want to delete the reservation for ${userName} on ${reservation.date}?`
  );
  if (confirmDelete) {
    await fetch(`${API_BASE}/reservations/${id}`, { method: "DELETE" });
    renderReservationTable();
  }
}

async function markAsNoShow(id) {
  let reservation = await fetch(`${API_BASE}/reservations/${id}`).then(res => res.json());
  if (!reservation) return;

  await fetch(`${API_BASE}/reservations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "no_show" })
  });

  let user = await fetch(`${API_BASE}/users/${reservation.userId}`).then(res => res.json());
  if (user) {
    await fetch(`${API_BASE}/users/${reservation.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noShowCount: (user.noShowCount || 0) + 1,
        reliabilityScore: Math.max(0, (typeof user.reliabilityScore === "number" ? user.reliabilityScore : 100) - 15)
      })
    });
  }
  renderReservationTable();
}

renderReservationTable();
wireReservationFilters();

// ********************************************************************************************************************************************************
// 2. Admin Resource Management Panel:
// ********************************************************************************************************************************************************

async function renderResourcesTable() {
  let resources = await fetch(`${API_BASE}/resources`).then(res => res.json());
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

async function deleteResource(id) {
  let resource = await fetch(`${API_BASE}/resources/${id}`).then(res => res.json());
  if (!resource) return;

  let confirmDelete = confirm(
    `Are you sure you want to delete "${resource.label}"?\nExisting reservations will not be removed.`
  );

  if (confirmDelete) {
    await fetch(`${API_BASE}/resources/${id}`, { method: "DELETE" });
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

async function addResource(resource) {
  let newResource = {
    label: resource.label,
    type: resource.type,
    zone: resource.zone,
    capacity: Number(resource.capacity),
    available: true
  };

  await fetch(`${API_BASE}/resources`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newResource)
  });
  renderResourcesTable();
}

async function updateResource(id, resource) {
  await fetch(`${API_BASE}/resources/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      label: resource.label,
      type: resource.type,
      zone: resource.zone,
      capacity: Number(resource.capacity)
    })
  });
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

const ROLE_LABELS = {
  student: "Student",
  faculty: "Faculty",
  librarian: "Librarian",
  admin: "Admin"
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

async function renderUserSearchResults(term) {
  let resultsDiv = document.getElementById("userSearchResults");
  resultsDiv.innerHTML = "";

  let cleanTerm = term.trim().toLowerCase();
  if (!cleanTerm) return;

  let users = await fetch(`${API_BASE}/users`).then(res => res.json());
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

async function openUserProfile(userId) {
  selectedUserId = userId;

  let user = await fetch(`${API_BASE}/users/${userId}`).then(res => res.json());
  if (!user) return;

  document.getElementById("section-user-profile").hidden = false;

  document.getElementById("userProfileName").innerText = user.name;
  document.getElementById("userProfileRole").innerText =
    ROLE_LABELS[user.role] || user.role;
  document.getElementById("userProfileNoShows").innerText =
    user.noShowCount || 0;
  document.getElementById("userProfileReliability").innerText =
    getReliabilityScore(user);

  await renderPriorityBreakdown(user);
  renderUserBookingHistory(userId);
  renderSuspendStatus(user);
}

async function renderPriorityBreakdown(user) {
  let breakdownList = document.getElementById("userProfilePriorityBreakdown");
  breakdownList.innerHTML = "";

  let roleRaw = getRoleScore(user);
  let reliRaw = getReliabilityScore(user);
  let examRaw = await getExamProximityScore(user, getTodayDate());
  let roleWeighted = roleRaw * 0.5;
  let reliWeighted = reliRaw * 0.3;
  let examWeighted = examRaw * 0.2;

  let total = await calculatePriorityScore(user, getTodayDate());

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

async function renderUserBookingHistory(userId) {
  let [reservations, resources] = await Promise.all([
    fetch(`${API_BASE}/reservations`).then(res => res.json()),
    fetch(`${API_BASE}/resources`).then(res => res.json())
  ]);
  let userReservations = reservations.filter((r) => String(r.userId) === String(userId));

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
      getResourceLabel(reservation.resourceId, resources),
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

async function suspendUser(userId, durationValue, reason) {
  let updates = {
    suspended: true,
    suspendReason: reason,
  };

  if (durationValue === "indefinite") {
    updates.suspendedUntil = null;
  } else {
    let until = new Date();
    until.setDate(until.getDate() + Number(durationValue));
    updates.suspendedUntil = until.toISOString().slice(0, 10);
  }

  let user = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates)
  }).then(res => res.json());

  renderSuspendStatus(user);
}

async function unsuspendUser(userId) {
  let user = await fetch(`${API_BASE}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      suspended: false,
      suspendedUntil: null,
      suspendReason: ""
    })
  }).then(res => res.json());

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

async function renderDashboardStats() {
  let reservations = await fetch(`${API_BASE}/reservations`).then(res => res.json());
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

async function renderLiveBookings() {
  let [reservations, users, resources] = await Promise.all([
    fetch(`${API_BASE}/reservations`).then(r => r.json()),
    fetch(`${API_BASE}/users`).then(r => r.json()),
    fetch(`${API_BASE}/resources`).then(r => r.json())
  ]);
  let liveReservations = reservations.filter(isHappeningNow);

  let tbody = document.getElementById("liveBookingsTableBody");
  let emptyNote = document.getElementById("liveBookingsEmptyNote");
  tbody.innerHTML = "";

  emptyNote.hidden = liveReservations.length > 0;

  liveReservations.forEach((reservation) => {
    let row = document.createElement("tr");

    let data = [
      getUserName(reservation.userId, users),
      getResourceLabel(reservation.resourceId, resources),
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

async function getExamWindows() {
  return await fetch(`${API_BASE}/examWindows`).then(res => res.json());
}



async function renderExamWindowsTable() {
  let windows = await getExamWindows();
  let tbody = document.getElementById("examWindowsTableBody");
  tbody.innerHTML = "";

  windows.forEach((window) => {
    let row = document.createElement("tr");

    let data = [window.startDate, window.endDate];

    data.forEach((value) => {
      let td = document.createElement("td");
      td.innerText = value;
      row.appendChild(td);
    });

    let actionsTd = document.createElement("td");
    actionsTd.appendChild(
      createButton("Remove", function () {
        removeExamWindow(window.id);
      })
    );
    row.appendChild(actionsTd);

    tbody.appendChild(row);
  });
}

async function removeExamWindow(id) {
  await fetch(`${API_BASE}/examWindows/${id}`, { method: "DELETE" });
  renderExamWindowsTable();
}

function wireExamWindowForm() {
  let form = document.getElementById("examWindowForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    let start = document.getElementById("examStart").value;
    let end = document.getElementById("examEnd").value;

    if (!start || !end || start > end) {
      alert("Pick a valid start and end date (start must be before end).");
      return;
    }

    let newWindow = {
      title: "Exam Window " + start + " to " + end,
      startDate: start,
      endDate: end
    };

    await fetch(`${API_BASE}/examWindows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWindow)
    });

    form.reset();
    renderExamWindowsTable();
  });
}

renderExamWindowsTable();
wireExamWindowForm();

