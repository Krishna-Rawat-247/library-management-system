const express = require("express")
const {verifyToken} = require("../middleware/auth")
const {signup, login, getMe} = require("../controllers/authController")

const routes = express.Router()

routes.post("/signup", signup)
routes.post("/login", login)
routes.get("/me", verifyToken, getMe)

module.exports = {routes}
