const mongoose = require("mongoose")
const {Resource} = require("../models/resourceModel")
const {Reservation} = require("../models/reservationModel")

// the only types allowed for new or edited resources
const ALLOWED_TYPES = [
    "study room",
    "discussion_room",
    "carrel",
    "computer station",
    "seminar hall",
    "community study hall",
    "reading pod"
]

// resourceData => the resource object we send (the old pages use "id")
const resourceData = (resource) => {
    return {
        id: resource._id,
        label: resource.label,
        type: resource.type,
        zone: resource.zone,
        capacity: resource.capacity,
        active: resource.active,
        image: resource.image
    }
}

// getResources => list resources, optional ?type= and ?zone=. Students see only active ones
const getResources = async (req, res) => {
    try {
        const filter = {}
        if (req.query.type) {
            filter.type = req.query.type
        }
        if (req.query.zone) {
            filter.zone = req.query.zone
        }
        if (req.user.role !== "admin") {
            filter.active = true
        }
        const resources = await Resource.find(filter)
        const data = resources.map(resource => resourceData(resource))
        res.status(200).send({message: "Resources fetched successfully", data})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// getResourceById => one resource. An inactive resource is hidden from non-admins
const getResourceById = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid resource id"})
        }
        const resource = await Resource.findById(id)
        if (!resource || (!resource.active && req.user.role !== "admin")) {
            return res.status(404).send({message: "Resource not found"})
        }
        res.status(200).send({message: "Resource fetched successfully", data: resourceData(resource)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// getAvailability => not written yet
const getAvailability = async (req, res) => {
    res.status(501).send({message: "getAvailability not implemented yet"})
}

// createResource => admin adds a new resource
const createResource = async (req, res) => {
    try {
        const {label, type, zone, capacity, active, image} = req.body
        if (!label || !type || !capacity) {
            return res.status(400).send({message: "Label, type and capacity are required"})
        }
        if (!ALLOWED_TYPES.includes(type)) {
            return res.status(400).send({message: "Type must be one of: " + ALLOWED_TYPES.join(", ")})
        }
        if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
            return res.status(400).send({message: "Capacity must be a whole number, 1 or more"})
        }
        const resource = await Resource.create({
            label,
            type,
            zone,
            capacity: Number(capacity),
            active,
            image
        })
        res.status(201).send({message: "Resource created successfully", data: resourceData(resource)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// updateResource => admin edits a resource. Only the fields sent are changed
const updateResource = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid resource id"})
        }
        const resource = await Resource.findById(id)
        if (!resource) {
            return res.status(404).send({message: "Resource not found"})
        }

        const {label, type, zone, capacity, active, image} = req.body
        // a migrated resource may have an old type, so only check the type when it changes
        if (type !== undefined && type !== resource.type && !ALLOWED_TYPES.includes(type)) {
            return res.status(400).send({message: "Type must be one of: " + ALLOWED_TYPES.join(", ")})
        }
        if (capacity !== undefined && (!Number.isInteger(Number(capacity)) || Number(capacity) < 1)) {
            return res.status(400).send({message: "Capacity must be a whole number, 1 or more"})
        }

        const updates = {}
        if (label !== undefined) updates.label = label
        if (type !== undefined) updates.type = type
        if (zone !== undefined) updates.zone = zone
        if (capacity !== undefined) updates.capacity = Number(capacity)
        if (active !== undefined) updates.active = active
        if (image !== undefined) updates.image = image
        if (Object.keys(updates).length === 0) {
            return res.status(400).send({message: "Nothing to update"})
        }

        const data = await Resource.findByIdAndUpdate(id, updates, {new: true, runValidators: true})
        res.status(200).send({message: "Resource updated successfully", data: resourceData(data)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// deleteResource => admin deletes a resource. Not allowed while it has upcoming confirmed bookings
const deleteResource = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid resource id"})
        }
        const today = new Date().toISOString().split("T")[0]
        const upcoming = await Reservation.countDocuments({
            resource: id,
            status: "confirmed",
            date: {$gte: today}
        })
        if (upcoming > 0) {
            return res.status(409).send({message: "This resource has upcoming confirmed bookings. Cancel them first or mark the resource inactive"})
        }
        const resource = await Resource.findByIdAndDelete(id)
        if (!resource) {
            return res.status(404).send({message: "Resource not found"})
        }
        res.status(200).send({message: "Resource deleted successfully", data: resourceData(resource)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

module.exports = {getResources, getResourceById, getAvailability, createResource, updateResource, deleteResource}
