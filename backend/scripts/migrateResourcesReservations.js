const {Resource} = require("../models/resourceModel")
const {Reservation} = require("../models/reservationModel")

const ALLOWED_TYPES = ["study room", "discussion_room", "carrel", "computer station", "seminar hall", "community study hall", "reading pod"]
const STATUSES = ["confirmed", "cancelled", "no_show", "completed", "waiting", "bumped", "pending"]

// migrateResources => import resources. The old "available" flag becomes "active"
const migrateResources = async (oldData, maps, confirm, report) => {
    let created = 0
    let skipped = 0

    for (const old of oldData.resources) {
        const legacyId = String(old.id)

        if (!old.label || !old.type || !(Number(old.capacity) >= 1)) {
            report.push("resource " + legacyId + " has no label, type or a valid capacity, not imported")
            continue
        }
        if (!ALLOWED_TYPES.includes(old.type)) {
            report.push("resource " + legacyId + " has the type '" + old.type + "' which is not in the allowed list (kept as it is)")
        }

        const exists = await Resource.findOne({legacyId})
        if (exists) {
            maps.resources.set(legacyId, exists._id)
            skipped++
            continue
        }

        if (confirm) {
            const resource = await Resource.create({
                label: old.label,
                type: old.type,
                zone: old.zone,
                capacity: Number(old.capacity),
                active: old.available !== false,
                legacyId
            })
            maps.resources.set(legacyId, resource._id)
        } else {
            maps.resources.set(legacyId, "dry-run")
        }
        created++
    }

    const word = confirm ? "created" : "would be created"
    console.log("Resources: " + created + " " + word + ", " + skipped + " already there (skipped)")
}

// migrateReservations => import the old bookings as history.
// old userId and resourceId (numbers or text) are changed to the new ids with the maps
const migrateReservations = async (oldData, maps, confirm, report) => {
    let created = 0
    let skipped = 0

    for (const old of oldData.reservations) {
        const legacyId = String(old.id)

        const exists = await Reservation.findOne({legacyId})
        if (exists) {
            skipped++
            continue
        }

        const user = maps.users.get(String(old.userId))
        const resource = maps.resources.get(String(old.resourceId))
        if (!user || !resource) {
            report.push("reservation " + legacyId + " points to a user or resource that was not found, not imported")
            continue
        }
        if (!STATUSES.includes(old.status)) {
            report.push("reservation " + legacyId + " has an unknown status '" + old.status + "', not imported")
            continue
        }

        // odd records are only printed, never fixed silently
        const odd = [old.startTime, old.endTime].some(time => !/^\d{2}:(00|30)$/.test(String(time)))
        if (odd) {
            report.push("reservation " + legacyId + " has a time that is not on :00 or :30 (" + old.startTime + " - " + old.endTime + ")")
        }
        const oldResource = oldData.resources.find(r => String(r.id) === String(old.resourceId))
        if (old.status === "confirmed" && oldResource && oldResource.available === false) {
            report.push("reservation " + legacyId + " is confirmed on resource " + oldResource.id + " which is not available")
        }

        if (confirm) {
            await Reservation.create({
                user,
                resource,
                date: old.date,
                startTime: old.startTime,
                endTime: old.endTime,
                status: old.status,
                priorityScore: old.priorityScore || 0,
                checkedIn: old.checkedIn || false,
                createdAt: old.createdAt ? new Date(old.createdAt) : new Date(),
                legacyId
            })
        }
        created++
    }

    const word = confirm ? "created" : "would be created"
    console.log("Reservations: " + created + " " + word + ", " + skipped + " already there (skipped)")
}

// migrateResourcesReservations => resources first, because reservations need their new ids
const migrateResourcesReservations = async (oldData, maps, confirm, report) => {
    await migrateResources(oldData, maps, confirm, report)
    await migrateReservations(oldData, maps, confirm, report)
}

module.exports = {migrateResourcesReservations}
