const mongoose = require("mongoose")
const {Reservation} = require("../models/reservationModel")
const {Resource} = require("../models/resourceModel")
const {User} = require("../models/userModel")
const {getSeatsUsed, allocateReservation} = require("../utils/allocation")

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
        purpose: reservation.purpose,
        eventDate: reservation.eventDate,
        groupSize: reservation.groupSize || 1,
        reason: reservation.reason,
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

// getAllReservations => every booking with the user and resource, optional ?status= and ?date=
const getAllReservations = async (req, res) => {
    try {
        const filter = {}
        if (req.query.status) {
            filter.status = req.query.status
        }
        if (req.query.date) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
                return res.status(400).send({message: "date must be like 2026-10-25"})
            }
            filter.date = req.query.date
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

// confirmReservation => force confirm a booking that is waiting, pending, unallocated or bumped.
// It can skip the priority order, but it can never take more seats than the resource has
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
        if (!["waiting", "pending", "unallocated", "bumped"].includes(reservation.status)) {
            return res.status(400).send({message: "Only waiting, pending, unallocated or bumped bookings can be force confirmed"})
        }
        const resource = await Resource.findById(reservation.resource)
        if (!resource) {
            return res.status(404).send({message: "The resource of this booking no longer exists"})
        }
        if (!resource.active) {
            return res.status(400).send({message: "This resource is not available for booking"})
        }

        // do the seats of the other confirmed bookings leave room for the whole group?
        const used = await getSeatsUsed(resource._id, reservation.date, reservation.startTime, reservation.endTime, reservation._id)
        if (used + (reservation.groupSize || 1) > resource.capacity) {
            return res.status(409).send({message: "There are not enough free seats for this group in that time slot. Force confirm was not applied"})
        }

        // the same capacity rule as the allocation run
        await allocateReservation(reservation, resource)
        if (reservation.status !== "confirmed") {
            return res.status(409).send({message: reservation.reason})
        }
        reservation.reason = "Confirmed by an admin"
        await reservation.save()
        await addDetails(reservation)
        res.status(200).send({message: "Reservation confirmed successfully", data: reservationRow(reservation)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// adminCancelReservation => admin cancels a pending, waiting, unallocated or confirmed booking. Nobody is promoted
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
        if (!["pending", "waiting", "unallocated", "confirmed"].includes(reservation.status)) {
            return res.status(400).send({message: "This booking cannot be cancelled"})
        }
        reservation.status = "cancelled"
        reservation.reason = "Cancelled by an admin"
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

// deleteReservation => admin deletes a booking for good (any status)
const deleteReservation = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid reservation id"})
        }
        const reservation = await Reservation.findByIdAndDelete(id)
        if (!reservation) {
            return res.status(404).send({message: "Reservation not found"})
        }
        await addDetails(reservation)
        res.status(200).send({message: "Reservation deleted successfully", data: reservationRow(reservation)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

module.exports = {getAllReservations, confirmReservation, adminCancelReservation, markNoShow, deleteReservation}
