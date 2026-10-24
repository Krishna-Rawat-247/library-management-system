const mongoose = require("mongoose")
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

// createExamWindow => admin adds an exam period. The title is made from the dates if it is empty
const createExamWindow = async (req, res) => {
    try {
        const {title, startDate, endDate} = req.body
        if (!startDate || !endDate) {
            return res.status(400).send({message: "startDate and endDate are required"})
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
            return res.status(400).send({message: "Dates must be like 2026-10-25"})
        }
        if (startDate > endDate) {
            return res.status(400).send({message: "Start date must be before the end date"})
        }
        const examWindow = await ExamWindow.create({
            title: title || "Exam Window " + startDate + " to " + endDate,
            startDate,
            endDate
        })
        res.status(201).send({message: "Exam window created successfully", data: examData(examWindow)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

// deleteExamWindow => admin removes an exam period
const deleteExamWindow = async (req, res) => {
    try {
        const id = req.params.id
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({message: "Invalid exam window id"})
        }
        const examWindow = await ExamWindow.findByIdAndDelete(id)
        if (!examWindow) {
            return res.status(404).send({message: "Exam window not found"})
        }
        res.status(200).send({message: "Exam window deleted successfully", data: examData(examWindow)})
    } catch (error) {
        res.status(500).send({message: error.message})
    }
}

module.exports = {getExamWindows, createExamWindow, deleteExamWindow}
