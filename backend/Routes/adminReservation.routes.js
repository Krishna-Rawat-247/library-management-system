const express = require("express")
const {verifyToken, requireRole} = require("../middleware/auth")
const {getAllReservations, confirmReservation, adminCancelReservation, markNoShow, deleteReservation} = require("../controllers/adminReservationController")

const routes = express.Router()

routes.get("/", verifyToken, requireRole("admin"), getAllReservations)
routes.post("/:id/confirm", verifyToken, requireRole("admin"), confirmReservation)
routes.post("/:id/cancel", verifyToken, requireRole("admin"), adminCancelReservation)
routes.post("/:id/no-show", verifyToken, requireRole("admin"), markNoShow)
routes.delete("/:id", verifyToken, requireRole("admin"), deleteReservation)

module.exports = {routes}
