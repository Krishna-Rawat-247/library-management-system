const {Reservation} = require("../models/reservationModel")

// The one capacity rule of Phase 2. The allocation run and the immediate allocation both use it.
// Only CONFIRMED bookings use seats. pending and unallocated bookings never block anyone.

// getSeatsUsed => seats taken on a resource in a time (a group takes groupSize seats).
// ignoreId is optional: leave that booking out of the count (used when we check a booking itself)
const getSeatsUsed = async (resourceId, date, startTime, endTime, ignoreId) => {
    const filter = {
        resource: resourceId,
        status: "confirmed",
        date,
        startTime: {$lt: endTime},
        endTime: {$gt: startTime}
    }
    if (ignoreId) {
        filter._id = {$ne: ignoreId}
    }
    const bookings = await Reservation.find(filter)
    let used = 0
    for (const booking of bookings) {
        used = used + (booking.groupSize || 1) // old bookings have no groupSize, they count as 1
    }
    return used
}

// allocateReservation => confirm the booking if the WHOLE group fits, otherwise mark it unallocated.
// It never changes any other booking, so a confirmed booking is never taken away.
const allocateReservation = async (reservation, resource) => {
    const groupSize = reservation.groupSize || 1
    const used = await getSeatsUsed(resource._id, reservation.date, reservation.startTime, reservation.endTime, reservation._id)

    if (used + groupSize <= resource.capacity) {
        reservation.status = "confirmed"
        reservation.reason = "Allocated"
    } else {
        reservation.status = "unallocated"
        reservation.reason = "No seats left for your whole group at that time"
    }
    await reservation.save()

    // safety recount: if two requests were confirmed at the same moment and the seats are now
    // over the capacity, this one goes back to unallocated
    if (reservation.status === "confirmed") {
        const total = await getSeatsUsed(resource._id, reservation.date, reservation.startTime, reservation.endTime)
        if (total > resource.capacity) {
            reservation.status = "unallocated"
            reservation.reason = "No seats left for your whole group at that time"
            await reservation.save()
        }
    }
    return reservation
}

module.exports = {getSeatsUsed, allocateReservation}
