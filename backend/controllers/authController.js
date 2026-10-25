const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const {User} = require("../models/userModel")
const {userData} = require("../utils/userData")
const {getPriorityBreakdown} = require("../utils/priority")

// makeToken => JWT with only {id, role}. Suspension is checked from the database, not from the token
const makeToken = (user) => {
    return jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "1d"})
}

// signup => check the details, hash the password and create a new student
const signup = async (req, res) => {
    try {
        const {name, studentId, email, password, department, course, semester} = req.body
        if (!name || !email || !password) {
            return res.status(400).send({message: "Name, email and password are required"})
        }
        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
            return res.status(400).send({message: "Name, email and password must be text"})
        }
        if (!email.includes("@")) {
            return res.status(400).send({message: "Invalid email"})
        }
        if (password.length < 8) {
            return res.status(400).send({message: "Password must be at least 8 characters"})
        }
        if (semester !== undefined && (isNaN(semester) || Number(semester) < 1)) {
            return res.status(400).send({message: "Invalid semester"})
        }

        const oldUser = await User.findOne({email: email.trim().toLowerCase()})
        if (oldUser) {
            return res.status(409).send({message: "Email already registered"})
        }

        // the role is always "student". We never take the role from the request body
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({
            name,
            studentId,
            email,
            password: hashedPassword,
            role: "student",
            department,
            course,
            semester
        })
        res.status(201).send({
            message: "Account created successfully",
            token: makeToken(user),
            user: userData(user)
        })
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// login => check email and password, then give back a JWT
const login = async (req, res) => {
    try {
        const {email, password} = req.body
        if (!email || !password) {
            return res.status(400).send({message: "Email and password are required"})
        }
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).send({message: "Email and password must be text"})
        }
        const user = await User.findOne({email: email.trim().toLowerCase()}).select("+password")
        if (!user) {
            return res.status(401).send({message: "Invalid email or password"})
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).send({message: "Invalid email or password"})
        }
        res.status(200).send({
            message: "Login successful",
            token: makeToken(user),
            user: userData(user)
        })
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// getMe => send the logged in user's fresh data from the database
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user) {
            return res.status(404).send({message: "User not found"})
        }
        // priority is what the allocation uses to order requests (calculated by the server)
        const priority = await getPriorityBreakdown(user)
        res.status(200).send({message: "User fetched successfully", data: {...userData(user), priority}})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

module.exports = {signup, login, getMe}
