// Phase 2 priority rules. The server calculates everything, the browser never does.
// A request is ranked by its purpose TIER first. Inside a tier the SCORE decides.
// score = role score (up to 15) + reliability score (up to 10)

// the length of each course in semesters
const COURSE_DURATIONS = {
    "B.Tech": 8,
    "BSc": 6,
    "BBA": 6,
    "M.Tech": 4,
    "MSc": 4,
    "MBA": 4,
    "PhD": 8
}

// if the user has no course we guess it from the department
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
}

// getCourseDuration => number of semesters of the user's course (8 if we do not know it)
const getCourseDuration = (user) => {
    let course = ""
    if (user.course && COURSE_DURATIONS[user.course]) {
        course = user.course
    } else if (user.department && DEPARTMENT_TO_COURSE[user.department]) {
        course = DEPARTMENT_TO_COURSE[user.department]
    }
    return COURSE_DURATIONS[course] || 8
}

// PURPOSE_TIER => a higher tier always beats a lower tier. Academic year can never beat purpose
const PURPOSE_TIER = {
    job_interview: 5,
    end_semester_exam: 4,
    mid_semester_exam: 3,
    quarterly_test: 2,
    project_work: 2,
    general_study: 1
}

// getRoleScore => faculty 15, other staff 10, student: how far they are in the course (0 to 10)
const getRoleScore = (user) => {
    if (user.role === "faculty") {
        return 15
    }
    if (user.role !== "student") {
        return 10
    }
    const semester = user.semester || 0
    const score = Math.min(10, (semester / getCourseDuration(user)) * 10)
    return Math.round(score * 10) / 10
}

// calculatePriorityScore => kept so the Phase 1 booking code keeps working. Same number as getPriority().score
const calculatePriorityScore = async (user, bookingDate) => {
    return getRoleScore(user)
}

module.exports = {
    PURPOSE_TIER,
    getRoleScore,
    calculatePriorityScore
}
