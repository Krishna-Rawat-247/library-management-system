// Prints a test JWT so Postman can be used before login is built.
// usage: node scripts/makeToken.js admin
//        node scripts/makeToken.js student 64b000000000000000000001
const jwt = require("jsonwebtoken")
require("dotenv").config()

const role = process.argv[2] || "student"
const id = process.argv[3] || "64b000000000000000000001" // fake id if none is given

if (!process.env.JWT_SECRET) {
    console.log("JWT_SECRET is missing in .env")
    process.exit(1)
}

const token = jwt.sign({id, role}, process.env.JWT_SECRET, {expiresIn: "1d"})
console.log(token)
