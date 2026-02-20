import { getDb } from "./connection.js";
import { initSchema } from "./schema.js";

export function seedDatabase(): void {
  initSchema();
  const db = getDb();

  const now = Date.now();

  // Check if already seeded
  const count = db.query("SELECT COUNT(*) as cnt FROM agents").get() as { cnt: number };
  if (count.cnt > 0) {
    console.log("[seed] Database already has data, skipping seed.");
    return;
  }

  // Seed 5 agents matching frontend's initializeNetwork()
  const agents = [
    { id: "node-alpha", role: "router", capabilities: ["discovery", "routing"], attestationScore: 0.99, settlementBalance: 50000 },
    { id: "worker-v7", role: "executor", capabilities: ["defi-execution", "arbitrage"], attestationScore: 0.88, settlementBalance: 12000 },
    { id: "data-ingest", role: "executor", capabilities: ["scraping", "parsing"], attestationScore: 0.75, settlementBalance: 2500 },
    { id: "settlement-layer", role: "settler", capabilities: ["escrow", "zk-verify"], attestationScore: 0.98, settlementBalance: 300000 },
    { id: "worker-v2", role: "executor", capabilities: ["content-gen"], attestationScore: 0.82, settlementBalance: 8000 },
  ];

  const insertAgent = db.prepare(
    "INSERT INTO agents (id, role, capabilities, attestation_score, settlement_balance, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'idle', ?, ?)"
  );

  for (const a of agents) {
    insertAgent.run(a.id, a.role, JSON.stringify(a.capabilities), a.attestationScore, a.settlementBalance, now, now);
  }

  // Seed 5 connections matching frontend's initializeNetwork()
  const connections = [
    { id: "conn-1", sourceAgentId: "node-alpha", targetAgentId: "worker-v7", bandwidth: 0.8 },
    { id: "conn-2", sourceAgentId: "node-alpha", targetAgentId: "data-ingest", bandwidth: 0.4 },
    { id: "conn-3", sourceAgentId: "worker-v7", targetAgentId: "settlement-layer", bandwidth: 0.9 },
    { id: "conn-4", sourceAgentId: "node-alpha", targetAgentId: "worker-v2", bandwidth: 0.5 },
    { id: "conn-5", sourceAgentId: "data-ingest", targetAgentId: "settlement-layer", bandwidth: 0.7 },
  ];

  const insertConn = db.prepare(
    "INSERT INTO connections (id, source_agent_id, target_agent_id, bandwidth, last_interaction_at) VALUES (?, ?, ?, ?, ?)"
  );

  for (const c of connections) {
    insertConn.run(c.id, c.sourceAgentId, c.targetAgentId, c.bandwidth, now);
  }

  console.log("[seed] Seeded 5 agents and 5 connections.");
}

// Allow running directly: `bun run src/db/seed.ts`
if (import.meta.main) {
  seedDatabase();
  console.log("[seed] Done.");
}
