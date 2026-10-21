// notFound => any /api route that does not exist
const notFound = (req, res) => {
    res.status(404).send({message: "Route not found"})
}

// errorHandler => catches errors that were not handled in a controller
const errorHandler = (error, req, res, next) => {
    res.status(error.status || 500).send({message: error.message || "Something went wrong"})
}

module.exports = {notFound, errorHandler}
