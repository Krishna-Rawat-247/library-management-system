// Stub controller. The owner of this file replaces each function with the real logic.

const getResources = async (req, res) => {
    res.status(501).send({message: "getResources not implemented yet"})
}

const getResourceById = async (req, res) => {
    res.status(501).send({message: "getResourceById not implemented yet"})
}

const getAvailability = async (req, res) => {
    res.status(501).send({message: "getAvailability not implemented yet"})
}

const createResource = async (req, res) => {
    res.status(501).send({message: "createResource not implemented yet"})
}

const updateResource = async (req, res) => {
    res.status(501).send({message: "updateResource not implemented yet"})
}

const deleteResource = async (req, res) => {
    res.status(501).send({message: "deleteResource not implemented yet"})
}

module.exports = {getResources, getResourceById, getAvailability, createResource, updateResource, deleteResource}
