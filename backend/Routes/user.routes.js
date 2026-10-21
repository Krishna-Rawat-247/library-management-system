const express = require("express")
const {verifyToken} = require("../middleware/auth")
const {updateMe} = require("../controllers/userController")

const routes = express.Router()

routes.patch("/me", verifyToken, updateMe)

module.exports = {routes}
