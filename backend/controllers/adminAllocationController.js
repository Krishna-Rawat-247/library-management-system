// Stub controller. Phase 2 owner (Lovish) replaces each function with the real logic.

const runAllocation = async (req, res) => {
    res.status(501).send({message: "runAllocation not implemented yet"})
}

const getAllocationRuns = async (req, res) => {
    res.status(501).send({message: "getAllocationRuns not implemented yet"})
}

module.exports = {runAllocation, getAllocationRuns}
