const express = require("express")
const {verifyToken, requireRole} = require("../middleware/auth")
const {getResources, getAvailability, getResourceById, createResource, updateResource, deleteResource} = require("../controllers/resourceController")

const routes = express.Router()

routes.get("/", verifyToken, getResources)
routes.get("/:id/availability", verifyToken, getAvailability)
routes.get("/:id", verifyToken, getResourceById)
routes.post("/", verifyToken, requireRole("admin"), createResource)
routes.patch("/:id", verifyToken, requireRole("admin"), updateResource)
routes.delete("/:id", verifyToken, requireRole("admin"), deleteResource)

module.exports = {routes}
