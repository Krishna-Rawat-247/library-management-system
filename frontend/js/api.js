// api.js => small helper used by every page to talk to the backend.
// Load it before the page's own script: <script src="js/api.js"></script>

// the frontend is served by Express, so a relative path is enough
const API_BASE = "/api";

// request => adds the token, sends the request and returns the json answer
async function request(path, options = {}) {
    let token = localStorage.getItem("token");

    let headers = { "Content-Type": "application/json" };
    if (token) {
        headers["Authorization"] = "Bearer " + token;
    }

    let response = await fetch(API_BASE + path, { ...options, headers });

    let data = {};
    try {
        data = await response.json();
    } catch (e) {
        data = {};
    }

    // token expired or not valid -> logout and go to login page
    // (a wrong password on the login page has no token, so it does not come here)
    if (response.status === 401 && token) {
        localStorage.removeItem("token");
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }
    return data;
}

function apiGet(path) {
    return request(path);
}

function apiPost(path, body) {
    return request(path, { method: "POST", body: JSON.stringify(body) });
}

function apiPatch(path, body) {
    return request(path, { method: "PATCH", body: JSON.stringify(body) });
}

function apiDelete(path) {
    return request(path, { method: "DELETE" });
}
