const {Reservation} = require("../models/reservationModel")

// seats.js => Phase 4: which seats are taken and which seats a booking gets.
// Only the seats of CONFIRMED bookings are taken. The wish of a student (preferredSeats) holds nothing.
// The number of free seats is still decided by allocateReservation (utils/allocation.js),
// this file only chooses WHICH seats, after that rule said the whole group fits.

// hasSeatMap => true if the room has a seat map with at least one seat
const hasSeatMap = (resource) => {
    return !!(resource && resource.layout && resource.layout.seats && resource.layout.seats.length > 0)
}

// getTakenSeats => the names of the seats (like "A1") that confirmed bookings hold in a time.
// ignoreId is optional: leave that booking out (used when we look for the seats of a booking itself)
const getTakenSeats = async (resourceId, date, startTime, endTime, ignoreId) => {
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
    const taken = []
    for (const booking of bookings) {
        for (const label of booking.seats || []) {
            taken.push(label)
        }
    }
    return taken
}

// distance => how far two seats are from each other. A seat in another row counts more than a seat
// a few places away in the same row, so a group stays together in one row when it can
const distance = (a, b) => {
    return Math.abs(a.row - b.row) * 3 + Math.abs(a.col - b.col)
}

// findRun => the first run of "size" free seats that sit side by side in one row, or null.
// free is the list of free seats ordered by row and column. An aisle (a gap in the columns) breaks a run
const findRun = (free, size) => {
    let run = []
    for (const seat of free) {
        const last = run[run.length - 1]
        if (last && last.row === seat.row && seat.col === last.col + 1) {
            run.push(seat)
        } else {
            run = [seat]
        }
        if (run.length === size) {
            return run
        }
    }
    return null
}

// assignSeats => the names of the seats the booking gets in the room. It does not save anything.
// 1. the wished seats that are still free
// 2. no wish at all: a run of seats side by side in one row (best effort)
// 3. the rest: the free seats closest to the first chosen seat (or to the first wished seat, if all of them are taken)
// A room without a seat map gives an empty list. If there are not enough free seats the list is shorter
const assignSeats = async (reservation, resource) => {
    if (!hasSeatMap(resource)) {
        return []
    }
    const groupSize = reservation.groupSize || 1
    const wished = reservation.preferredSeats || []
    const taken = await getTakenSeats(resource._id, reservation.date, reservation.startTime, reservation.endTime, reservation._id)

    // the free seats, in the order row by row, left to right (the layout is saved in that order)
    const free = []
    for (const seat of resource.layout.seats) {
        if (!taken.includes(seat.label)) {
            free.push(seat)
        }
    }

    // 1. the wish
    const chosen = []
    for (const label of wished) {
        const seat = free.find(item => item.label === label)
        if (seat && !chosen.includes(seat) && chosen.length < groupSize) {
            chosen.push(seat)
        }
    }

    // 2. no wish at all: look for seats side by side
    if (wished.length === 0) {
        const run = findRun(free, groupSize)
        if (run) {
            for (const seat of run) {
                chosen.push(seat)
            }
        }
    }

    // 3. fill what is missing with the free seats nearest to the anchor
    if (chosen.length < groupSize && free.length > 0) {
        let anchor = chosen[0]
        if (!anchor) {
            // all wished seats are taken: stay near the first wished seat that exists in the room
            anchor = resource.layout.seats.find(item => item.label === wished[0])
        }
        if (!anchor) {
            anchor = free[0]
        }
        const others = free.filter(seat => !chosen.includes(seat))
        others.sort((a, b) => distance(a, anchor) - distance(b, anchor))
        for (const seat of others) {
            if (chosen.length < groupSize) {
                chosen.push(seat)
            }
        }
    }

    return chosen.map(seat => seat.label)
}

module.exports = {hasSeatMap, getTakenSeats, assignSeats}
