const {Reservation} = require("../models/reservationModel")
const {getToday} = require("./timeCheck")

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

// getCutoffDate => the date 90 days ago in library time. Older no-shows stop counting
const getCutoffDate = () => {
    const date = new Date(getToday() + "T00:00:00Z")
    date.setUTCDate(date.getUTCDate() - 90)
    return date.toISOString().slice(0, 10)
}

// getRecentNoShows => how many no-show bookings the user had in the last 90 days
const getRecentNoShows = async (userId) => {
    return await Reservation.countDocuments({
        user: userId,
        status: "no_show",
        date: {$gte: getCutoffDate()}
    })
}

// reliabilityFromNoShows => 10 points, minus 3 for every recent no-show, never below 0
const reliabilityFromNoShows = (noShows) => {
    return Math.max(0, 10 - 3 * noShows)
}

// getReliabilityScore => the reliability score of one user
const getReliabilityScore = async (userId) => {
    return reliabilityFromNoShows(await getRecentNoShows(userId))
}

// getPriorityBreakdown => the numbers we show on the profile page and in the admin panel
const getPriorityBreakdown = async (user) => {
    const recentNoShows = await getRecentNoShows(user._id)
    return {
        roleScore: getRoleScore(user),
        reliabilityScore: reliabilityFromNoShows(recentNoShows),
        recentNoShows
    }
}

// getRecentNoShowCounts => recent no-shows of ALL users in one query (a Map: user id -> number)
const getRecentNoShowCounts = async () => {
    const bookings = await Reservation.find({status: "no_show", date: {$gte: getCutoffDate()}})
    const counts = new Map()
    for (const booking of bookings) {
        const id = String(booking.user)
        counts.set(id, (counts.get(id) || 0) + 1)
    }
    return counts
}

// getPriority => the tier and the score of one request. Only the requester counts, never the group members
const getPriority = async (user, reservation) => {
    const tier = PURPOSE_TIER[reservation.purpose] || 1
    const breakdown = await getPriorityBreakdown(user)
    return {tier, score: breakdown.roleScore + breakdown.reliabilityScore}
}

// compareReservations => the sort order: tier (high first), score (high first),
// then the older request, then the smaller _id. a and b look like {tier, score, createdAt, _id}
const compareReservations = (a, b) => {
    if (b.tier !== a.tier) {
        return b.tier - a.tier
    }
    if (b.score !== a.score) {
        return b.score - a.score
    }
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    if (timeA !== timeB) {
        return timeA - timeB
    }
    return String(a._id).localeCompare(String(b._id))
}

// calculatePriorityScore => kept so the Phase 1 booking code keeps working. Same number as getPriority().score
const calculatePriorityScore = async (user, bookingDate) => {
    const breakdown = await getPriorityBreakdown(user)
    return breakdown.roleScore + breakdown.reliabilityScore
}

module.exports = {
    PURPOSE_TIER,
    getRoleScore,
    getRecentNoShows,
    reliabilityFromNoShows,
    getReliabilityScore,
    getPriorityBreakdown,
    getRecentNoShowCounts,
    getPriority,
    compareReservations,
    calculatePriorityScore
}
