const mongoose = require("mongoose")

// Exam window table. The old db.json used "title", so we keep it
const examWindowSchema = mongoose.Schema({
    title: {type: String, required: true, trim: true},
    startDate: {type: String, required: true},
    endDate: {type: String, required: true},
    legacyId: {type: String}
})

const ExamWindow = mongoose.model("ExamWindow", examWindowSchema)

module.exports = {ExamWindow}
