const {Reservation} = require("../models/reservationModel")
const {getPriority, compareReservations} = require("../utils/priority")

// decisionRow => one line of the answer: who got what and why
const decisionRow = (item) => {
    const reservation = item.reservation
    return {
        id: reservation._id,
        user: reservation.user.name,
        resource: reservation.resource.label,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        purpose: reservation.purpose,
        groupSize: reservation.groupSize || 1,
        tier: item.tier,
        score: item.score,
        status: reservation.status,
        reason: reservation.reason
    }
}

// runAllocation => the admin gives a date. We rank all pending and unallocated requests of that
// date and allocate them one by one. Confirmed, cancelled and no_show bookings are never touched.
const runAllocation = async (req, res) => {
    try {
        const date = req.body.date
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).send({message: "date is required and must be like 2026-10-25"})
        }

        // 1. load the requests of that date
        const reservations = await Reservation.find({date, status: {$in: ["pending", "unallocated"]}})
            .populate("user")
            .populate("resource")

        // 2. calculate the tier and score of every request
        const ranked = []
        for (const reservation of reservations) {
            if (!reservation.user || !reservation.resource) {
                continue // the user or the resource was deleted, nothing to allocate
            }
            const priority = await getPriority(reservation.user, reservation)
            reservation.priorityScore = priority.score
            ranked.push({reservation, tier: priority.tier, score: priority.score, createdAt: reservation.createdAt, _id: reservation._id})
        }

        // 3. sort: tier first, then score, then older request, then _id
        ranked.sort(compareReservations)

        // (the allocation itself comes in the next commit: for now we only show the ranking)
        const decisions = ranked.map(item => decisionRow(item))
        res.status(200).send({message: "Ranking for " + date + " (nothing was allocated yet)", data: {decisions}})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// getAllocationRuns => not written yet
const getAllocationRuns = async (req, res) => {
    res.status(501).send({message: "getAllocationRuns not implemented yet"})
}

module.exports = {runAllocation, getAllocationRuns}
