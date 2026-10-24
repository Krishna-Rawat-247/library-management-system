const mongoose = require("mongoose")

// AllocationRun table. One row every time an admin runs the allocation for a date
const allocationRunSchema = mongoose.Schema({
    date: {type: String, required: true}, // the booking date that was allocated
    ranBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    ranAt: {type: Date, default: Date.now},
    considered: {type: Number, default: 0},
    confirmed: {type: Number, default: 0},
    unallocated: {type: Number, default: 0}
})

const AllocationRun = mongoose.model("AllocationRun", allocationRunSchema)

module.exports = {AllocationRun}
