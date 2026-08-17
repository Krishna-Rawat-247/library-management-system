/**
 * adminNav.js
 * -----------------------------------------------------------------
 * Pure navigation plumbing — switches which <section class="view">
 * is visible when a tab button is clicked. Same pattern as the tab
 * switching in index.html/main.js. Nothing feature-specific here;
 * you shouldn't need to touch this file.
 * -----------------------------------------------------------------
 */

const VIEW_NAMES = ["dashboard", "reservations", "resources", "users", "settings"];
const DEFAULT_VIEW = "dashboard";

function showAdminView(name) {
  VIEW_NAMES.forEach((v) => {
    const section = document.getElementById(`view-${v}`);
    if (section) section.hidden = v !== name;
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });

  // Let feature scripts know a tab just became visible, in case
  // they want to re-render fresh data (e.g. dashboard stats going
  // stale while you were on another tab). Optional to listen for.
  document.dispatchEvent(new CustomEvent("adminview:shown", { detail: { view: name } }));
}

document.getElementById("adminTabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  showAdminView(btn.dataset.view);
});

showAdminView(DEFAULT_VIEW);