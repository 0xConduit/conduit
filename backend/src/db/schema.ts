import { getDb } from "./connection.js";

export function initSchema(): void {
  const db = getDb();

  db.exec(`CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('router', 'executor', 'settler')),
    capabilities TEXT NOT NULL DEFAULT '[]',
    attestation_score REAL NOT NULL DEFAULT 0.0,
    settlement_balance REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle', 'processing', 'dormant')),
    deployed_chain TEXT NOT NULL DEFAULT 'base',
    inft_token_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    source_agent_id TEXT NOT NULL REFERENCES agents(id),
    target_agent_id TEXT NOT NULL REFERENCES agents(id),
    bandwidth REAL NOT NULL DEFAULT 0.5,
    last_interaction_at INTEGER NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'dispatched', 'completed', 'failed')),
    requester_agent_id TEXT NOT NULL REFERENCES agents(id),
    assigned_agent_id TEXT REFERENCES agents(id),
    escrow_amount REAL,
    result TEXT,
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    chain_tx_hash TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS attestations (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id),
    attester_id TEXT NOT NULL,
    task_id TEXT REFERENCES tasks(id),
    score REAL NOT NULL,
    metadata TEXT,
    chain TEXT,
    chain_tx_hash TEXT,
    created_at INTEGER NOT NULL
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS activity_events (
    id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('hired', 'payment', 'trust')),
    connection_id TEXT,
    task_id TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS escrows (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id),
    payer_agent_id TEXT NOT NULL REFERENCES agents(id),
    payee_agent_id TEXT REFERENCES agents(id),
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'locked' CHECK(status IN ('locked', 'released', 'refunded')),
    chain TEXT,
    chain_tx_hash TEXT,
    created_at INTEGER NOT NULL,
    settled_at INTEGER
  )`);
}
