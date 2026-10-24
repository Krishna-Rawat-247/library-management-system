// migrateLegacy.js => copy the old db.json data into MongoDB
//
// node scripts/migrateLegacy.js             => dry run, only prints what it would do
// node scripts/migrateLegacy.js --confirm   => really writes to MongoDB
//
// It is safe to run again. Records that already exist (same legacyId or email) are skipped.
//
// The three migrate files get the same 4 things:
//   oldData => everything read from db.json
//   maps    => {users, resources} Maps of old id (as text) -> new MongoDB _id. Each file fills its own map
//   confirm => true means really write. false means only count and print (do not write anything)
//   report  => an array. Push a text line for every odd record, the runner prints them at the end
// In a dry run, put the text "dry-run" in the map instead of an _id, so the later files can still check references.
const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")
const {connection} = require("../config/db")
const {migrateUsers} = require("./migrateUsers")
const {migrateResourcesReservations} = require("./migrateResourcesReservations")
const {migrateExamMessages} = require("./migrateExamMessages")

const run = async () => {
    try {
        const confirm = process.argv.includes("--confirm")
        if (!confirm) {
            console.log("DRY RUN: nothing will be written. Add --confirm to really migrate.")
        }

        // read the old database file
        const filePath = path.join(__dirname, "..", "..", "db.json")
        const oldData = JSON.parse(fs.readFileSync(filePath, "utf-8"))

        await connection
        console.log("DB connected successfully")

        const maps = {users: new Map(), resources: new Map()}
        const report = []

        await migrateUsers(oldData, maps, confirm, report)
        await migrateResourcesReservations(oldData, maps, confirm, report)
        await migrateExamMessages(oldData, maps, confirm, report)

        console.log("\nReport of odd records (" + report.length + "):")
        report.forEach(line => console.log(" - " + line))
        console.log(confirm ? "\nMigration finished." : "\nDry run finished. Nothing was written.")
    } catch (error) {
        console.log("Migration failed: " + error.message)
    } finally {
        await mongoose.connection.close()
    }
}

run()
