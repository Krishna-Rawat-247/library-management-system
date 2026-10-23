const bcrypt = require("bcrypt")
const {User} = require("../models/userModel")

// migrateUsers => import the users from db.json
// every plain text password is hashed with bcrypt. The plain text is never saved or printed
const migrateUsers = async (oldData, maps, confirm, report) => {
    let created = 0
    let skipped = 0
    const seenEmails = new Set()

    for (const old of oldData.users) {
        const legacyId = String(old.id)
        const email = String(old.email || "").trim().toLowerCase()

        if (!email || !old.password) {
            report.push("user " + legacyId + " has no email or password, not imported")
            continue
        }
        if (!["student", "faculty", "librarian", "admin"].includes(old.role)) {
            report.push("user " + legacyId + " has an unknown role '" + old.role + "', not imported")
            continue
        }
        if (seenEmails.has(email)) {
            report.push("user " + legacyId + " repeats the email of an earlier user, not imported")
            continue
        }
        seenEmails.add(email)

        // already imported before? then just remember its id and skip
        const exists = await User.findOne({$or: [{legacyId}, {email}]})
        if (exists) {
            maps.users.set(legacyId, exists._id)
            skipped++
            continue
        }

        // the old noShowCount should match the no_show reservations. Print it if not
        const noShows = oldData.reservations.filter(r => String(r.userId) === legacyId && r.status === "no_show").length
        if ((old.noShowCount || 0) !== noShows) {
            report.push("user " + legacyId + " has noShowCount " + (old.noShowCount || 0) + " but " + noShows + " no_show reservation(s)")
        }
        if (old.suspended && old.suspendedUntil && new Date(old.suspendedUntil) < new Date()) {
            report.push("user " + legacyId + " is suspended but the end date " + old.suspendedUntil + " is already over")
        }

        if (confirm) {
            const hashedPassword = await bcrypt.hash(old.password, 10)
            const user = await User.create({
                name: old.name,
                studentId: old.studentId,
                email,
                password: hashedPassword,
                role: old.role,
                department: old.department,
                course: old.course,
                semester: old.semester,
                noShowCount: old.noShowCount || 0,
                suspended: old.suspended || false,
                suspendedUntil: old.suspendedUntil ? new Date(old.suspendedUntil) : null,
                suspendReason: old.suspendReason || null,
                legacyId
            })
            maps.users.set(legacyId, user._id)
        } else {
            maps.users.set(legacyId, "dry-run")
        }
        created++
    }

    const word = confirm ? "created" : "would be created"
    console.log("Users: " + created + " " + word + ", " + skipped + " already there (skipped)")
}

module.exports = {migrateUsers}
