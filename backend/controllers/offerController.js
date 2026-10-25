// Stub controller. Phase 3 owner (Lovish) replaces each function with the real logic.

const acceptOffer = async (req, res) => {
    res.status(501).send({message: "acceptOffer not implemented yet"})
}

const rejectOffer = async (req, res) => {
    res.status(501).send({message: "rejectOffer not implemented yet"})
}

const joinWaitlist = async (req, res) => {
    res.status(501).send({message: "joinWaitlist not implemented yet"})
}

module.exports = {acceptOffer, rejectOffer, joinWaitlist}
