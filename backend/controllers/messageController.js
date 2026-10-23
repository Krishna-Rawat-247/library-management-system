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

// updateMessage => not written yet
const updateMessage = async (req, res) => {
    res.status(501).send({message: "updateMessage not implemented yet"})
}

// deleteMessage => not written yet
const deleteMessage = async (req, res) => {
    res.status(501).send({message: "deleteMessage not implemented yet"})
}

module.exports = {sendMessage, getMessages, updateMessage, deleteMessage}
