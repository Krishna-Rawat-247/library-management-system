// Stub controller. The owner of this file replaces each function with the real logic.

const getAllUsers = async (req, res) => {
    res.status(501).send({message: "getAllUsers not implemented yet"})
}

const changeRole = async (req, res) => {
    res.status(501).send({message: "changeRole not implemented yet"})
}

const suspendUser = async (req, res) => {
    res.status(501).send({message: "suspendUser not implemented yet"})
}

const unsuspendUser = async (req, res) => {
    res.status(501).send({message: "unsuspendUser not implemented yet"})
}

module.exports = {getAllUsers, changeRole, suspendUser, unsuspendUser}
