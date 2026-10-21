// Stub controller. The owner of this file replaces each function with the real logic.

const signup = async (req, res) => {
    res.status(501).send({message: "signup not implemented yet"})
}

const login = async (req, res) => {
    res.status(501).send({message: "login not implemented yet"})
}

const getMe = async (req, res) => {
    res.status(501).send({message: "getMe not implemented yet"})
}

module.exports = {signup, login, getMe}
