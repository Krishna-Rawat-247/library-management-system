const {User} = require("../models/userModel")
const {userData} = require("../utils/userData")

// updateMe => a user can change only name, department, course and semester of their own account
// role, email, password and strikes can never be changed from here
const updateMe = async (req, res) => {
    try {
        const {name, department, course, semester} = req.body
        const updates = {}
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).send({message: "Name cannot be empty"})
            }
            updates.name = name.trim()
        }
        if (department !== undefined) {
            updates.department = department
        }
        if (course !== undefined) {
            updates.course = course
        }
        if (semester !== undefined) {
            if (isNaN(semester) || Number(semester) < 1) {
                return res.status(400).send({message: "Invalid semester"})
            }
            updates.semester = Number(semester)
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).send({message: "Nothing to update"})
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, {new: true, runValidators: true})
        if (!user) {
            return res.status(404).send({message: "User not found"})
        }
        res.status(200).send({message: "Profile updated successfully", data: userData(user)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

module.exports = {updateMe}
