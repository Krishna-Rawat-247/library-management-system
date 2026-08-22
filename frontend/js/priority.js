// Shared priority score + queue helpers.
// Used by booking.html, myBooking.html, and adminPanel.js
// so every page uses the same formula.

const PRIORITY_API = "http://localhost:3000";

const COURSE_DURATIONS = {
  "B.Tech": 8,
  "BSc": 6,
  "BBA": 6,
  "M.Tech": 4,
  "MSc": 4,
  "MBA": 4,
  "PhD": 8
};

const DEPARTMENT_TO_COURSE = {
  "Computer Science": "B.Tech",
  "Electronics Engineering": "B.Tech",
  "Mechanical Engineering": "B.Tech",
  "Civil Engineering": "B.Tech",
  "Electrical Engineering": "B.Tech",
  "Physics": "BSc",
  "Mathematics": "BSc",
  "Biotechnology": "BSc",
  "Management": "BBA"
};

function getUserCourse(user) {
  if (user.course && COURSE_DURATIONS[user.course]) {
    return user.course;
  }

  if (user.department && DEPARTMENT_TO_COURSE[user.department]) {
    return DEPARTMENT_TO_COURSE[user.department];
  }

  return "";
}

function getCourseDuration(user) {
  let course = getUserCourse(user);
  return COURSE_DURATIONS[course] || 0;
}

function isFinalYear(user) {
  let max = getCourseDuration(user);

  if (!max) {
    return false;
  }

  return user.semester >= max - 1;
}

function getRoleScore(user) {
  if (user.role === "faculty") {
    return 50;
  }

  if (user.role !== "student") {
    return 30;
  }

  if (isFinalYear(user)) {
    return 100;
  }

  let max = getCourseDuration(user);

  if (!max) {
    max = 8;
  }

  let midPoint = Math.floor(max / 2);

  if (user.semester > midPoint) {
    return 75;
  }

  return 60;
}

function getReliabilityScore(user) {
  if (typeof user.reliabilityScore === "number") {
    return user.reliabilityScore;
  }

  let strikes = Math.min(user.noShowCount || 0, 6);

  return Math.max(0, 100 - strikes * 15);
}

async function getExamProximityScore(user, bookingDate) {
  if (!isFinalYear(user)) {
    return 0;
  }

  let res = await fetch(PRIORITY_API + "/examWindows");
  let windows = await res.json();

  if (windows.length === 0) {
    return 0;
  }

  let checkDate = new Date(bookingDate + "T00:00:00");

  for (let i = 0; i < windows.length; i++) {
    let start = new Date(windows[i].startDate + "T00:00:00");
    let end = new Date(windows[i].endDate + "T23:59:59");

    if (checkDate >= start && checkDate <= end) {
      let msPerDay = 1000 * 60 * 60 * 24;
      let daysToExam = Math.ceil((end - checkDate) / msPerDay);

      return Math.max(0, 100 - daysToExam * 8);
    }
  }

  return 0;
}

async function calculatePriorityScore(user, bookingDate) {
  let roleScore = getRoleScore(user);
  let reliScore = getReliabilityScore(user);
  let examScore = await getExamProximityScore(user, bookingDate);

  let total = Math.round(
    roleScore * 0.5 +
    reliScore * 0.3 +
    examScore * 0.2
  );

  if (total < 0) {
    total = 0;
  }

  if (total > 100) {
    total = 100;
  }

  return total;
}

function isOccupyingStatus(status) {
  return status === "confirmed" || status === "pending";
}

function getConflictingReservations(
  reservations,
  resourceId,
  date,
  startTime,
  endTime
) {
  return reservations.filter(function (reservation) {
    return String(reservation.resourceId) === String(resourceId) &&
      reservation.date === date &&
      reservation.startTime < endTime &&
      reservation.endTime > startTime &&
      isOccupyingStatus(reservation.status);
  });
}

function getHighestPriorityReservation(reservations) {
  if (reservations.length === 0) {
    return null;
  }

  let sorted = reservations.slice();

  sorted.sort(function (a, b) {
    let scoreA = a.priorityScore || 0;
    let scoreB = b.priorityScore || 0;

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  return sorted[0];
}

async function bumpReservation(id) {
  await fetch(PRIORITY_API + "/reservations/" + id, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: "bumped"
    })
  });
}

async function resolveBookingConflict(newScore, conflicts) {
  if (conflicts.length === 0) {
    return "confirmed";
  }

  let highest = getHighestPriorityReservation(conflicts);
  let existingScore = highest.priorityScore || 0;

  if (newScore > existingScore) {
    for (let i = 0; i < conflicts.length; i++) {
      await bumpReservation(conflicts[i].id);
    }

    return "confirmed";
  }

  return "waiting";
}

// Promotes the highest-priority waiting OR bumped reservation
// after a confirmed booking is cancelled.
async function promoteWaitingReservation(
  resourceId,
  date,
  startTime,
  endTime
) {
  let res = await fetch(PRIORITY_API + "/reservations");
  let reservations = await res.json();

  // Find waiting and bumped reservations for the same
  // resource, date and overlapping time.
  let eligibleReservations = reservations.filter(function (reservation) {
    return String(reservation.resourceId) === String(resourceId) &&
      reservation.date === date &&
      reservation.startTime < endTime &&
      reservation.endTime > startTime &&
      (
        reservation.status === "waiting" ||
        reservation.status === "bumped"
      );
  });

  // Highest priority first.
  // If priority is equal, earlier booking wins.
  eligibleReservations.sort(function (a, b) {
    let scoreA = a.priorityScore || 0;
    let scoreB = b.priorityScore || 0;

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  if (eligibleReservations.length === 0) {
    return;
  }

  let winner = eligibleReservations[0];

  await fetch(PRIORITY_API + "/reservations/" + winner.id, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: "confirmed"
    })
  });
}