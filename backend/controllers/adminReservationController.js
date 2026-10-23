const mongoose = require("mongoose")
const {Reservation} = require("../models/reservationModel")
const {Resource} = require("../models/resourceModel")
const {User} = require("../models/userModel")

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

// confirmReservation => force confirm an old waiting/pending/bumped booking, only if a seat is free
const confirmReservation = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid reservation id"})
        }
        const reservation = await Reservation.findById(id)
        if (!reservation) {
            return res.status(404).send({message: "Reservation not found"})
        }
        if (!["waiting", "pending", "bumped"].includes(reservation.status)) {
            return res.status(400).send({message: "Only waiting, pending or bumped bookings can be force confirmed"})
        }
        const resource = await Resource.findById(reservation.resource)
        if (!resource) {
            return res.status(404).send({message: "The resource of this booking no longer exists"})
        }

        // count the other confirmed bookings in the same time on the same resource
        const booked = await Reservation.countDocuments({
            _id: {$ne: reservation._id},
            resource: reservation.resource,
            status: "confirmed",
            date: reservation.date,
            startTime: {$lt: reservation.endTime},
            endTime: {$gt: reservation.startTime}
        })
        if (booked >= resource.capacity) {
            return res.status(409).send({message: "This time slot is already full. Force confirm was not applied"})
        }

        reservation.status = "confirmed"
        await reservation.save()
        await addDetails(reservation)
        res.status(200).send({message: "Reservation confirmed successfully", data: reservationRow(reservation)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// adminCancelReservation => admin cancels a pending, waiting or confirmed booking. Nobody is promoted
const adminCancelReservation = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid reservation id"})
        }
        const reservation = await Reservation.findById(id)
        if (!reservation) {
            return res.status(404).send({message: "Reservation not found"})
        }
        if (!["pending", "waiting", "confirmed"].includes(reservation.status)) {
            return res.status(400).send({message: "This booking cannot be cancelled"})
        }
        reservation.status = "cancelled"
        await reservation.save()
        await addDetails(reservation)
        res.status(200).send({message: "Reservation cancelled successfully", data: reservationRow(reservation)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// markNoShow => the booking becomes no_show and the user gets one more strike.
// There is no automatic suspension in Phase 1
const markNoShow = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid reservation id"})
        }
        const reservation = await Reservation.findById(id)
        if (!reservation) {
            return res.status(404).send({message: "Reservation not found"})
        }
        if (reservation.status !== "confirmed") {
            return res.status(400).send({message: "Only confirmed bookings can be marked as no-show"})
        }
        reservation.status = "no_show"
        await reservation.save()
        await User.findByIdAndUpdate(reservation.user, {$inc: {noShowCount: 1}})
        await addDetails(reservation)
        res.status(200).send({message: "Marked as no-show", data: reservationRow(reservation)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// deleteReservation => not written yet
const deleteReservation = async (req, res) => {
    res.status(501).send({message: "deleteReservation not implemented yet"})
}

module.exports = {getAllReservations, confirmReservation, adminCancelReservation, markNoShow, deleteReservation}
