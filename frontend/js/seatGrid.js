// seatGrid.js => draws a seat map as a grid of small squares (Phase 4).
// It is used by two pages: the admin draws the map of a room, and the student picks seats on the booking page.
// Load it with <script src="js/seatGrid.js"></script> and link css/seats.css.

// drawSeatGrid => fills the container with rows x cols squares.
//   getCell(row, col) must give back an object {state, label}.
//   state is "empty" (no seat there), "free" (a seat), "taken" (a seat somebody has) or "chosen" (a seat that is selected)
//   onCellClick(row, col) is called when a square is clicked. A "taken" square cannot be clicked.
function drawSeatGrid(container, rows, cols, getCell, onCellClick) {
  container.innerHTML = "";
  container.className = "seat-grid";
  container.style.gridTemplateColumns = "repeat(" + cols + ", 36px)";

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let cell = getCell(row, col);

      let square = document.createElement("button");
      square.type = "button";
      square.className = "seat seat-" + cell.state;
      square.innerText = cell.label || "";
      if (cell.state === "taken") {
        square.disabled = true;
        square.title = cell.label + " is taken";
      } else if (cell.label) {
        square.title = cell.label;
      }

      // the row and col are given to the function that was passed in
      square.addEventListener("click", function () {
        onCellClick(row, col);
      });
      container.appendChild(square);
    }
  }
}
