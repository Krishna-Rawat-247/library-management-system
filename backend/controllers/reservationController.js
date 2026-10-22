// Stub controller. The owner of this file replaces each function with the real logic.

const createReservation = async (req, res) => {
    res.status(501).send({message: "createReservation not implemented yet"})
}

const getMyReservations = async (req, res) => {
    res.status(501).send({message: "getMyReservations not implemented yet"})
}

const cancelReservation = async (req, res) => {
    res.status(501).send({message: "cancelReservation not implemented yet"})
}

module.exports = {createReservation, getMyReservations, cancelReservation}
