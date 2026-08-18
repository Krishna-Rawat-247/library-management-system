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
        window.location.href = "booking.html";
    });
}

let myBookingBtn = document.getElementById("myBookingBtn");

if (myBookingBtn) {
    myBookingBtn.addEventListener("click", () => {
        window.location.href = "myBooking.html";
    });
}