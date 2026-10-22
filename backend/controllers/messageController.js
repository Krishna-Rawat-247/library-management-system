// Stub controller. The owner of this file replaces each function with the real logic.

const sendMessage = async (req, res) => {
    res.status(501).send({message: "sendMessage not implemented yet"})
}

const getMessages = async (req, res) => {
    res.status(501).send({message: "getMessages not implemented yet"})
}

const updateMessage = async (req, res) => {
    res.status(501).send({message: "updateMessage not implemented yet"})
}

const deleteMessage = async (req, res) => {
    res.status(501).send({message: "deleteMessage not implemented yet"})
}

module.exports = {sendMessage, getMessages, updateMessage, deleteMessage}
