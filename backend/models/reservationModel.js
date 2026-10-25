const mongoose = require("mongoose")

// Reservation table. date and times stay as strings like "2026-10-25" and "10:00"
// the old statuses (completed, waiting, bumped) are only for migrated history
// Phase 2: a booking has a purpose, can be for a group and waits as "pending" until it is allocated
// Phase 3: an unallocated booking can get ONE alternative offer, and the student can join the waitlist
const reservationSchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    resource: {type: mongoose.Schema.Types.ObjectId, ref: "Resource", required: true},
    date: {type: String, required: true},
    startTime: {type: String, required: true},
    endTime: {type: String, required: true},
    status: {
        type: String,
        enum: ["pending", "confirmed", "unallocated", "waitlisted", "cancelled", "no_show", "completed", "waiting", "bumped"],
        default: "pending"
    },
    purpose: {
        type: String,
        enum: ["job_interview", "end_semester_exam", "mid_semester_exam", "quarterly_test", "project_work", "general_study"],
        default: "general_study" // old bookings have no purpose
    },
    eventDate: {type: String}, // the day of the interview or exam (not needed for general study)
    members: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}], // the other people of a group, not the requester
    groupSize: {type: Number, default: 1, min: 1}, // set by the server: 1 + members.length
    reason: {type: String}, // plain-language result of the allocation, shown to the student
    priorityScore: {type: Number, default: 0}, // set by the server, only for display
    // the one alternative offer of this booking (a booking never gets a second one)
    offer: {
        resource: {type: mongoose.Schema.Types.ObjectId, ref: "Resource"},
        status: {type: String, enum: ["offered", "accepted", "rejected", "expired"]},
        expiresAt: {type: Date},
        createdAt: {type: Date}
    },
    originalResource: {type: mongoose.Schema.Types.ObjectId, ref: "Resource"}, // set only when an accepted offer moved the booking
    waitlistedAt: {type: Date}, // when the student joined the waitlist (only for display, the order uses createdAt)
    checkedIn: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now},
    legacyId: {type: String}
})

const Reservation = mongoose.model("Reservation", reservationSchema)

module.exports = {Reservation}
