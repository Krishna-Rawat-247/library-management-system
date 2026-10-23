const mongoose = require("mongoose")
const {Reservation} = require("../models/reservationModel")
const {Resource} = require("../models/resourceModel")
const {User} = require("../models/userModel")
const {calculatePriorityScore} = require("../utils/priority")

// reservationData => the booking object we send (the old pages use "id").
// resource is the full resource when populated, otherwise only its id
const reservationData = (reservation) => {
    const resource = reservation.resource
    return {
        id: reservation._id,
        resource: resource && resource.label
            ? {id: resource._id, label: resource.label, type: resource.type, zone: resource.zone, capacity: resource.capacity}
            : resource,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        priorityScore: reservation.priorityScore,
        checkedIn: reservation.checkedIn,
        createdAt: reservation.createdAt
    }
}

// createReservation => the booking rules of Phase 1. The server decides everything.
// user, status and priorityScore sent in the body are ignored
const createReservation = async (req, res) => {
    try {
        const {resourceId, date, startTime, endTime} = req.body
        if (!resourceId || !date || !startTime || !endTime) {
            return res.status(400).send({message: "resourceId, date, startTime and endTime are required"})
        }
        if (!mongoose.isValidObjectId(resourceId)) {
            return res.status(400).send({message: "Invalid resource id"})
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
            return res.status(400).send({message: "Date must be YYYY-MM-DD and times must be HH:MM"})
        }
        if (startTime >= endTime) {
            return res.status(400).send({message: "End time must be after start time"})
        }
        const today = new Date().toISOString().split("T")[0]
        if (date < today) {
            return res.status(400).send({message: "Cannot book in the past"})
        }

        // the resource must exist and be active
        const resource = await Resource.findById(resourceId)
        if (!resource) {
            return res.status(404).send({message: "Resource not found"})
        }
        if (!resource.active) {
            return res.status(400).send({message: "This resource is not available for booking"})
        }

        // the user is read from the database, so a suspension is never missed (the token is not enough)
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).send({message: "User not found"})
        }
        if (user.suspended && (!user.suspendedUntil || user.suspendedUntil > new Date())) {
            const until = user.suspendedUntil ? " until " + user.suspendedUntil.toISOString().split("T")[0] : " indefinitely"
            return res.status(403).send({message: "Your account is suspended" + until + ". You cannot make new bookings"})
        }

        // the user cannot have another confirmed booking at the same time (any resource)
        const ownBooking = await Reservation.findOne({
            user: user._id,
            status: "confirmed",
            date,
            startTime: {$lt: endTime},
            endTime: {$gt: startTime}
        })
        if (ownBooking) {
            return res.status(409).send({message: "You already have a booking that overlaps this time"})
        }

        // capacity check. No bumping and no waiting list in Phase 1
        const booked = await Reservation.countDocuments({
            resource: resource._id,
            status: "confirmed",
            date,
            startTime: {$lt: endTime},
            endTime: {$gt: startTime}
        })
        if (booked >= resource.capacity) {
            return res.status(409).send({message: "No seats left for that time"})
        }

        // the score is saved only for display. It does not change the result
        const priorityScore = await calculatePriorityScore(user, date)
        const reservation = await Reservation.create({
            user: user._id,
            resource: resource._id,
            date,
            startTime,
            endTime,
            status: "confirmed",
            priorityScore
        })
        reservation.resource = resource
        res.status(201).send({message: "Resource booked successfully", data: reservationData(reservation)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// getMyReservations => all bookings of the logged in user, newest first, with resource details
const getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({user: req.user.id})
            .populate("resource")
            .sort({date: -1, startTime: -1})
        const data = reservations.map(reservation => reservationData(reservation))
        res.status(200).send({message: "Reservations fetched successfully", data})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// cancelReservation => the owner or an admin cancels a confirmed booking that has not started.
// nobody is promoted after a cancel
const cancelReservation = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid reservation id"})
        }
        const reservation = await Reservation.findById(id)
        if (!reservation) {
            return res.status(404).send({message: "Reservation not found"})
        }
        if (String(reservation.user) !== req.user.id && req.user.role !== "admin") {
            return res.status(403).send({message: "You can cancel only your own bookings"})
        }
        if (reservation.status !== "confirmed") {
            return res.status(400).send({message: "Only confirmed bookings can be cancelled"})
        }
        const start = new Date(reservation.date + "T" + reservation.startTime)
        if (start <= new Date()) {
            return res.status(400).send({message: "A booking that has started cannot be cancelled"})
        }

        reservation.status = "cancelled"
        await reservation.save()
        res.status(200).send({message: "Booking cancelled successfully", data: reservationData(reservation)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

module.exports = {createReservation, getMyReservations, cancelReservation}
