const {connection} = require("./config/db")
const {app} = require("./app")

// start the server, then wait for the database connection
const PORT = process.env.PORT || 3000
app.listen(PORT, async () => {
    try {
        await connection
        console.log("DB connected successfully")
        console.log("Server running on port " + PORT)
    } catch (error) {
        console.log(error)
    }
})
