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

// getMyReservations => not written yet
const getMyReservations = async (req, res) => {
    res.status(501).send({message: "getMyReservations not implemented yet"})
}

// cancelReservation => not written yet
const cancelReservation = async (req, res) => {
    res.status(501).send({message: "cancelReservation not implemented yet"})
}

module.exports = {createReservation, getMyReservations, cancelReservation}
