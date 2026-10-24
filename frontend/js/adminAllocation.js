// adminAllocation.js => the Allocation tab of the admin panel (Phase 2).
// The admin picks a date and runs the allocation. The server ranks the requests of that date
// (purpose first, then score) and allocates them. This file only shows what the server answers.
// It needs js/api.js and the section #allocationRoot of admin.html.

let PURPOSE_LABELS = {
  job_interview: "Job interview",
  end_semester_exam: "End semester exam",
  mid_semester_exam: "Mid semester exam",
  quarterly_test: "Quarterly test",
  project_work: "Project work",
  general_study: "General study"
};

// ---- the page (form, summary, tables) ----

function buildAllocationPage() {
  let root = document.getElementById("allocationRoot");
  if (!root) return;

  root.innerHTML = `
    <form id="allocationForm" class="inline-form">
      <label>
        Booking date
        <input type="date" id="allocationDate" required>
      </label>
      <button type="submit" id="allocationRunBtn">Run allocation</button>
    </form>

    <p class="hint" id="allocationSummary"></p>

    <!-- decisions -->
    <table class="admin-table" id="allocationDecisionsTable" hidden>
      <thead>
        <tr>
          <th>Student</th>
          <th>Resource</th>
          <th>Time</th>
          <th>Purpose</th>
          <th>Group</th>
          <th>Tier</th>
          <th>Score</th>
          <th>Result</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody id="allocationDecisionsBody"></tbody>
    </table>
    <!-- /decisions -->

  `;
}

// puts a list of texts in a table row
function addAllocationRow(tbody, values) {
  let row = document.createElement("tr");
  values.forEach((value) => {
    let td = document.createElement("td");
    td.innerText = value;
    row.appendChild(td);
  });
  tbody.appendChild(row);
}

// ---- the result of a run ----

function showAllocationSummary(run) {
  document.getElementById("allocationSummary").innerText =
    "Allocation for " + run.date + ": " + run.considered + " request(s) considered, " +
    run.confirmed + " newly confirmed, " + run.unallocated + " unallocated.";
}

// ---- decisions table ----

function showAllocationDecisions(decisions) {
  let table = document.getElementById("allocationDecisionsTable");
  let tbody = document.getElementById("allocationDecisionsBody");
  tbody.innerHTML = "";
  table.hidden = decisions.length === 0;

  decisions.forEach((d) => {
    addAllocationRow(tbody, [
      d.user,
      d.resource,
      d.startTime + " - " + d.endTime,
      PURPOSE_LABELS[d.purpose] || d.purpose,
      d.groupSize,
      d.tier,
      d.score,
      d.status,
      d.reason || ""
    ]);
  });
}

// ---- run button ----

async function runAllocationForDate(date) {
  let button = document.getElementById("allocationRunBtn");
  button.disabled = true;

  try {
    let result = await apiPost("/admin/allocate", { date: date });
    showAllocationSummary(result.data.run);
    showAllocationDecisions(result.data.decisions);
  } catch (error) {
    alert(error.message);
  }

  button.disabled = false;
}

function wireAllocationForm() {
  document.getElementById("allocationForm").addEventListener("submit", function (e) {
    e.preventDefault();
    let date = document.getElementById("allocationDate").value;
    if (!date) {
      alert("Pick a booking date first.");
      return;
    }
    runAllocationForDate(date);
  });
}

buildAllocationPage();
wireAllocationForm();
