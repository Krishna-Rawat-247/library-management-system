const {ExamWindow} = require("../models/examWindowModel")

// examData => the exam window object we send (the old pages use "id")
const examData = (examWindow) => {
    return {
        id: examWindow._id,
        title: examWindow.title,
        startDate: examWindow.startDate,
        endDate: examWindow.endDate
    }
}

// getExamWindows => every logged in user can see the exam windows, earliest first
const getExamWindows = async (req, res) => {
    try {
        const windows = await ExamWindow.find().sort({startDate: 1})
        const data = windows.map(examWindow => examData(examWindow))
        res.status(200).send({message: "Exam windows fetched successfully", data})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// createExamWindow => not written yet
const createExamWindow = async (req, res) => {
    res.status(501).send({message: "createExamWindow not implemented yet"})
}

// deleteExamWindow => not written yet
const deleteExamWindow = async (req, res) => {
    res.status(501).send({message: "deleteExamWindow not implemented yet"})
}

module.exports = {getExamWindows, createExamWindow, deleteExamWindow}
