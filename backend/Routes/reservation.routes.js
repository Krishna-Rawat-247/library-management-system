const express = require("express")
const {verifyToken} = require("../middleware/auth")
const {createReservation, getMyReservations, cancelReservation} = require("../controllers/reservationController")

const routes = express.Router()

routes.post("/", verifyToken, createReservation)
routes.get("/mine", verifyToken, getMyReservations)
routes.delete("/:id", verifyToken, cancelReservation)

module.exports = {routes}
