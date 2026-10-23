const {Reservation} = require("../models/reservationModel")

// reservationRow => one row for the admin table. user and resource are populated,
// but they can be empty if the user or resource was deleted later
const reservationRow = (reservation) => {
    const user = reservation.user
    const resource = reservation.resource
    return {
        id: reservation._id,
        user: user && user.name ? {id: user._id, name: user.name, email: user.email} : null,
        resource: resource && resource.label ? {id: resource._id, label: resource.label} : null,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        priorityScore: reservation.priorityScore,
        checkedIn: reservation.checkedIn,
        createdAt: reservation.createdAt
    }
}

// addDetails => fill the user name and resource label, so the answer looks like the table rows
const addDetails = async (reservation) => {
    await reservation.populate([
        {path: "user", select: "name email"},
        {path: "resource", select: "label"}
    ])
}

// getAllReservations => every booking with the user and resource, optional ?status=
const getAllReservations = async (req, res) => {
    try {
        const filter = {}
        if (req.query.status) {
            filter.status = req.query.status
        }
        const reservations = await Reservation.find(filter)
            .populate("user", "name email")
            .populate("resource", "label")
            .sort({date: 1, startTime: 1})
        const data = reservations.map(reservation => reservationRow(reservation))
        res.status(200).send({message: "Reservations fetched successfully", data})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// confirmReservation => not written yet
const confirmReservation = async (req, res) => {
    res.status(501).send({message: "confirmReservation not implemented yet"})
}

// adminCancelReservation => not written yet
const adminCancelReservation = async (req, res) => {
    res.status(501).send({message: "adminCancelReservation not implemented yet"})
}

// markNoShow => not written yet
const markNoShow = async (req, res) => {
    res.status(501).send({message: "markNoShow not implemented yet"})
}

// deleteReservation => not written yet
const deleteReservation = async (req, res) => {
    res.status(501).send({message: "deleteReservation not implemented yet"})
}

module.exports = {getAllReservations, confirmReservation, adminCancelReservation, markNoShow, deleteReservation}
