const {ExamWindow} = require("../models/examWindowModel")

// The priority score is the old formula from the frontend, now calculated on the server.
// In Phase 1 it is only saved and shown. It does not decide who gets a seat.

const COURSE_DURATIONS = {
    "B.Tech": 8,
    "BSc": 6,
    "BBA": 6,
    "M.Tech": 4,
    "MSc": 4,
    "MBA": 4,
    "PhD": 8
}

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

// getCourseDuration => number of semesters of the user's course (0 if unknown)
const getCourseDuration = (user) => {
    let course = ""
    if (user.course && COURSE_DURATIONS[user.course]) {
        course = user.course
    } else if (user.department && DEPARTMENT_TO_COURSE[user.department]) {
        course = DEPARTMENT_TO_COURSE[user.department]
    }
    return COURSE_DURATIONS[course] || 0
}

// a student is in the final year when the semester is in the last two semesters
const isFinalYear = (user) => {
    const max = getCourseDuration(user)
    if (!max) {
        return false
    }
    return user.semester >= max - 1
}

// role score: faculty 50, other staff 30, final year student 100, senior student 75, junior student 60
const getRoleScore = (user) => {
    if (user.role === "faculty") {
        return 50
    }
    if (user.role !== "student") {
        return 30
    }
    if (isFinalYear(user)) {
        return 100
    }
    const max = getCourseDuration(user) || 8
    const midPoint = Math.floor(max / 2)
    if (user.semester > midPoint) {
        return 75
    }
    return 60
}

// every no-show takes 15 points (at most 6 strikes count)
const getReliabilityScore = (user) => {
    const strikes = Math.min(user.noShowCount || 0, 6)
    return Math.max(0, 100 - strikes * 15)
}

// final year students get a bonus when the booking date is inside an exam window
const getExamProximityScore = async (user, bookingDate) => {
    if (!isFinalYear(user)) {
        return 0
    }
    const windows = await ExamWindow.find()
    const checkDate = new Date(bookingDate + "T00:00:00")
    for (const window of windows) {
        const start = new Date(window.startDate + "T00:00:00")
        const end = new Date(window.endDate + "T23:59:59")
        if (checkDate >= start && checkDate <= end) {
            const daysToExam = Math.ceil((end - checkDate) / (1000 * 60 * 60 * 24))
            return Math.max(0, 100 - daysToExam * 8)
        }
    }
    return 0
}

// calculatePriorityScore => role 50% + reliability 30% + exam 20%, between 0 and 100
const calculatePriorityScore = async (user, bookingDate) => {
    const roleScore = getRoleScore(user)
    const reliabilityScore = getReliabilityScore(user)
    const examScore = await getExamProximityScore(user, bookingDate)
    const total = Math.round(roleScore * 0.5 + reliabilityScore * 0.3 + examScore * 0.2)
    return Math.min(100, Math.max(0, total))
}

module.exports = {calculatePriorityScore}
