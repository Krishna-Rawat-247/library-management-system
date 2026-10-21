const mongoose = require("mongoose")
require("dotenv").config()

// connection is a promise. server.js waits for it before saying "DB connected"
const connection = mongoose.connect(process.env.MONGODB_URI)

module.exports = {connection}
