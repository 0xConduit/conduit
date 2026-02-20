import { getDb } from "./src/db/connection.ts";

const db = getDb();
const now = Date.now();
db.prepare(
  "INSERT INTO agents (id, role, capabilities, attestation_score, settlement_balance, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'idle', ?, ?)"
).run("debug-agent", "executor", '["debugging"]', 0.77, 5000, now, now);
console.log("Added debug-agent — refresh dashboard to see 6 nodes");
