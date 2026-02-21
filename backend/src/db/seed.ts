import { getDb } from "./connection.js";
import { initSchema } from "./schema.js";
import { generateAgentWallet } from "../services/wallet.service.js";

export function seedDatabase(): void {
  initSchema();
  const db = getDb();

  const now = Date.now();

  // Backfill wallets for existing agents that don't have one
  try {
    const agentsWithoutWallet = db.query(
      "SELECT id FROM agents WHERE wallet_address IS NULL"
    ).all() as { id: string }[];

    if (agentsWithoutWallet.length > 0) {
      const updateStmt = db.prepare(
        "UPDATE agents SET wallet_address = ?, encrypted_private_key = ? WHERE id = ?"
      );
      for (const row of agentsWithoutWallet) {
        try {
          const wallet = generateAgentWallet();
          updateStmt.run(wallet.address, wallet.encryptedPrivateKey, row.id);
          console.log(`[seed] Backfilled wallet for ${row.id}: ${wallet.address}`);
        } catch (err) {
          console.warn(`[seed] Failed to backfill wallet for ${row.id}:`, err);
        }
      }
    }
  } catch {
    // wallet columns may not exist yet on first run — that's fine, schema will create them
  }

  // Check if already seeded
  const count = db.query("SELECT COUNT(*) as cnt FROM agents").get() as { cnt: number };
  if (count.cnt > 0) {
    console.log("[seed] Database already has data, skipping seed.");
    return;
  }

  // Seed 5 agents matching frontend's initializeNetwork()
  const agents = [
    { id: "node-alpha",       role: "router",   capabilities: ["discovery", "routing"],         attestationScore: 0.99, settlementBalance: 50000,  chain: "base" },
    { id: "worker-v7",        role: "executor", capabilities: ["defi-execution", "arbitrage"],  attestationScore: 0.88, settlementBalance: 12000,  chain: "base" },
    { id: "data-ingest",      role: "executor", capabilities: ["scraping", "parsing"],          attestationScore: 0.75, settlementBalance: 2500,   chain: "hedera" },
    { id: "settlement-layer", role: "settler",  capabilities: ["escrow", "zk-verify"],          attestationScore: 0.98, settlementBalance: 300000, chain: "zerog" },
    { id: "worker-v2",        role: "executor", capabilities: ["content-gen"],                  attestationScore: 0.82, settlementBalance: 8000,   chain: "0g" },
  ];

  const insertAgent = db.prepare(
    "INSERT INTO agents (id, role, capabilities, attestation_score, settlement_balance, status, deployed_chain, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'idle', ?, ?, ?)"
  );

  for (const a of agents) {
    insertAgent.run(a.id, a.role, JSON.stringify(a.capabilities), a.attestationScore, a.settlementBalance, a.chain, now, now);
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
