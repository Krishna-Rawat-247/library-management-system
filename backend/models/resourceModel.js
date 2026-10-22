const mongoose = require("mongoose")

// Resource table (study rooms, carrels, etc.)
// allowed types for new resources are checked in resourceController
const resourceSchema = mongoose.Schema({
    label: {type: String, required: true, trim: true},
    type: {type: String, required: true, trim: true},
    zone: {type: String, trim: true},
    capacity: {type: Number, required: true, min: 1},
    active: {type: Boolean, default: true}, // replaces the old "available" flag
    image: {type: String}, // optional image path
    legacyId: {type: String}
})

const Resource = mongoose.model("Resource", resourceSchema)

module.exports = {Resource}
