const mongoose = require("mongoose")
const {Message} = require("../models/messageModel")
const {User} = require("../models/userModel")

// messageData => the message object we send (the old admin panel uses "id" and "timestamp")
const messageData = (message) => {
    return {
        id: message._id,
        name: message.name,
        email: message.email,
        studentId: message.studentId,
        department: message.department,
        semester: message.semester,
        role: message.role,
        subject: message.subject,
        message: message.message,
        timestamp: message.timestamp || message.createdAt.toLocaleString("en-US"),
        status: message.status,
        reply: message.reply,
        createdAt: message.createdAt
    }
}

// sendMessage => a logged in user writes to the admin.
// name, email, department and role are taken from the database, not from the request
const sendMessage = async (req, res) => {
    try {
        const {subject, message} = req.body
        if (!subject || !message) {
            return res.status(400).send({message: "Subject and message are required"})
        }
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).send({message: "User not found"})
        }
        const newMessage = await Message.create({
            user: user._id,
            name: user.name,
            email: user.email,
            studentId: user.studentId,
            department: user.department,
            semester: user.semester ? "Sem " + user.semester : undefined,
            role: user.role,
            subject,
            message
        })
        res.status(201).send({message: "Message sent successfully", data: messageData(newMessage)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// getMessages => admin sees all messages, any other user sees only their own. Newest first
const getMessages = async (req, res) => {
    try {
        const filter = {}
        if (req.user.role !== "admin") {
            filter.user = req.user.id
        }
        if (req.query.status) {
            filter.status = req.query.status
        }
        const messages = await Message.find(filter).sort({createdAt: -1})
        const data = messages.map(message => messageData(message))
        res.status(200).send({message: "Messages fetched successfully", data})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// updateMessage => admin marks a message read/unread or writes a reply (a reply also marks it read)
const updateMessage = async (req, res) => {
    try {
        const id = req.params.id
        const {status, reply} = req.body
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid message id"})
        }
        if (status === undefined && reply === undefined) {
            return res.status(400).send({message: "Send a status or a reply"})
        }
        if (status !== undefined && !["unread", "read"].includes(status)) {
            return res.status(400).send({message: "Status must be unread or read"})
        }
        const updates = {}
        if (status !== undefined) {
            updates.status = status
        }
        if (reply !== undefined) {
            updates.reply = reply
            if (status === undefined) {
                updates.status = "read"
            }
        }
        const message = await Message.findByIdAndUpdate(id, updates, {new: true})
        if (!message) {
            return res.status(404).send({message: "Message not found"})
        }
        res.status(200).send({message: "Message updated successfully", data: messageData(message)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// deleteMessage => admin deletes a message
const deleteMessage = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid message id"})
        }
        const message = await Message.findByIdAndDelete(id)
        if (!message) {
            return res.status(404).send({message: "Message not found"})
        }
        res.status(200).send({message: "Message deleted successfully", data: messageData(message)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

module.exports = {sendMessage, getMessages, updateMessage, deleteMessage}
