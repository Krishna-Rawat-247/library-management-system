document.addEventListener("DOMContentLoaded", () => {
    function getAuthState() {
        let currentUser = null;
        try {
            currentUser = JSON.parse(localStorage.getItem("currentUser"));
        } catch (e) {
            currentUser = null;
        }
        let hasLoggedOut = localStorage.getItem("hasLoggedOut") === "true";
        return { currentUser, hasLoggedOut };
    }

    function renderHeader() {
        let { currentUser, hasLoggedOut } = getAuthState();

        // 1. Admin link handling in navbar
        let navLoginBtn = document.getElementById("navLoginBtn");
        let navSignupBtn = document.getElementById("navSignupBtn");
        let navAdminBtn = document.getElementById("navAdminBtn");

        if (currentUser) {
            if (navLoginBtn) navLoginBtn.style.display = "none";
            if (navSignupBtn) navSignupBtn.style.display = "none";
            if (navAdminBtn) {
                navAdminBtn.style.display = (currentUser.role === "admin") ? "inline-block" : "none";
            }
        } else {
            if (navAdminBtn) navAdminBtn.style.display = "none";
        }

        // 2. Standout Header Action / Auth Profile Pill handling (.header__actions)
        let headerActions = document.querySelector(".header__actions");
        if (headerActions) {
            if (currentUser) {
                let initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U";
                let role = currentUser.role ? currentUser.role.toUpperCase() : "STUDENT";
                let strikes = currentUser.noShowCount;
                if (!strikes) {
                    strikes = 0;
                }
                
                let reliabilityScore = 100 - (strikes * 15);
                if (reliabilityScore < 0) {
                    reliabilityScore = 0;
                }
                
                let score = reliabilityScore + " pts";

                headerActions.innerHTML = `
                    <div class="user-pill-display" title="Signed in user">
                        <div class="user-pill-avatar" id="avatarLetter">${initial}</div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 11px; font-weight: 700; color: var(--text-cream, #f1e6d1); text-transform: uppercase;" id="userNameDisplay">${currentUser.name}</span>
                            <span class="user-pill-score" id="headerScore">${score} • ${role}</span>
                        </div>
                    </div>
                    <button id="headerLogoutBtn" class="btn-logout" title="Log Out" aria-label="Log Out">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>LOG OUT</span>
                    </button>
                    <a href="about.html" class="btn-signup-standout" style="text-decoration: none; margin-left: 8px;">ABOUT US</a>
                `;

                let logoutBtn = document.getElementById("headerLogoutBtn");
                if (logoutBtn) {
                    logoutBtn.addEventListener("click", performLogout);
                }
            } else if (hasLoggedOut) {
                // User logged out (returning user) -> Show ONLY LOG IN button
                headerActions.innerHTML = `
                    <a href="login.html" class="btn-login-standout" style="text-decoration: none;">LOG IN</a>
                    <a href="about.html" class="btn-signup-standout" style="text-decoration: none; margin-left: 8px;">ABOUT US</a>
                `;
            } else {
                // New user / First time visitor -> Show LOG IN & SIGN UP & ABOUT US buttons
                headerActions.innerHTML = `
                    <a href="login.html" class="btn-login-standout" style="text-decoration: none;">LOG IN</a>
                    <a href="sign_up.html" class="btn-signup-standout" style="text-decoration: none; margin-left: 8px;">SIGN UP</a>
                    <a href="about.html" class="btn-login-standout" style="text-decoration: none; margin-left: 8px;">ABOUT US</a>
                `;
            }
        }

        // 3. Handle nav-buttons in login/signup page headers
        let navButtons = document.querySelector(".nav-buttons");
        if (navButtons) {
            let currentPage = window.location.pathname.split("/").pop();

            if (currentUser) {
                let initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U";
                navButtons.innerHTML = `
                    <div class="user-pill-display" title="Signed in user">
                        <div class="user-pill-avatar">${initial}</div>
                        <span style="font-size: 11px; font-weight: 700; color: var(--text-cream, #f1e6d1); text-transform: uppercase;">${currentUser.name}</span>
                    </div>
                    <button id="navButtonsLogoutBtn" class="btn-logout" title="Log Out">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>LOG OUT</span>
                    </button>
                    <a href="about.html" class="signup-nav" style="margin-left: 8px;">ABOUT US</a>
                `;
                let navLogoutBtn = document.getElementById("navButtonsLogoutBtn");
                if (navLogoutBtn) {
                    navLogoutBtn.addEventListener("click", performLogout);
                }
            } else {
                if (currentPage === "login.html") {
                    navButtons.innerHTML = `
                        <a href="sign_up.html" class="signup-nav">SIGN UP</a>
                        <div class="nav-profile">☺</div>
                    `;
                } else if (currentPage === "sign_up.html") {
                    navButtons.innerHTML = `
                        <a href="login.html" class="btn-login-standout">LOG IN</a>
                        <div class="nav-profile">☺</div>
                    `;
                } else if (hasLoggedOut) {
                    navButtons.innerHTML = `
                        <a href="login.html" class="btn-login-standout">LOG IN</a>
                        <div class="nav-profile">☺</div>
                    `;
                } else {
                    navButtons.innerHTML = `
                        <a href="login.html" class="btn-login-standout">LOG IN</a>
                        <a href="sign_up.html" class="signup-nav">SIGN UP</a>
                        <div class="nav-profile">☺</div>
                    `;
                }
            }
        }
    }

    function performLogout() {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("token");
        localStorage.setItem("hasLoggedOut", "true");
        alert("Logged out successfully");

        let page = window.location.pathname.split("/").pop();
        if (page === "profile.html" || page === "myBooking.html" || page === "admin.html") {
            window.location.href = "index.html";
        } else {
            renderHeader();
        }
    }

    renderHeader();

    // 4. Auxiliary CTA click handlers
    let loginBtn = document.querySelector(".nav__auth-link");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }

    let signupBtn = document.getElementById("btnSignUp");
    if (signupBtn) {
        signupBtn.addEventListener("click", () => {
            window.location.href = "sign_up.html";
        });
    }

    let findSpaceBtn = document.getElementById("heroCta");
    if (findSpaceBtn) {
        findSpaceBtn.addEventListener("click", () => {
            window.location.href = "myBooking.html";
        });
    }

    let myBookingBtn = document.getElementById("myBookingBtn");
    if (myBookingBtn) {
        myBookingBtn.addEventListener("click", () => {
            window.location.href = "myBooking.html";
        });
    }

    async function loadLatestBookingForHero() {
        let heroSearchBox = document.querySelector(".hero-search-box");
        if (!heroSearchBox) return;

        let currentUser = null;
        try {
            currentUser = JSON.parse(localStorage.getItem("currentUser"));
        } catch (e) {}

        function showNoActiveReservation() {
            heroSearchBox.style.gridTemplateColumns = "1fr";
            heroSearchBox.innerHTML = `
                <div style="text-align: center; font-size: 13px; font-weight: 700; color: var(--gold, #e8c382); letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 0;">
                    No Active Reservation
                </div>
            `;
        }

        if (!currentUser) {
            showNoActiveReservation();
            return;
        }

        // api.js must be loaded on this page (index.html) for the request below
        if (typeof apiGet !== "function") {
            showNoActiveReservation();
            return;
        }

        try {
            // our own bookings, the resource details come inside each booking
            let result = await apiGet("/reservations/mine");
            let userReservations = result.data;

            let now = new Date();
            let todayStr = now.toISOString().split("T")[0];
            let currentHours = String(now.getHours()).padStart(2, "0");
            let currentMins = String(now.getMinutes()).padStart(2, "0");
            let currentTimeStr = `${currentHours}:${currentMins}`;

            let activeBookings = userReservations.filter(r => {
                let status = String(r.status || "").toLowerCase();
                if (status === "cancelled" || status === "completed" || status === "no_show") {
                    return false;
                }

                if (!r.date) return false;

                if (r.date > todayStr) {
                    return true;
                }
                if (r.date === todayStr) {
                    return !r.endTime || r.endTime >= currentTimeStr;
                }
                return false;
            });

            if (activeBookings.length === 0) {
                showNoActiveReservation();
                return;
            }

            activeBookings.sort((a, b) => {
                let dateA = `${a.date}T${a.startTime || '00:00'}`;
                let dateB = `${b.date}T${b.startTime || '00:00'}`;
                return new Date(dateA) - new Date(dateB);
            });

            let latest = activeBookings[0];

            let roomName = latest.resource ? latest.resource.label : "Room";
            let timeSlot = `${latest.startTime || ''} — ${latest.endTime || ''} (${latest.date || ''})`.trim();

            heroSearchBox.style.gridTemplateColumns = "1fr 1fr auto";
            heroSearchBox.innerHTML = `
                <div>
                    <span class="search-field-label">Target Wing</span>
                    <div class="search-info-box" id="heroSpaceSelect">${roomName}</div>
                </div>
                <div>
                    <span class="search-field-label">Time Window</span>
                    <div class="search-info-box" id="heroTimeSelect">${timeSlot}</div>
                </div>
                <a href="myBooking.html" class="hero-arrow-btn" id="heroCta" title="View My Bookings" aria-label="View My Bookings" style="text-decoration: none;">
                    →
                </a>
            `;
        } catch (err) {
            console.error("Error loading hero latest booking:", err);
            showNoActiveReservation();
        }
    }

    loadLatestBookingForHero();
});