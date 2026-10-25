const {Resource} = require("../models/resourceModel")
const {getSeatsUsed} = require("./allocation")
const {toLibraryDate} = require("./timeCheck")

// Phase 3: one alternative offer for a booking that ended "unallocated".
// An offer is only a suggestion. It does NOT hold any seats. Accepting it checks everything again.

const NO_ALTERNATIVE_TEXT = "No alternative is free at that time. You can join the waitlist."
const OFFER_TEXT = "An alternative is available: "

// getOfferMinutes => how long an offer stays open (OFFER_MINUTES in .env, 60 if it is empty)
const getOfferMinutes = () => {
    const value = Number(process.env.OFFER_MINUTES)
    if (!process.env.OFFER_MINUTES || isNaN(value) || value <= 0) {
        return 60
    }
    return value
}

// cleanReason => the reason without the offer sentences we added earlier, so they are never repeated
const cleanReason = (reason) => {
    let text = reason || ""
    for (const marker of [OFFER_TEXT, NO_ALTERNATIVE_TEXT, "The alternative offer expired."]) {
        const index = text.indexOf(marker)
        if (index !== -1) {
            text = text.slice(0, index)
        }
    }
    return text.trim()
}

// findCandidates => the active resources that have enough free seats for the WHOLE group.
// options: {date, startTime, endTime, groupSize, type, zone, excludeId, sameTypeOnly}
// Order: same type and same zone first, then same type, then the others.
// Inside each of these: most free seats first, then label A to Z.
// Both the offers and the /recommendations endpoint use this function, so the rule is written once.
// It returns a list like [{resource, free}]
const findCandidates = async (options) => {
    const groupSize = options.groupSize || 1
    const filter = {active: true, capacity: {$gte: groupSize}}
    if (options.excludeId) {
        filter._id = {$ne: options.excludeId}
    }
    if (options.sameTypeOnly && options.type) {
        filter.type = options.type
    }
    const resources = await Resource.find(filter)

    const candidates = []
    for (const resource of resources) {
        const used = await getSeatsUsed(resource._id, options.date, options.startTime, options.endTime)
        const free = resource.capacity - used
        if (free < groupSize) {
            continue
        }
        const typeMatch = !options.type || resource.type === options.type
        const zoneMatch = !!options.zone && resource.zone === options.zone
        let rank = 2
        if (typeMatch && zoneMatch) {
            rank = 0
        } else if (typeMatch) {
            rank = 1
        }
        candidates.push({resource, free, rank})
    }

    candidates.sort((a, b) => {
        if (a.rank !== b.rank) {
            return a.rank - b.rank
        }
        if (a.free !== b.free) {
            return b.free - a.free
        }
        return a.resource.label.localeCompare(b.resource.label)
    })
    return candidates.map(candidate => {
        return {resource: candidate.resource, free: candidate.free}
    })
}

// findAlternatives => at most ONE other resource of the same type that is free for the whole group
// at the same date and time. Same zone first, then the most free seats, then the label.
const findAlternatives = async (reservation, resource) => {
    const candidates = await findCandidates({
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        groupSize: reservation.groupSize || 1,
        type: resource.type,
        zone: resource.zone,
        excludeId: resource._id,
        sameTypeOnly: true
    })
    return candidates.slice(0, 1).map(candidate => candidate.resource)
}

// createOffer => the only place where offers are made. Works for an "unallocated" booking.
// Returns the booking with the new offer, or null when no offer was made (it has an offer already,
// the booking starts in less than 5 minutes, or nothing is free). The reason is always rebuilt.
const createOffer = async (reservation) => {
    if (reservation.status !== "unallocated") {
        return null
    }
    if (reservation.offer && reservation.offer.status) {
        return null // one offer per booking, whatever happened to it
    }

    // the requested resource (the booking may or may not have it populated)
    let resource = reservation.resource
    if (!resource || !resource.label) {
        resource = await Resource.findById(reservation.resource)
    }
    if (!resource) {
        return null
    }

    // a booking that starts in less than 5 minutes (or has started) gets no offer
    const start = toLibraryDate(reservation.date, reservation.startTime)
    const now = new Date()
    if (start.getTime() - now.getTime() < 5 * 60 * 1000) {
        return null
    }

    const base = cleanReason(reservation.reason)
    const alternatives = await findAlternatives(reservation, resource)
    if (alternatives.length === 0) {
        reservation.reason = (base + " " + NO_ALTERNATIVE_TEXT).trim()
        await reservation.save()
        return null
    }

    const alternative = alternatives[0]
    const closes = Math.min(now.getTime() + getOfferMinutes() * 60 * 1000, start.getTime())
    reservation.offer = {
        resource: alternative._id,
        status: "offered",
        expiresAt: new Date(closes),
        createdAt: now
    }
    const where = alternative.zone ? alternative.label + " (" + alternative.zone + ")" : alternative.label
    reservation.reason = (base + " " + OFFER_TEXT + where + " at the same time. You can accept it, reject it or join the waitlist.").trim()
    await reservation.save()
    return reservation
}

// expireOfferIfNeeded => closes an open offer when it is too old, or when the booking is no longer
// unallocated (for example an admin confirmed it). There is no background job, so this runs when
// the booking is read or when the offer is answered. Returns the booking.
const expireOfferIfNeeded = async (reservation) => {
    if (!reservation.offer || reservation.offer.status !== "offered") {
        return reservation
    }
    if (reservation.status !== "unallocated") {
        reservation.offer.status = "expired"
        await reservation.save()
    } else if (reservation.offer.expiresAt <= new Date()) {
        reservation.offer.status = "expired"
        reservation.reason = (cleanReason(reservation.reason) + " The alternative offer expired. You can join the waitlist or cancel.").trim()
        await reservation.save()
    }
    return reservation
}

module.exports = {findCandidates, findAlternatives, createOffer, expireOfferIfNeeded, cleanReason}
