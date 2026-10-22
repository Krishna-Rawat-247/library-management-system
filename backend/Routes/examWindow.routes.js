const express = require("express")
const {verifyToken, requireRole} = require("../middleware/auth")
const {getExamWindows, createExamWindow, deleteExamWindow} = require("../controllers/examWindowController")

const routes = express.Router()

routes.get("/", verifyToken, getExamWindows)
routes.post("/", verifyToken, requireRole("admin"), createExamWindow)
routes.delete("/:id", verifyToken, requireRole("admin"), deleteExamWindow)

module.exports = {routes}
