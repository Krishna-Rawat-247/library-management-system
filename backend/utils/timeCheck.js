// timeCheck.js => date and time checks in "library time".
// A deployed server usually runs in UTC, but the library is in India (UTC+5:30).
// The offset in minutes comes from .env (LIBRARY_UTC_OFFSET_MINUTES). If it is empty we use 330.

// getOffsetMinutes => the library's offset from UTC in minutes
const getOffsetMinutes = () => {
    const value = process.env.LIBRARY_UTC_OFFSET_MINUTES
    if (value === undefined || value === "" || isNaN(Number(value))) {
        return 330
    }
    return Number(value)
}

// getLibraryNow => the current time written as text like "2026-10-25T14:30:00.000Z"
// but shifted to library time (so the first 10 letters are the library date, letters 11 to 16 the time)
const getLibraryNow = () => {
    return new Date(Date.now() + getOffsetMinutes() * 60 * 1000).toISOString()
}

// getToday => today's date in library time as "YYYY-MM-DD"
const getToday = () => {
    return getLibraryNow().slice(0, 10)
}

// hasStarted => true if the booking has already started in library time
const hasStarted = (date, startTime) => {
    const now = getLibraryNow()
    const today = now.slice(0, 10)
    const nowTime = now.slice(11, 16)
    if (date < today) {
        return true
    }
    return date === today && startTime <= nowTime
}

// isSlotAligned => true only for times on the hour or half hour like "10:00" or "10:30"
const isSlotAligned = (time) => {
    return /^([01]\d|2[0-3]):(00|30)$/.test(String(time))
}

module.exports = {getToday, hasStarted, isSlotAligned}
