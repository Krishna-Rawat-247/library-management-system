const express = require("express")
const {verifyToken, requireRole} = require("../middleware/auth")
const {getAllUsers, changeRole, suspendUser, unsuspendUser} = require("../controllers/adminUserController")

const routes = express.Router()

routes.get("/", verifyToken, requireRole("admin"), getAllUsers)
routes.patch("/:id", verifyToken, requireRole("admin"), changeRole)
routes.post("/:id/suspend", verifyToken, requireRole("admin"), suspendUser)
routes.post("/:id/unsuspend", verifyToken, requireRole("admin"), unsuspendUser)

module.exports = {routes}
