const express = require("express")
const {verifyToken} = require("../middleware/auth")
const {acceptOffer, rejectOffer, joinWaitlist} = require("../controllers/offerController")

const routes = express.Router()

routes.post("/:id/offer/accept", verifyToken, acceptOffer)
routes.post("/:id/offer/reject", verifyToken, rejectOffer)
routes.post("/:id/waitlist", verifyToken, joinWaitlist)

module.exports = {routes}
