const mongoose = require("mongoose")
const {Resource} = require("../models/resourceModel")

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

// createResource => not written yet
const createResource = async (req, res) => {
    res.status(501).send({message: "createResource not implemented yet"})
}

// updateResource => not written yet
const updateResource = async (req, res) => {
    res.status(501).send({message: "updateResource not implemented yet"})
}

// deleteResource => not written yet
const deleteResource = async (req, res) => {
    res.status(501).send({message: "deleteResource not implemented yet"})
}

module.exports = {getResources, getResourceById, getAvailability, createResource, updateResource, deleteResource}
