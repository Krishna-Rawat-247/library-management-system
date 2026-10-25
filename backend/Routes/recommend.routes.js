const express = require("express")
const {verifyToken} = require("../middleware/auth")
const {getRecommendations} = require("../controllers/recommendController")

const routes = express.Router()

routes.get("/", verifyToken, getRecommendations)

module.exports = {routes}
