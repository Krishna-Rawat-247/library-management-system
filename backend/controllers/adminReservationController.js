// Stub controller. The owner of this file replaces each function with the real logic.

const getAllReservations = async (req, res) => {
    res.status(501).send({message: "getAllReservations not implemented yet"})
}

const confirmReservation = async (req, res) => {
    res.status(501).send({message: "confirmReservation not implemented yet"})
}

const adminCancelReservation = async (req, res) => {
    res.status(501).send({message: "adminCancelReservation not implemented yet"})
}

const markNoShow = async (req, res) => {
    res.status(501).send({message: "markNoShow not implemented yet"})
}

const deleteReservation = async (req, res) => {
    res.status(501).send({message: "deleteReservation not implemented yet"})
}

module.exports = {getAllReservations, confirmReservation, adminCancelReservation, markNoShow, deleteReservation}
