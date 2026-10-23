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

// suspendUser => body {days, reason}. days can be 1, 7, 30 or empty (empty means no end date)
const suspendUser = async (req, res) => {
    try {
        const id = req.params.id
        const {days, reason} = req.body
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid user id"})
        }
        if (id === req.user.id) {
            return res.status(400).send({message: "You cannot suspend yourself"})
        }
        let suspendedUntil = null
        if (days !== undefined && days !== null) {
            if (![1, 7, 30].includes(Number(days))) {
                return res.status(400).send({message: "Days must be 1, 7, 30 or empty"})
            }
            suspendedUntil = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000)
        }
        const user = await User.findByIdAndUpdate(
            id,
            {suspended: true, suspendedUntil, suspendReason: reason || "Suspended by admin"},
            {new: true}
        )
        if (!user) {
            return res.status(404).send({message: "User not found"})
        }
        res.status(200).send({message: "User suspended successfully", data: userData(user)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// unsuspendUser => clear the suspension
const unsuspendUser = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid user id"})
        }
        const user = await User.findByIdAndUpdate(
            id,
            {suspended: false, suspendedUntil: null, suspendReason: null},
            {new: true}
        )
        if (!user) {
            return res.status(404).send({message: "User not found"})
        }
        res.status(200).send({message: "User unsuspended successfully", data: userData(user)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

module.exports = {getAllUsers, changeRole, suspendUser, unsuspendUser}
