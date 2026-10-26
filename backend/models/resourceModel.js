const mongoose = require("mongoose")

// one seat of a seat map: where it is in the grid (row and column start at 0) and its name like "A1"
const seatSchema = mongoose.Schema({
    row: {type: Number, required: true},
    col: {type: Number, required: true},
    label: {type: String, required: true}
}, {_id: false})

// the seat map of a room (Phase 4). The grid has rows x cols squares, only the squares in seats are real seats
const layoutSchema = mongoose.Schema({
    rows: {type: Number, required: true},
    cols: {type: Number, required: true},
    seats: [seatSchema]
}, {_id: false})

// Resource table (study rooms, carrels, etc.)
// allowed types for new resources are checked in resourceController
const resourceSchema = mongoose.Schema({
    label: {type: String, required: true, trim: true},
    type: {type: String, required: true, trim: true},
    zone: {type: String, trim: true},
    capacity: {type: Number, required: true, min: 1}, // for a room with a seat map this is the number of seats
    layout: {type: layoutSchema, default: undefined}, // the seat map, empty for rooms without one
    active: {type: Boolean, default: true}, // replaces the old "available" flag
    image: {type: String}, // optional image path
    legacyId: {type: String}
})

const Resource = mongoose.model("Resource", resourceSchema)

module.exports = {Resource}
