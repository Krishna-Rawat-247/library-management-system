const mongoose = require("mongoose")

// User table. Field names follow the old db.json users
const userSchema = mongoose.Schema({
    name: {type: String, required: true, trim: true},
    studentId: {type: String, trim: true},
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    password: {type: String, required: true, select: false}, // bcrypt hash only
    role: {type: String, enum: ["student", "faculty", "librarian", "admin"], default: "student"},
    department: {type: String, trim: true},
    course: {type: String, trim: true},
    semester: {type: Number, min: 1},
    noShowCount: {type: Number, default: 0, min: 0},
    suspended: {type: Boolean, default: false},
    suspendedUntil: {type: Date, default: null}, // null + suspended true means indefinite
    suspendReason: {type: String, default: null},
    legacyId: {type: String}, // id from the old db.json
    createdAt: {type: Date, default: Date.now}
})

// never send the password hash in any response
userSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.password
        return ret
    }
})

const User = mongoose.model("User", userSchema)

module.exports = {User}
