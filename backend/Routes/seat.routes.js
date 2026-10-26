const express = require("express")
const {verifyToken} = require("../middleware/auth")
const {getSeatMap} = require("../controllers/seatController")

const routes = express.Router()

routes.get("/:id/seats", verifyToken, getSeatMap)

module.exports = {routes}
