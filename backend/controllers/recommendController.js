const {findCandidates} = require("../utils/alternatives")
const {getToday, isSlotAligned} = require("../utils/timeCheck")

// getRecommendations => the active resources that have enough free seats for the whole group at a time.
// Query: date, startTime, endTime (required), groupSize (default 1), type and zone (optional, used for the order).
// Same type and zone first, then the same type, then the others. Each part: most free seats first, then label.
// It uses the same rule as the alternative offers (findCandidates). Nothing is held for the student.
const getRecommendations = async (req, res) => {
    try {
        const {date, startTime, endTime, type, zone} = req.query
        if (!date || !startTime || !endTime) {
            return res.status(400).send({message: "date, startTime and endTime are required"})
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
            return res.status(400).send({message: "Date must be YYYY-MM-DD and times must be HH:MM"})
        }
        if (!isSlotAligned(startTime) || !isSlotAligned(endTime)) {
            return res.status(400).send({message: "Times must be on the hour or half hour, like 10:00 or 10:30"})
        }
        if (startTime >= endTime) {
            return res.status(400).send({message: "End time must be after start time"})
        }
        if (date < getToday()) {
            return res.status(400).send({message: "Cannot look at a time in the past"})
        }
        let groupSize = 1
        if (req.query.groupSize !== undefined) {
            groupSize = Number(req.query.groupSize)
            if (!Number.isInteger(groupSize) || groupSize < 1) {
                return res.status(400).send({message: "groupSize must be a whole number of 1 or more"})
            }
        }

        const candidates = await findCandidates({date, startTime, endTime, groupSize, type, zone})
        const data = candidates.map(candidate => {
            return {
                id: candidate.resource._id,
                label: candidate.resource.label,
                type: candidate.resource.type,
                zone: candidate.resource.zone,
                capacity: candidate.resource.capacity,
                freeSeats: candidate.free,
                sameType: !type || candidate.resource.type === type,
                sameZone: !!zone && candidate.resource.zone === zone
            }
        })
        res.status(200).send({message: "Recommendations fetched successfully", data})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

module.exports = {getRecommendations}
