const express = require("express")
const path = require("path")
const {notFound, errorHandler} = require("./middleware/errorHandler")

const {routes: authRoutes} = require("./Routes/auth.routes")
const {routes: userRoutes} = require("./Routes/user.routes")
const {routes: adminUserRoutes} = require("./Routes/adminUser.routes")
const {routes: resourceRoutes} = require("./Routes/resource.routes")
const {routes: offerRoutes} = require("./Routes/offer.routes")
const {routes: reservationRoutes} = require("./Routes/reservation.routes")
const {routes: adminReservationRoutes} = require("./Routes/adminReservation.routes")
const {routes: adminAllocationRoutes} = require("./Routes/adminAllocation.routes")
const {routes: examWindowRoutes} = require("./Routes/examWindow.routes")
const {routes: messageRoutes} = require("./Routes/message.routes")

const app = express()
app.use(express.json()) // we are sending json data from client

// simple route to check that the server is running
app.get("/api/health", (req, res) => {
    res.status(200).send({message: "Atlas Room API is running"})
})

// every route file is mounted here once. Nobody needs to edit this file again
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/admin/users", adminUserRoutes)
app.use("/api/resources", resourceRoutes)
app.use("/api/reservations", offerRoutes) // offer and waitlist routes first, then the general reservation routes
app.use("/api/reservations", reservationRoutes)
app.use("/api/admin/reservations", adminReservationRoutes)
app.use("/api/admin", adminAllocationRoutes)
app.use("/api/exam-windows", examWindowRoutes)
app.use("/api/messages", messageRoutes)

// the frontend folder is served as static files (http://localhost:3000/index.html)
app.use(express.static(path.join(__dirname, "..", "frontend")))

// these two must stay last
app.use("/api", notFound)
app.use(errorHandler)

module.exports = {app}
