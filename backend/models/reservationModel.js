const mongoose = require("mongoose")

// Reservation table. date and times stay as strings like "2026-10-25" and "10:00"
// the old statuses (completed, waiting, bumped) are only for migrated history
const reservationSchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    resource: {type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true},
    date: {type: String, required: true},
    startTime: {type: String, required: true},
    endTime: {type: String, required: true},
    status: {
        type: String,
        enum: ["confirmed", "cancelled", "no_show", "completed", "waiting", "bumped", "pending"],
        default: "confirmed"
    },
    priorityScore: {type: Number, default: 0}, // set by the server, only for display
    checkedIn: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
    legacyId: {type: String}
})

const Reservation = mongoose.model("Reservation", reservationSchema)

module.exports = {Reservation}
