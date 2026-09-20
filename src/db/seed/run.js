const fs = require("fs");
const path = require("path");
const pool = require("../pool");

const seedFile = path.join(__dirname, "pharmacy_locations.seed.sql");

async function runSeed() {
  const sql = fs.readFileSync(seedFile, "utf8");
  console.log(`Running seed: ${seedFile}`);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("  -> done");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

runSeed()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });