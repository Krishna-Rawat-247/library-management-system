// layout.js => the seat map of a room (Phase 4).
// A seat map is a grid of rows x cols squares. The admin clicks the squares where a seat is.
// Rows and columns start at 0. Every seat gets a name: the row letter and the number of the seat in that row
// (an aisle, which is a square without a seat, is not counted). So the first row is A1, A2, A3 ...

const MAX_ROWS = 20
const MAX_COLS = 30

// buildLayout => checks the grid and the clicked squares, and builds the layout that is saved in the resource.
// cells looks like [{row: 0, col: 0}, {row: 0, col: 1}, ...]
// It returns {layout} when everything is fine, or {error} with a text for the admin
const buildLayout = (rows, cols, cells) => {
    if (!Number.isInteger(rows) || rows < 1 || rows > MAX_ROWS) {
        return {error: "Rows must be a whole number from 1 to " + MAX_ROWS}
    }
    if (!Number.isInteger(cols) || cols < 1 || cols > MAX_COLS) {
        return {error: "Columns must be a whole number from 1 to " + MAX_COLS}
    }
    if (!Array.isArray(cells) || cells.length === 0) {
        return {error: "A seat map needs at least one seat"}
    }

    // every square must be inside the grid and used only once
    const used = new Set()
    const seats = []
    for (const cell of cells) {
        if (!cell || !Number.isInteger(cell.row) || !Number.isInteger(cell.col)) {
            return {error: "Every seat needs a row and a column number"}
        }
        if (cell.row < 0 || cell.row >= rows || cell.col < 0 || cell.col >= cols) {
            return {error: "A seat is outside the grid"}
        }
        const key = cell.row + "," + cell.col
        if (used.has(key)) {
            return {error: "The same seat is listed twice"}
        }
        used.add(key)
        seats.push({row: cell.row, col: cell.col})
    }

    // order the seats row by row, left to right, then give every seat its name
    seats.sort((a, b) => {
        if (a.row !== b.row) {
            return a.row - b.row
        }
        return a.col - b.col
    })
    let numberInRow = 0
    let lastRow = -1
    for (const seat of seats) {
        if (seat.row !== lastRow) {
            numberInRow = 0
            lastRow = seat.row
        }
        numberInRow++
        seat.label = String.fromCharCode(65 + seat.row) + numberInRow
    }
    return {layout: {rows, cols, seats}}
}

// makeCells => every square of a grid as a list of cells, except the columns in skipCols (the aisles).
// Used by the seed scripts, so a whole room does not have to be clicked by hand
const makeCells = (rows, cols, skipCols) => {
    const skip = skipCols || []
    const cells = []
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!skip.includes(col)) {
                cells.push({row, col})
            }
        }
    }
    return cells
}

module.exports = {MAX_ROWS, MAX_COLS, buildLayout, makeCells}
