// demoApi.js => small helper for the demo data scripts (seedDemoUsers.js and seedDemoRequests.js).
// The scripts talk to the REAL API of a running server (start it with: npm run dev), like a user with a browser would.
// So every status in the demo data (confirmed, unallocated, offers, waitlist ...) comes from the real rules.
//
// The address of the server can be changed with DEMO_API, for example:
//   DEMO_API=http://localhost:3000/api node scripts/seedDemoUsers.js

const API = process.env.DEMO_API || "http://localhost:3000/api"

// everything the demo scripts create gets this text in legacyId, so removeDemoData.js can find it again
const DEMO_MARK = "demo-2026"

// callApi => sends one request and gives back {status, body}. token is optional
const callApi = async (method, path, token, body) => {
    const headers = {"Content-Type": "application/json"}
    if (token) {
        headers.Authorization = "Bearer " + token
    }
    const response = await fetch(API + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    })
    let data = null
    try {
        data = await response.json()
    } catch (error) {
        data = null // an answer without json
    }
    return {status: response.status, body: data}
}

// login => gives back the token of a user, or stops the script with a clear message
const login = async (email, password) => {
    const result = await callApi("POST", "/auth/login", null, {email, password})
    if (result.status !== 200) {
        throw new Error("Could not log in as " + email + " (" + result.status + "). Is the server running and is the user there?")
    }
    return result.body.token
}

// checkServer => stops the script early if the server is not running
const checkServer = async () => {
    try {
        const result = await callApi("GET", "/health")
        if (result.status !== 200) {
            throw new Error("health check answered " + result.status)
        }
    } catch (error) {
        throw new Error("The server does not answer at " + API + ". Start it first (npm run dev). " + error.message)
    }
}

module.exports = {API, DEMO_MARK, callApi, login, checkServer}
