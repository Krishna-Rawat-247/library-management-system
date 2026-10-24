// Priority score helpers, only for showing a score on the profile and admin pages.
// The real score is calculated and saved by the server (backend/utils/priority.js).
// Booking, bumping and waiting-list code was removed in Phase 1.
// Pages that use calculatePriorityScore must load js/api.js before this file.

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
  let strikes = Math.min(user.noShowCount || 0, 6);

  return Math.max(0, 100 - strikes * 15);
}

async function getExamProximityScore(user, bookingDate) {
  if (!isFinalYear(user)) {
    return 0;
  }

  // exam windows come from the API. If they cannot be loaded, there is no exam bonus
  let windows = [];
  try {
    let result = await apiGet("/exam-windows");
    windows = result.data;
  } catch (error) {
    return 0;
  }

  if (!windows || windows.length === 0) {
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
