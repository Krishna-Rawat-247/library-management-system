const express = require("express")
const {verifyToken, requireRole} = require("../middleware/auth")
const {sendMessage, getMessages, updateMessage, deleteMessage} = require("../controllers/messageController")

const routes = express.Router()

routes.post("/", verifyToken, sendMessage)
routes.get("/", verifyToken, getMessages)
routes.patch("/:id", verifyToken, requireRole("admin"), updateMessage)
routes.delete("/:id", verifyToken, requireRole("admin"), deleteMessage)

module.exports = {routes}
