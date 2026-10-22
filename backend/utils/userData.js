// userData => the safe user object we send to the frontend (no password).
// The old frontend pages use "id", so we send _id as "id"
const userData = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        role: user.role,
        department: user.department,
        course: user.course,
        semester: user.semester,
        noShowCount: user.noShowCount,
        suspended: user.suspended,
        suspendedUntil: user.suspendedUntil,
        suspendReason: user.suspendReason
    }
}

module.exports = {userData}
