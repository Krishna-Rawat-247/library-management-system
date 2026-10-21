const jwt = require("jsonwebtoken")

// verifyToken => read "Authorization: Bearer <token>" and put {id, role} in req.user
const verifyToken = (req, res, next) => {
    try {
        const header = req.headers.authorization
        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).send({message: "Please login first"})
        }
        const token = header.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = {id: decoded.id, role: decoded.role}
        next()
    } catch (error) {
        res.status(401).send({message: "Invalid or expired token"})
    }
}

// requireRole("admin") => only users with one of these roles can go ahead
// use it after verifyToken
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).send({message: "You are not allowed to do this"})
        }
        next()
    }
}

module.exports = {verifyToken, requireRole}
