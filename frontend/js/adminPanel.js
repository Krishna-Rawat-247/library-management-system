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


