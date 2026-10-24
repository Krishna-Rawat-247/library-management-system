const {ExamWindow} = require("../models/examWindowModel")
const {Message} = require("../models/messageModel")

// migrateExamWindows => import the exam windows. The old field "title" is kept
const migrateExamWindows = async (oldData, confirm, report) => {
    let created = 0
    let skipped = 0

    for (const old of oldData.examWindows) {
        const legacyId = String(old.id)

        if (!old.startDate || !old.endDate || old.startDate > old.endDate) {
            report.push("exam window " + legacyId + " has missing dates or the start is after the end, not imported")
            continue
        }

        const exists = await ExamWindow.findOne({legacyId})
        if (exists) {
            skipped++
            continue
        }

        if (confirm) {
            await ExamWindow.create({
                title: old.title || "Exam Window " + old.startDate + " to " + old.endDate,
                startDate: old.startDate,
                endDate: old.endDate,
                legacyId
            })
        }
        created++
    }

    const word = confirm ? "created" : "would be created"
    console.log("Exam windows: " + created + " " + word + ", " + skipped + " already there (skipped)")
}

// migrateMessages => import the old contact messages.
// old messages have no user id, so we find the user by the email and use the users map
const migrateMessages = async (oldData, maps, confirm, report) => {
    let created = 0
    let skipped = 0

    for (const old of oldData.messages) {
        const legacyId = String(old.id)

        if (!old.name || !old.subject || !old.message) {
            report.push("message " + legacyId + " has no name, subject or text, not imported")
            continue
        }

        const exists = await Message.findOne({legacyId})
        if (exists) {
            skipped++
            continue
        }

        // find the writer: old message -> email -> old user -> new user id
        const oldUser = oldData.users.find(u => String(u.email).toLowerCase() === String(old.email).toLowerCase())
        const user = oldUser ? maps.users.get(String(oldUser.id)) : null
        if (!user) {
            report.push("message " + legacyId + " is from " + old.email + " who is not a known user, imported without a user")
        }
        if (old.status !== "read" && old.status !== "unread") {
            report.push("message " + legacyId + " has an unknown status '" + old.status + "', saved as unread")
        }

        // the old time is a text like "Aug 24, 2026, 04:30 AM". If it cannot be read we use now
        let createdAt = new Date(old.timestamp)
        if (isNaN(createdAt)) {
            report.push("message " + legacyId + " has a time that cannot be read ('" + old.timestamp + "'), used the current time")
            createdAt = new Date()
        }

        if (confirm) {
            await Message.create({
                user: user && user !== "dry-run" ? user : undefined,
                name: old.name,
                email: old.email,
                studentId: old.studentId,
                department: old.department,
                semester: old.semester,
                role: old.role,
                subject: old.subject,
                message: old.message,
                timestamp: old.timestamp,
                status: old.status === "read" ? "read" : "unread",
                createdAt,
                legacyId
            })
        }
        created++
    }

    const word = confirm ? "created" : "would be created"
    console.log("Messages: " + created + " " + word + ", " + skipped + " already there (skipped)")
}

// migrateExamMessages => exam windows first, then messages (they need the users map)
const migrateExamMessages = async (oldData, maps, confirm, report) => {
    await migrateExamWindows(oldData, confirm, report)
    await migrateMessages(oldData, maps, confirm, report)
}

module.exports = {migrateExamMessages}
