const express = require("express")
const {verifyToken, requireRole} = require("../middleware/auth")
const {runAllocation, getAllocationRuns} = require("../controllers/adminAllocationController")

const routes = express.Router()

routes.post("/allocate", verifyToken, requireRole("admin"), runAllocation)
routes.get("/allocation-runs", verifyToken, requireRole("admin"), getAllocationRuns)

module.exports = {routes}
