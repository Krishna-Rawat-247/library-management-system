const mongoose = require("mongoose")
const {User} = require("../models/userModel")
const {userData} = require("../utils/userData")

// getAllUsers => admin sees every user (no passwords)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
        const data = users.map(user => userData(user))
        res.status(200).send({message: "Users fetched successfully", data})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// changeRole => admin changes the role of a user
const changeRole = async (req, res) => {
    try {
        const id = req.params.id
        const role = req.body.role
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid user id"})
        }
        if (!["student", "faculty", "librarian", "admin"].includes(role)) {
            return res.status(400).send({message: "Role must be student, faculty, librarian or admin"})
        }
        // so the last admin cannot remove their own admin rights by mistake
        if (id === req.user.id) {
            return res.status(400).send({message: "You cannot change your own role"})
        }
        const user = await User.findByIdAndUpdate(id, {role}, {new: true})
        if (!user) {
            return res.status(404).send({message: "User not found"})
        }
        res.status(200).send({message: "Role updated successfully", data: userData(user)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// suspendUser => not written yet
const suspendUser = async (req, res) => {
    res.status(501).send({message: "suspendUser not implemented yet"})
}

// unsuspendUser => not written yet
const unsuspendUser = async (req, res) => {
    res.status(501).send({message: "unsuspendUser not implemented yet"})
}

module.exports = {getAllUsers, changeRole, suspendUser, unsuspendUser}
