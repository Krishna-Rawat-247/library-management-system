const {Reservation} = require("../models/reservationModel")
const {Resource} = require("../models/resourceModel")
const {getSeatsUsed, allocateReservation, findBusyPerson} = require("./allocation")
const {getPriority, compareReservations} = require("./priority")
const {hasStarted} = require("./timeCheck")

// Phase 3: the waitlist. A student joins it by choice (it never happens by itself).
// The order is the same as everywhere: tier, score, then the older request, then _id.

// getQueue => the waitlisted bookings of a resource that overlap the given time, best first.
// Every item looks like {reservation, tier, score, createdAt, _id} (the user is populated)
const getQueue = async (resourceId, date, startTime, endTime) => {
    const reservations = await Reservation.find({
        resource: resourceId,
        status: "waitlisted",
        date,
        startTime: {$lt: endTime},
        endTime: {$gt: startTime}
    }).populate("user")

    const queue = []
    for (const reservation of reservations) {
        if (!reservation.user) {
            continue // the user was deleted
        }
        const priority = await getPriority(reservation.user, reservation)
        queue.push({reservation, tier: priority.tier, score: priority.score, createdAt: reservation.createdAt, _id: reservation._id})
    }
    queue.sort(compareReservations)
    return queue
}

// getQueuePosition => the place of a waitlisted booking in its queue (1 = first), or null
const getQueuePosition = async (reservation) => {
    if (reservation.status !== "waitlisted") {
        return null
    }
    const resourceId = reservation.resource._id || reservation.resource // populated or plain id
    const queue = await getQueue(resourceId, reservation.date, reservation.startTime, reservation.endTime)
    const index = queue.findIndex(item => String(item._id) === String(reservation._id))
    return index === -1 ? null : index + 1
}

// reconsiderWaitlist => a confirmed booking was cancelled, so seats may be free.
// Go through the queue in order and confirm every request that fits. A group that does not fit is
// skipped and the next one is tried. Started bookings and busy people are skipped too.
// Nobody who is confirmed is ever touched. Returns how many bookings were confirmed.
const reconsiderWaitlist = async (resourceId, date, startTime, endTime) => {
    const resource = await Resource.findById(resourceId)
    if (!resource || !resource.active) {
        return 0
    }

    const queue = await getQueue(resourceId, date, startTime, endTime)
    let confirmed = 0
    for (const item of queue) {
        const reservation = item.reservation
        if (hasStarted(reservation.date, reservation.startTime)) {
            continue
        }
        if (await findBusyPerson(reservation)) {
            continue
        }
        const groupSize = reservation.groupSize || 1
        const used = await getSeatsUsed(resource._id, reservation.date, reservation.startTime, reservation.endTime, reservation._id)
        if (used + groupSize > resource.capacity) {
            continue
        }

        await allocateReservation(reservation, resource)
        if (reservation.status === "confirmed") {
            reservation.reason = "Confirmed from the waitlist"
            confirmed++
        } else {
            // the safety recount in allocateReservation said no, so it keeps its place in the queue
            reservation.status = "waitlisted"
            reservation.reason = "Waiting in the queue for a free seat"
        }
        await reservation.save()
    }
    return confirmed
}

module.exports = {getQueue, getQueuePosition, reconsiderWaitlist}
