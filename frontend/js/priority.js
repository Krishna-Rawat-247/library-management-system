// Course helpers for the profile page.
// The priority score is NOT calculated in the browser any more. The server calculates it
// (backend/utils/priority.js) and sends the numbers in /auth/me and /admin/users.

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
