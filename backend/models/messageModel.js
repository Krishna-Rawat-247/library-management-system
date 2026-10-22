const mongoose = require("mongoose")

// Message table (contact / guardian hold messages sent to the admin)
// fields follow the old db.json messages
const messageSchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    name: {type: String, required: true, trim: true},
    email: {type: String, trim: true},
    studentId: {type: String},
    department: {type: String},
    semester: {type: String}, // old data stores text like "Sem 3"
    role: {type: String},
    subject: {type: String, required: true, trim: true},
    message: {type: String, required: true, trim: true},
    timestamp: {type: String}, // old display text, kept for migrated messages
    status: {type: String, enum: ["unread", "read"], default: "unread"},
    reply: {type: String, default: null}, // admin reply
    createdAt: {type: Date, default: Date.now},
    legacyId: {type: String}
})

const Message = mongoose.model("Message", messageSchema)

module.exports = {Message}
