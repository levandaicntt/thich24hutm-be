const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function runMigrations() {
  const dir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    console.log(`Running migration: ${file}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`  -> done`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

runMigrations()
  .then(() => {
    console.log('All migrations applied.');
    return pool.end();
  })
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });
