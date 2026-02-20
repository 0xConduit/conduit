# Conduit Backend — Complete Source Reference

All backend files created for the Conduit MCP server + REST API.

**Runtime:** Bun + SQLite | **Dependencies:** `@modelcontextprotocol/sdk`, `zod`

---

## Directory Structure

```
backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── db/
│   │   ├── connection.ts          # Singleton SQLite DB
│   │   ├── schema.ts              # CREATE TABLE statements
│   │   └── seed.ts                # Seed 5 agents + 5 connections
│   ├── shared/
│   │   └── types.ts               # TypeScript interfaces
│   ├── services/
│   │   ├── agent.service.ts       # Register, discover, list, update
│   │   ├── task.service.ts        # Create, dispatch, complete (orchestrator)
│   │   ├── reputation.service.ts  # Attestations + score computation
│   │   ├── payment.service.ts     # Escrow + settlement
│   │   ├── connection.service.ts  # Network connection management
│   │   ├── activity.service.ts    # Activity event recording
│   │   └── vitals.service.ts      # Computed system aggregates
│   ├── chains/
│   │   ├── types.ts               # Chain service interfaces
│   │   ├── hedera.stub.ts         # HTS escrow, HCS attestation, Schedule
│   │   ├── kite.stub.ts           # x402 micropayments, identity
│   │   ├── base.stub.ts           # Revenue settlement, builder codes
│   │   └── zerog.stub.ts          # iNFT identities, AI inference ranking
│   ├── mcp/
│   │   ├── server.ts              # MCP server setup + tool registration
│   │   └── tools/
│   │       ├── registry.tools.ts  # register_agent, discover_agents, get_agent, update_agent_status
│   │       ├── task.tools.ts      # create_task, dispatch_task, complete_task, get_task
│   │       ├── reputation.tools.ts # record_attestation, get_reputation
│   │       └── payment.tools.ts   # escrow_payment, settle_payment, get_balance
│   ├── rest/
│   │   ├── server.ts              # Bun.serve() HTTP server
│   │   └── handlers.ts            # Route handlers
│   ├── mcp-entry.ts               # Entry: starts MCP server on stdio
│   └── rest-entry.ts              # Entry: starts REST server on port 3001
```

---

## package.json

```json
{
  "name": "conduit-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "rest": "bun run src/rest-entry.ts",
    "mcp": "bun run src/mcp-entry.ts",
    "seed": "bun run src/db/seed.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "bun-types": "^1.3.9"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "declaration": true,
    "types": ["bun-types"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## src/shared/types.ts

```typescript
// Shared TypeScript types — mirrors frontend store interfaces

export type AgentRole = "router" | "executor" | "settler";

export interface AgentEntity {
  id: string;
  role: AgentRole;
  capabilities: string[];
  attestationScore: number; // 0.0 to 1.0
  settlementBalance: number;
  status: "idle" | "processing" | "dormant";
  createdAt: number;
  updatedAt: number;
}

export interface NetworkConnection {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  bandwidth: number; // 0.0 to 1.0
  lastInteractionAt: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: number;
  message: string;
  type: "hired" | "payment" | "trust";
  connectionId?: string;
  taskId?: string;
}

export type TaskStatus = "pending" | "dispatched" | "completed" | "failed";

export interface Task {
  id: string;
  title: string;
  description?: string;
  requirements: string[];
  status: TaskStatus;
  requesterAgentId: string;
  assignedAgentId?: string;
  escrowAmount?: number;
  result?: string;
  createdAt: number;
  completedAt?: number;
  chainTxHash?: string;
}

export interface Attestation {
  id: string;
  agentId: string;
  attesterId: string;
  taskId?: string;
  score: number;
  metadata?: Record<string, unknown>;
  chain?: string;
  chainTxHash?: string;
  createdAt: number;
}

export type EscrowStatus = "locked" | "released" | "refunded";

export interface Escrow {
  id: string;
  taskId: string;
  payerAgentId: string;
  payeeAgentId?: string;
  amount: number;
  status: EscrowStatus;
  chain?: string;
  chainTxHash?: string;
  createdAt: number;
  settledAt?: number;
}

export interface Vitals {
  totalValueLocked: number;
  systemAttestation: number;
  activeProcesses: number;
}
```

---

## src/db/connection.ts

```typescript
import { Database } from "bun:sqlite";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const PROJECT_DATA_DIR = join(import.meta.dir, "../../data");
const DB_PATH = process.env.CONDUIT_DB_PATH || join(PROJECT_DATA_DIR, "conduit.db");

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    // Ensure data directory exists
    const dataDir = join(DB_PATH, "..");
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH, { create: true });
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

## src/db/schema.ts

```typescript
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
```

## src/db/seed.ts

```typescript
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
```

---

## src/services/agent.service.ts

```typescript
import { getDb } from "../db/connection.js";
import type { AgentEntity, AgentRole } from "../shared/types.js";

function rowToAgent(row: Record<string, unknown>): AgentEntity {
  return {
    id: row.id as string,
    role: row.role as AgentRole,
    capabilities: JSON.parse(row.capabilities as string),
    attestationScore: row.attestation_score as number,
    settlementBalance: row.settlement_balance as number,
    status: row.status as AgentEntity["status"],
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export function registerAgent(params: {
  id?: string;
  role: AgentRole;
  capabilities: string[];
}): AgentEntity {
  const db = getDb();
  const now = Date.now();
  const id = params.id || `agent-${generateId()}`;

  db.prepare(
    "INSERT INTO agents (id, role, capabilities, attestation_score, settlement_balance, status, created_at, updated_at) VALUES (?, ?, ?, 0.5, 0, 'idle', ?, ?)"
  ).run(id, params.role, JSON.stringify(params.capabilities), now, now);

  return getAgent(id)!;
}

export function getAgent(agentId: string): AgentEntity | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM agents WHERE id = ?").get(agentId) as Record<string, unknown> | null;
  return row ? rowToAgent(row) : null;
}

export function listAgents(): AgentEntity[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM agents ORDER BY created_at ASC").all() as Record<string, unknown>[];
  return rows.map(rowToAgent);
}

export function discoverAgents(params: {
  capabilities?: string[];
  role?: AgentRole;
  minReputation?: number;
}): AgentEntity[] {
  const agents = listAgents();
  return agents.filter((agent) => {
    if (params.role && agent.role !== params.role) return false;
    if (params.minReputation !== undefined && agent.attestationScore < params.minReputation) return false;
    if (params.capabilities && params.capabilities.length > 0) {
      const hasCapability = params.capabilities.some((cap) =>
        agent.capabilities.includes(cap)
      );
      if (!hasCapability) return false;
    }
    return true;
  });
}

export function updateAgentStatus(
  agentId: string,
  status: AgentEntity["status"]
): AgentEntity | null {
  const db = getDb();
  const now = Date.now();
  db.prepare("UPDATE agents SET status = ?, updated_at = ? WHERE id = ?").run(
    status,
    now,
    agentId
  );
  return getAgent(agentId);
}

export function updateAgentBalance(agentId: string, delta: number): void {
  const db = getDb();
  const now = Date.now();
  db.prepare(
    "UPDATE agents SET settlement_balance = settlement_balance + ?, updated_at = ? WHERE id = ?"
  ).run(delta, now, agentId);
}

export function updateAgentAttestationScore(agentId: string): void {
  const db = getDb();
  const now = Date.now();
  const result = db
    .prepare("SELECT AVG(score) as avg_score FROM attestations WHERE agent_id = ?")
    .get(agentId) as { avg_score: number | null } | null;
  const avgScore = result?.avg_score ?? 0.5;
  db.prepare(
    "UPDATE agents SET attestation_score = ?, updated_at = ? WHERE id = ?"
  ).run(avgScore, now, agentId);
}
```

## src/services/connection.service.ts

```typescript
import { getDb } from "../db/connection.js";
import type { NetworkConnection } from "../shared/types.js";

function rowToConnection(row: Record<string, unknown>): NetworkConnection {
  return {
    id: row.id as string,
    sourceAgentId: row.source_agent_id as string,
    targetAgentId: row.target_agent_id as string,
    bandwidth: row.bandwidth as number,
    lastInteractionAt: row.last_interaction_at as number,
  };
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export function listConnections(): NetworkConnection[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM connections ORDER BY last_interaction_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToConnection);
}

export function getConnection(connectionId: string): NetworkConnection | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM connections WHERE id = ?").get(connectionId) as Record<string, unknown> | null;
  return row ? rowToConnection(row) : null;
}

export function findConnection(sourceAgentId: string, targetAgentId: string): NetworkConnection | null {
  const db = getDb();
  const row = db.prepare(
    "SELECT * FROM connections WHERE (source_agent_id = ? AND target_agent_id = ?) OR (source_agent_id = ? AND target_agent_id = ?)"
  ).get(sourceAgentId, targetAgentId, targetAgentId, sourceAgentId) as Record<string, unknown> | null;
  return row ? rowToConnection(row) : null;
}

export function createConnection(params: {
  sourceAgentId: string;
  targetAgentId: string;
  bandwidth?: number;
}): NetworkConnection {
  const db = getDb();
  const now = Date.now();

  // Check if connection already exists
  const existing = findConnection(params.sourceAgentId, params.targetAgentId);
  if (existing) {
    // Update last interaction time and bump bandwidth
    const newBandwidth = Math.min(1.0, existing.bandwidth + 0.05);
    db.prepare(
      "UPDATE connections SET bandwidth = ?, last_interaction_at = ? WHERE id = ?"
    ).run(newBandwidth, now, existing.id);
    return { ...existing, bandwidth: newBandwidth, lastInteractionAt: now };
  }

  const id = `conn-${generateId()}`;
  const bandwidth = params.bandwidth ?? 0.5;

  db.prepare(
    "INSERT INTO connections (id, source_agent_id, target_agent_id, bandwidth, last_interaction_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, params.sourceAgentId, params.targetAgentId, bandwidth, now);

  return { id, sourceAgentId: params.sourceAgentId, targetAgentId: params.targetAgentId, bandwidth, lastInteractionAt: now };
}

export function updateConnectionInteraction(connectionId: string): void {
  const db = getDb();
  const now = Date.now();
  db.prepare("UPDATE connections SET last_interaction_at = ? WHERE id = ?").run(now, connectionId);
}
```

## src/services/activity.service.ts

```typescript
import { getDb } from "../db/connection.js";
import type { ActivityEvent } from "../shared/types.js";

function rowToEvent(row: Record<string, unknown>): ActivityEvent {
  return {
    id: row.id as string,
    timestamp: row.timestamp as number,
    message: row.message as string,
    type: row.type as ActivityEvent["type"],
    connectionId: (row.connection_id as string) || undefined,
    taskId: (row.task_id as string) || undefined,
  };
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export function recordActivity(params: {
  message: string;
  type: ActivityEvent["type"];
  connectionId?: string;
  taskId?: string;
}): ActivityEvent {
  const db = getDb();
  const id = `evt-${generateId()}`;
  const timestamp = Date.now();

  db.prepare(
    "INSERT INTO activity_events (id, timestamp, message, type, connection_id, task_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, timestamp, params.message, params.type, params.connectionId ?? null, params.taskId ?? null);

  return { id, timestamp, message: params.message, type: params.type, connectionId: params.connectionId, taskId: params.taskId };
}

export function listActivity(limit: number = 50): ActivityEvent[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM activity_events ORDER BY timestamp DESC LIMIT ?").all(limit) as Record<string, unknown>[];
  return rows.map(rowToEvent);
}
```

## src/services/vitals.service.ts

```typescript
import { getDb } from "../db/connection.js";
import type { Vitals } from "../shared/types.js";

export function computeVitals(): Vitals {
  const db = getDb();

  // TVL = sum of all agent balances + locked escrow amounts
  const balanceResult = db
    .prepare("SELECT COALESCE(SUM(settlement_balance), 0) as total FROM agents")
    .get() as { total: number };

  const escrowResult = db
    .prepare("SELECT COALESCE(SUM(amount), 0) as total FROM escrows WHERE status = 'locked'")
    .get() as { total: number };

  const totalValueLocked = balanceResult.total + escrowResult.total;

  // System attestation = average of all agent attestation scores
  const attestationResult = db
    .prepare("SELECT COALESCE(AVG(attestation_score), 0) as avg FROM agents")
    .get() as { avg: number };

  const systemAttestation = Math.round(attestationResult.avg * 100) / 100;

  // Active processes = count of dispatched tasks
  const processResult = db
    .prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'dispatched'")
    .get() as { cnt: number };

  return {
    totalValueLocked,
    systemAttestation,
    activeProcesses: processResult.cnt,
  };
}
```

## src/services/payment.service.ts

```typescript
import { getDb } from "../db/connection.js";
import type { Escrow } from "../shared/types.js";
import { updateAgentBalance } from "./agent.service.js";

function rowToEscrow(row: Record<string, unknown>): Escrow {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    payerAgentId: row.payer_agent_id as string,
    payeeAgentId: (row.payee_agent_id as string) || undefined,
    amount: row.amount as number,
    status: row.status as Escrow["status"],
    chain: (row.chain as string) || undefined,
    chainTxHash: (row.chain_tx_hash as string) || undefined,
    createdAt: row.created_at as number,
    settledAt: (row.settled_at as number) || undefined,
  };
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export function createEscrow(params: {
  taskId: string;
  payerAgentId: string;
  payeeAgentId?: string;
  amount: number;
  chain?: string;
  chainTxHash?: string;
}): Escrow {
  const db = getDb();
  const id = `escrow-${generateId()}`;
  const now = Date.now();

  // Deduct from payer's balance
  updateAgentBalance(params.payerAgentId, -params.amount);

  db.prepare(
    "INSERT INTO escrows (id, task_id, payer_agent_id, payee_agent_id, amount, status, chain, chain_tx_hash, created_at) VALUES (?, ?, ?, ?, ?, 'locked', ?, ?, ?)"
  ).run(id, params.taskId, params.payerAgentId, params.payeeAgentId ?? null, params.amount, params.chain ?? null, params.chainTxHash ?? null, now);

  return getEscrow(id)!;
}

export function getEscrow(escrowId: string): Escrow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM escrows WHERE id = ?").get(escrowId) as Record<string, unknown> | null;
  return row ? rowToEscrow(row) : null;
}

export function getEscrowByTaskId(taskId: string): Escrow | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM escrows WHERE task_id = ? ORDER BY created_at DESC LIMIT 1").get(taskId) as Record<string, unknown> | null;
  return row ? rowToEscrow(row) : null;
}

export function releaseEscrow(escrowId: string): Escrow | null {
  const db = getDb();
  const escrow = getEscrow(escrowId);
  if (!escrow || escrow.status !== "locked") return null;

  const now = Date.now();

  // Credit payee's balance
  if (escrow.payeeAgentId) {
    updateAgentBalance(escrow.payeeAgentId, escrow.amount);
  }

  db.prepare("UPDATE escrows SET status = 'released', settled_at = ? WHERE id = ?").run(now, escrowId);
  return getEscrow(escrowId);
}

export function refundEscrow(escrowId: string): Escrow | null {
  const db = getDb();
  const escrow = getEscrow(escrowId);
  if (!escrow || escrow.status !== "locked") return null;

  const now = Date.now();

  // Refund payer's balance
  updateAgentBalance(escrow.payerAgentId, escrow.amount);

  db.prepare("UPDATE escrows SET status = 'refunded', settled_at = ? WHERE id = ?").run(now, escrowId);
  return getEscrow(escrowId);
}

export function getAgentEscrows(agentId: string): Escrow[] {
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM escrows WHERE payer_agent_id = ? OR payee_agent_id = ? ORDER BY created_at DESC"
  ).all(agentId, agentId) as Record<string, unknown>[];
  return rows.map(rowToEscrow);
}

export function getAgentPendingEscrows(agentId: string): number {
  const db = getDb();
  const result = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM escrows WHERE (payer_agent_id = ? OR payee_agent_id = ?) AND status = 'locked'"
  ).get(agentId, agentId) as { total: number };
  return result.total;
}
```

## src/services/reputation.service.ts

```typescript
import { getDb } from "../db/connection.js";
import type { Attestation } from "../shared/types.js";
import { updateAgentAttestationScore } from "./agent.service.js";

function rowToAttestation(row: Record<string, unknown>): Attestation {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    attesterId: row.attester_id as string,
    taskId: (row.task_id as string) || undefined,
    score: row.score as number,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    chain: (row.chain as string) || undefined,
    chainTxHash: (row.chain_tx_hash as string) || undefined,
    createdAt: row.created_at as number,
  };
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export function recordAttestation(params: {
  agentId: string;
  attesterId: string;
  taskId?: string;
  score: number;
  metadata?: Record<string, unknown>;
  chain?: string;
  chainTxHash?: string;
}): Attestation {
  const db = getDb();
  const id = `att-${generateId()}`;
  const now = Date.now();

  db.prepare(
    "INSERT INTO attestations (id, agent_id, attester_id, task_id, score, metadata, chain, chain_tx_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    params.agentId,
    params.attesterId,
    params.taskId ?? null,
    params.score,
    params.metadata ? JSON.stringify(params.metadata) : null,
    params.chain ?? null,
    params.chainTxHash ?? null,
    now
  );

  // Recompute the agent's attestation score
  updateAgentAttestationScore(params.agentId);

  return getAttestation(id)!;
}

export function getAttestation(attestationId: string): Attestation | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM attestations WHERE id = ?").get(attestationId) as Record<string, unknown> | null;
  return row ? rowToAttestation(row) : null;
}

export function getAgentAttestations(agentId: string): Attestation[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM attestations WHERE agent_id = ? ORDER BY created_at DESC").all(agentId) as Record<string, unknown>[];
  return rows.map(rowToAttestation);
}

export function getAgentReputation(agentId: string): {
  score: number;
  attestations: Attestation[];
} {
  const db = getDb();
  const result = db
    .prepare("SELECT attestation_score FROM agents WHERE id = ?")
    .get(agentId) as { attestation_score: number } | null;

  const attestations = getAgentAttestations(agentId);

  return {
    score: result?.attestation_score ?? 0,
    attestations,
  };
}
```

## src/services/task.service.ts

```typescript
import { getDb } from "../db/connection.js";
import type { Task } from "../shared/types.js";
import { getAgent, updateAgentStatus } from "./agent.service.js";
import { createConnection, findConnection, updateConnectionInteraction } from "./connection.service.js";
import { recordActivity } from "./activity.service.js";
import { createEscrow, getEscrowByTaskId, releaseEscrow } from "./payment.service.js";
import { recordAttestation } from "./reputation.service.js";

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || undefined,
    requirements: JSON.parse(row.requirements as string),
    status: row.status as Task["status"],
    requesterAgentId: row.requester_agent_id as string,
    assignedAgentId: (row.assigned_agent_id as string) || undefined,
    escrowAmount: (row.escrow_amount as number) || undefined,
    result: (row.result as string) || undefined,
    createdAt: row.created_at as number,
    completedAt: (row.completed_at as number) || undefined,
    chainTxHash: (row.chain_tx_hash as string) || undefined,
  };
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export function createTask(params: {
  title: string;
  description?: string;
  requirements: string[];
  requesterAgentId: string;
  escrowAmount?: number;
}): Task {
  const db = getDb();
  const id = `task-${generateId()}`;
  const now = Date.now();

  db.prepare(
    "INSERT INTO tasks (id, title, description, requirements, status, requester_agent_id, escrow_amount, created_at) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)"
  ).run(
    id,
    params.title,
    params.description ?? null,
    JSON.stringify(params.requirements),
    params.requesterAgentId,
    params.escrowAmount ?? null,
    now
  );

  // If escrow amount specified, lock it
  if (params.escrowAmount && params.escrowAmount > 0) {
    createEscrow({
      taskId: id,
      payerAgentId: params.requesterAgentId,
      amount: params.escrowAmount,
    });
  }

  return getTask(id)!;
}

export function getTask(taskId: string): Task | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Record<string, unknown> | null;
  return row ? rowToTask(row) : null;
}

export function listTasks(): Task[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToTask);
}

export function dispatchTask(params: {
  taskId: string;
  agentId: string;
}): Task | null {
  const db = getDb();
  const task = getTask(params.taskId);
  if (!task || task.status !== "pending") return null;

  const agent = getAgent(params.agentId);
  if (!agent) return null;

  const now = Date.now();

  // Assign the task
  db.prepare(
    "UPDATE tasks SET status = 'dispatched', assigned_agent_id = ? WHERE id = ?"
  ).run(params.agentId, params.taskId);

  // Update escrow payee if exists
  const escrow = getEscrowByTaskId(params.taskId);
  if (escrow) {
    db.prepare("UPDATE escrows SET payee_agent_id = ? WHERE id = ?").run(params.agentId, escrow.id);
  }

  // Set agent to processing
  updateAgentStatus(params.agentId, "processing");

  // Ensure connection exists between requester and assigned agent
  const connection = createConnection({
    sourceAgentId: task.requesterAgentId,
    targetAgentId: params.agentId,
  });

  // Record activity
  recordActivity({
    message: `[ROUTING] Task "${task.title}" dispatched: ${task.requesterAgentId} → ${params.agentId}`,
    type: "hired",
    connectionId: connection.id,
    taskId: params.taskId,
  });

  return getTask(params.taskId);
}

export function completeTask(params: {
  taskId: string;
  result?: string;
  attestationScore?: number;
}): Task | null {
  const db = getDb();
  const task = getTask(params.taskId);
  if (!task || task.status !== "dispatched" || !task.assignedAgentId) return null;

  const now = Date.now();

  // Mark task completed
  db.prepare(
    "UPDATE tasks SET status = 'completed', result = ?, completed_at = ? WHERE id = ?"
  ).run(params.result ?? null, now, params.taskId);

  // Set agent back to idle
  updateAgentStatus(task.assignedAgentId, "idle");

  // Record attestation if score provided
  if (params.attestationScore !== undefined) {
    recordAttestation({
      agentId: task.assignedAgentId,
      attesterId: task.requesterAgentId,
      taskId: params.taskId,
      score: params.attestationScore,
      chain: "hedera",
    });

    const conn = findConnection(task.requesterAgentId, task.assignedAgentId);
    recordActivity({
      message: `[ATTEST] Trust attestation logged: ${task.requesterAgentId} rated ${task.assignedAgentId} (${params.attestationScore})`,
      type: "trust",
      connectionId: conn?.id,
      taskId: params.taskId,
    });
  }

  // Release escrow if exists
  const escrow = getEscrowByTaskId(params.taskId);
  if (escrow && escrow.status === "locked") {
    releaseEscrow(escrow.id);

    const conn = findConnection(task.requesterAgentId, task.assignedAgentId);
    recordActivity({
      message: `[SETTLEMENT] ${escrow.amount} USDC settled: ${task.requesterAgentId} → ${task.assignedAgentId}`,
      type: "payment",
      connectionId: conn?.id,
      taskId: params.taskId,
    });
  }

  return getTask(params.taskId);
}
```

---

## src/chains/types.ts

```typescript
// Chain service interfaces — each chain stub implements the relevant interface

export interface EscrowService {
  lockFunds(params: { taskId: string; payerAgentId: string; amount: number }): Promise<{ txHash: string }>;
  releaseFunds(params: { escrowId: string; payeeAgentId: string; amount: number }): Promise<{ txHash: string }>;
  refundFunds(params: { escrowId: string; payerAgentId: string; amount: number }): Promise<{ txHash: string }>;
}

export interface AttestationService {
  recordAttestation(params: {
    agentId: string;
    attesterId: string;
    score: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ txHash: string; topicId?: string }>;
}

export interface ScheduleService {
  scheduleRecurring(params: {
    taskId: string;
    intervalSeconds: number;
    payload: Record<string, unknown>;
  }): Promise<{ scheduleId: string }>;
}

export interface PaymentGateway {
  processPayment(params: {
    from: string;
    to: string;
    amount: number;
    memo?: string;
  }): Promise<{ txHash: string; paymentId: string }>;
}

export interface IdentityService {
  verifyIdentity(params: { agentId: string }): Promise<{ verified: boolean; did?: string }>;
}

export interface RevenueService {
  settleRevenue(params: {
    agentId: string;
    amount: number;
    builderCode?: string;
  }): Promise<{ txHash: string }>;
}

export interface AnalyticsService {
  recordAnalytics(params: {
    agentId: string;
    eventType: string;
    data: Record<string, unknown>;
    builderCode?: string;
  }): Promise<{ recorded: boolean }>;
}

export interface NFTService {
  mintAgentNFT(params: {
    agentId: string;
    metadata: Record<string, unknown>;
  }): Promise<{ tokenId: string; txHash: string }>;
}

export interface InferenceService {
  rankAgents(params: {
    agentIds: string[];
    criteria: string;
  }): Promise<{ rankings: Array<{ agentId: string; score: number }> }>;
}
```

## src/chains/hedera.stub.ts

```typescript
// TODO: Replace with real Hedera SDK integration
// - HTS (Hedera Token Service) for escrow lock/release/refund
// - HCS (Hedera Consensus Service) for attestation recording
// - Schedule Service for recurring task scheduling
// SDK: @hashgraph/sdk

import type { EscrowService, AttestationService, ScheduleService } from "./types.js";

const generateTxHash = () => `0.0.${Math.floor(Math.random() * 9999999)}`;

export const hederaEscrow: EscrowService = {
  async lockFunds(params) {
    // TODO: Use HTS to create an escrow token transfer
    // const client = Client.forTestnet();
    // const tx = new TransferTransaction()...
    console.log(`[hedera-stub] lockFunds: ${params.amount} for task ${params.taskId} from ${params.payerAgentId}`);
    return { txHash: generateTxHash() };
  },

  async releaseFunds(params) {
    // TODO: Use HTS to release escrowed tokens to payee
    console.log(`[hedera-stub] releaseFunds: ${params.amount} for escrow ${params.escrowId} to ${params.payeeAgentId}`);
    return { txHash: generateTxHash() };
  },

  async refundFunds(params) {
    // TODO: Use HTS to refund escrowed tokens to payer
    console.log(`[hedera-stub] refundFunds: ${params.amount} for escrow ${params.escrowId} to ${params.payerAgentId}`);
    return { txHash: generateTxHash() };
  },
};

export const hederaAttestation: AttestationService = {
  async recordAttestation(params) {
    // TODO: Use HCS to submit attestation message to a topic
    // const client = Client.forTestnet();
    // const tx = new TopicMessageSubmitTransaction()
    //   .setTopicId(topicId)
    //   .setMessage(JSON.stringify({ agentId, attesterId, score }))
    //   .execute(client);
    const topicId = `0.0.${Math.floor(Math.random() * 999999)}`;
    console.log(`[hedera-stub] recordAttestation: ${params.attesterId} attests ${params.agentId} with score ${params.score} on topic ${topicId}`);
    return { txHash: generateTxHash(), topicId };
  },
};

export const hederaSchedule: ScheduleService = {
  async scheduleRecurring(params) {
    // TODO: Use Hedera Schedule Service for recurring task execution
    // const client = Client.forTestnet();
    // const tx = new ScheduleCreateTransaction()...
    const scheduleId = `sched-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[hedera-stub] scheduleRecurring: task ${params.taskId} every ${params.intervalSeconds}s → ${scheduleId}`);
    return { scheduleId };
  },
};
```

## src/chains/kite.stub.ts

```typescript
// TODO: Replace with real Kite AI / x402 integration
// - x402 protocol for micropayments between agents
// - Identity verification for agent DID resolution
// SDK: TBD (Kite AI SDK)

import type { PaymentGateway, IdentityService } from "./types.js";

const generateTxHash = () => `kite-${Math.random().toString(36).substring(2, 15)}`;

export const kitePayment: PaymentGateway = {
  async processPayment(params) {
    // TODO: Use x402 protocol to process micropayment
    // const client = new KiteClient({ apiKey: process.env.KITE_API_KEY });
    // const payment = await client.x402.pay({ from, to, amount, memo });
    const paymentId = `x402-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[kite-stub] processPayment: ${params.amount} from ${params.from} to ${params.to} (memo: ${params.memo || "none"}) → ${paymentId}`);
    return { txHash: generateTxHash(), paymentId };
  },
};

export const kiteIdentity: IdentityService = {
  async verifyIdentity(params) {
    // TODO: Use Kite AI identity service to verify agent DID
    // const client = new KiteClient({ apiKey: process.env.KITE_API_KEY });
    // const result = await client.identity.verify(params.agentId);
    const did = `did:kite:${params.agentId}`;
    console.log(`[kite-stub] verifyIdentity: ${params.agentId} → verified as ${did}`);
    return { verified: true, did };
  },
};
```

## src/chains/base.stub.ts

```typescript
// TODO: Replace with real Base (Coinbase L2) integration
// - Revenue settlement on Base L2
// - Builder codes for analytics tracking
// SDK: viem + base chain config, or Coinbase SDK

import type { RevenueService, AnalyticsService } from "./types.js";

const generateTxHash = () => `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

export const baseRevenue: RevenueService = {
  async settleRevenue(params) {
    // TODO: Use Base L2 for revenue settlement
    // import { createWalletClient, http } from 'viem';
    // import { base } from 'viem/chains';
    // const client = createWalletClient({ chain: base, transport: http() });
    // const hash = await client.sendTransaction({ to, value: parseEther(amount) });
    console.log(`[base-stub] settleRevenue: ${params.amount} to agent ${params.agentId} (builder: ${params.builderCode || "none"})`);
    return { txHash: generateTxHash() };
  },
};

export const baseAnalytics: AnalyticsService = {
  async recordAnalytics(params) {
    // TODO: Use Base builder codes for on-chain analytics
    // Record agent activity metrics on-chain for builder reward tracking
    console.log(`[base-stub] recordAnalytics: ${params.eventType} for agent ${params.agentId} (builder: ${params.builderCode || "none"})`);
    return { recorded: true };
  },
};
```

## src/chains/zerog.stub.ts

```typescript
// TODO: Replace with real 0G (Zero Gravity) integration
// - iNFT minting for agent identity tokens
// - AI inference ranking for agent quality assessment
// SDK: TBD (0G SDK)

import type { NFTService, InferenceService } from "./types.js";

const generateTxHash = () => `0g-${Math.random().toString(36).substring(2, 15)}`;

export const zerogNFT: NFTService = {
  async mintAgentNFT(params) {
    // TODO: Use 0G iNFT to mint identity NFT for agent
    // const client = new ZeroGClient({ endpoint: process.env.ZEROG_ENDPOINT });
    // const result = await client.inft.mint({
    //   owner: params.agentId,
    //   metadata: params.metadata,
    // });
    const tokenId = `inft-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[0g-stub] mintAgentNFT: minting iNFT ${tokenId} for agent ${params.agentId}`);
    return { tokenId, txHash: generateTxHash() };
  },
};

export const zerogInference: InferenceService = {
  async rankAgents(params) {
    // TODO: Use 0G AI inference to rank agents based on criteria
    // const client = new ZeroGClient({ endpoint: process.env.ZEROG_ENDPOINT });
    // const result = await client.inference.rank({
    //   agentIds: params.agentIds,
    //   criteria: params.criteria,
    // });
    console.log(`[0g-stub] rankAgents: ranking ${params.agentIds.length} agents by "${params.criteria}"`);
    const rankings = params.agentIds.map((agentId, i) => ({
      agentId,
      score: Math.round((1 - i * 0.1) * 100) / 100,
    }));
    return { rankings };
  },
};
```

---

## src/mcp/server.ts

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerRegistryTools } from "./tools/registry.tools.js";
import { registerTaskTools } from "./tools/task.tools.js";
import { registerReputationTools } from "./tools/reputation.tools.js";
import { registerPaymentTools } from "./tools/payment.tools.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "conduit",
    version: "0.1.0",
  });

  // Register all tool groups
  registerRegistryTools(server);
  registerTaskTools(server);
  registerReputationTools(server);
  registerPaymentTools(server);

  return server;
}

export async function startMcpServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp] Conduit MCP server running on stdio");
}
```

## src/mcp/tools/registry.tools.ts

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAgent, getAgent, discoverAgents, updateAgentStatus } from "../../services/agent.service.js";

export function registerRegistryTools(server: McpServer) {
  server.tool(
    "register_agent",
    "Register a new agent in the Conduit economy network",
    {
      id: z.string().optional().describe("Optional custom agent ID"),
      role: z.enum(["router", "executor", "settler"]).describe("Agent role in the network"),
      capabilities: z.array(z.string()).describe("List of agent capabilities (e.g. 'defi-execution', 'routing')"),
    },
    async (params) => {
      const agent = registerAgent({
        id: params.id,
        role: params.role,
        capabilities: params.capabilities,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(agent, null, 2) }],
      };
    }
  );

  server.tool(
    "discover_agents",
    "Find agents matching criteria (capabilities, role, minimum reputation)",
    {
      capabilities: z.array(z.string()).optional().describe("Required capabilities to filter by"),
      role: z.enum(["router", "executor", "settler"]).optional().describe("Filter by agent role"),
      minReputation: z.number().min(0).max(1).optional().describe("Minimum attestation score (0.0-1.0)"),
    },
    async (params) => {
      const agents = discoverAgents({
        capabilities: params.capabilities,
        role: params.role,
        minReputation: params.minReputation,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(agents, null, 2) }],
      };
    }
  );

  server.tool(
    "get_agent",
    "Get details of a specific agent by ID",
    {
      agentId: z.string().describe("The agent ID to look up"),
    },
    async (params) => {
      const agent = getAgent(params.agentId);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" not found` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(agent, null, 2) }],
      };
    }
  );

  server.tool(
    "update_agent_status",
    "Update an agent's operational status",
    {
      agentId: z.string().describe("The agent ID to update"),
      status: z.enum(["idle", "processing", "dormant"]).describe("New status"),
    },
    async (params) => {
      const agent = updateAgentStatus(params.agentId, params.status);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" not found` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(agent, null, 2) }],
      };
    }
  );
}
```

## src/mcp/tools/task.tools.ts

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createTask, getTask, dispatchTask, completeTask } from "../../services/task.service.js";

export function registerTaskTools(server: McpServer) {
  server.tool(
    "create_task",
    "Create a new task in the Conduit network. Optionally lock escrow funds.",
    {
      title: z.string().describe("Task title"),
      description: z.string().optional().describe("Detailed task description"),
      requirements: z.array(z.string()).describe("Required capabilities to complete this task"),
      requesterAgentId: z.string().describe("ID of the agent requesting the task"),
      escrowAmount: z.number().optional().describe("Amount to lock in escrow for payment"),
    },
    async (params) => {
      const task = createTask({
        title: params.title,
        description: params.description,
        requirements: params.requirements,
        requesterAgentId: params.requesterAgentId,
        escrowAmount: params.escrowAmount,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );

  server.tool(
    "dispatch_task",
    "Assign a pending task to a specific agent. Creates connection, sets agent to processing, logs activity.",
    {
      taskId: z.string().describe("ID of the task to dispatch"),
      agentId: z.string().describe("ID of the agent to assign the task to"),
    },
    async (params) => {
      const task = dispatchTask({
        taskId: params.taskId,
        agentId: params.agentId,
      });
      if (!task) {
        return {
          content: [{ type: "text", text: `Failed to dispatch task "${params.taskId}". It may not exist or may not be in 'pending' status.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );

  server.tool(
    "complete_task",
    "Mark a dispatched task as completed. Optionally record attestation and release escrow.",
    {
      taskId: z.string().describe("ID of the task to complete"),
      result: z.string().optional().describe("Result or output of the completed task"),
      attestationScore: z.number().min(0).max(1).optional().describe("Quality score (0.0-1.0) to attest for the assigned agent"),
    },
    async (params) => {
      const task = completeTask({
        taskId: params.taskId,
        result: params.result,
        attestationScore: params.attestationScore,
      });
      if (!task) {
        return {
          content: [{ type: "text", text: `Failed to complete task "${params.taskId}". It may not exist or may not be in 'dispatched' status.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );

  server.tool(
    "get_task",
    "Get details of a specific task by ID",
    {
      taskId: z.string().describe("The task ID to look up"),
    },
    async (params) => {
      const task = getTask(params.taskId);
      if (!task) {
        return {
          content: [{ type: "text", text: `Task "${params.taskId}" not found` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );
}
```

## src/mcp/tools/reputation.tools.ts

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { recordAttestation, getAgentReputation } from "../../services/reputation.service.js";

export function registerReputationTools(server: McpServer) {
  server.tool(
    "record_attestation",
    "Record a trust attestation for an agent (logged via Hedera HCS stub)",
    {
      agentId: z.string().describe("ID of the agent being attested"),
      attesterId: z.string().describe("ID of the attesting agent or entity"),
      taskId: z.string().optional().describe("Related task ID, if applicable"),
      score: z.number().min(0).max(1).describe("Attestation score (0.0 = worst, 1.0 = best)"),
    },
    async (params) => {
      const attestation = recordAttestation({
        agentId: params.agentId,
        attesterId: params.attesterId,
        taskId: params.taskId,
        score: params.score,
        chain: "hedera",
      });
      return {
        content: [{ type: "text", text: JSON.stringify(attestation, null, 2) }],
      };
    }
  );

  server.tool(
    "get_reputation",
    "Get an agent's reputation score and attestation history",
    {
      agentId: z.string().describe("The agent ID to look up"),
    },
    async (params) => {
      const reputation = getAgentReputation(params.agentId);
      return {
        content: [{ type: "text", text: JSON.stringify(reputation, null, 2) }],
      };
    }
  );
}
```

## src/mcp/tools/payment.tools.ts

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createEscrow, getEscrow, releaseEscrow, getAgentPendingEscrows } from "../../services/payment.service.js";
import { getAgent } from "../../services/agent.service.js";

export function registerPaymentTools(server: McpServer) {
  server.tool(
    "escrow_payment",
    "Lock funds in escrow for a task (via Hedera HTS stub). Deducts from payer balance.",
    {
      taskId: z.string().describe("Task ID the escrow is for"),
      payerAgentId: z.string().describe("Agent paying into escrow"),
      payeeAgentId: z.string().optional().describe("Agent who will receive payment on release"),
      amount: z.number().positive().describe("Amount to lock in escrow"),
    },
    async (params) => {
      const escrow = createEscrow({
        taskId: params.taskId,
        payerAgentId: params.payerAgentId,
        payeeAgentId: params.payeeAgentId,
        amount: params.amount,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(escrow, null, 2) }],
      };
    }
  );

  server.tool(
    "settle_payment",
    "Release escrowed funds to the payee agent",
    {
      escrowId: z.string().describe("ID of the escrow to settle/release"),
    },
    async (params) => {
      const escrow = releaseEscrow(params.escrowId);
      if (!escrow) {
        return {
          content: [{ type: "text", text: `Escrow "${params.escrowId}" not found or not in 'locked' status` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(escrow, null, 2) }],
      };
    }
  );

  server.tool(
    "get_balance",
    "Get an agent's settlement balance and pending escrow total",
    {
      agentId: z.string().describe("The agent ID to check balance for"),
    },
    async (params) => {
      const agent = getAgent(params.agentId);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" not found` }],
          isError: true,
        };
      }
      const pendingEscrows = getAgentPendingEscrows(params.agentId);
      const result = {
        agentId: params.agentId,
        settlementBalance: agent.settlementBalance,
        pendingEscrows,
        availableBalance: agent.settlementBalance,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
```

---

## src/rest/handlers.ts

```typescript
import { listAgents, getAgent } from "../services/agent.service.js";
import { listConnections } from "../services/connection.service.js";
import { computeVitals } from "../services/vitals.service.js";
import { listActivity } from "../services/activity.service.js";
import { listTasks, getTask } from "../services/task.service.js";

type Handler = (req: Request, params: Record<string, string>) => Response | Promise<Response>;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const handlers: Record<string, Handler> = {
  "GET /api/agents": () => json(listAgents()),

  "GET /api/agents/:id": (_req, params) => {
    const agent = getAgent(params.id);
    return agent ? json(agent) : json({ error: "Agent not found" }, 404);
  },

  "GET /api/connections": () => json(listConnections()),

  "GET /api/vitals": () => json(computeVitals()),

  "GET /api/activity": (req) => {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    return json(listActivity(limit));
  },

  "GET /api/tasks": () => json(listTasks()),

  "GET /api/tasks/:id": (_req, params) => {
    const task = getTask(params.id);
    return task ? json(task) : json({ error: "Task not found" }, 404);
  },
};
```

## src/rest/server.ts

```typescript
import { handlers } from "./handlers.js";

const PORT = parseInt(process.env.PORT || "3001", 10);

function addCorsHeaders(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

type RouteMatch = {
  handler: (req: Request, params: Record<string, string>) => Response | Promise<Response>;
  params: Record<string, string>;
} | null;

function matchRoute(method: string, pathname: string): RouteMatch {
  for (const [routeKey, handler] of Object.entries(handlers)) {
    const [routeMethod, routePattern] = routeKey.split(" ");
    if (routeMethod !== method) continue;

    const routeParts = routePattern.split("/");
    const pathParts = pathname.split("/");

    if (routeParts.length !== pathParts.length) continue;

    const params: Record<string, string> = {};
    let match = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        params[routeParts[i].slice(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) return { handler, params };
  }

  return null;
}

export function startRestServer() {
  const server = Bun.serve({
    port: PORT,
    fetch(req) {
      const url = new URL(req.url);

      // CORS preflight
      if (req.method === "OPTIONS") {
        return addCorsHeaders(new Response(null, { status: 204 }));
      }

      const route = matchRoute(req.method, url.pathname);
      if (route) {
        const response = route.handler(req, route.params);
        if (response instanceof Promise) {
          return response.then(addCorsHeaders);
        }
        return addCorsHeaders(response);
      }

      return addCorsHeaders(
        new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      );
    },
  });

  console.log(`[rest] Conduit REST API running on http://localhost:${server.port}`);
  return server;
}
```

---

## src/rest-entry.ts

```typescript
import { seedDatabase } from "./db/seed.js";
import { startRestServer } from "./rest/server.js";

// Initialize database and seed
seedDatabase();

// Start REST server
startRestServer();
```

## src/mcp-entry.ts

```typescript
import { seedDatabase } from "./db/seed.js";
import { startMcpServer } from "./mcp/server.js";

// Initialize database and seed
seedDatabase();

// Start MCP server on stdio
startMcpServer().catch((err) => {
  console.error("[mcp] Fatal error:", err);
  process.exit(1);
});
```

---

## Frontend Changes

### frontend/next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```

### frontend/store/useEconomyStore.ts

- `initializeNetwork()` now fetches from `/api/agents`, `/api/connections`, `/api/vitals`, `/api/activity`
- Falls back to hardcoded data if backend is unavailable
- `networkTick()` polls backend for updates when connected, simulates random pulses when offline
- New state fields: `backendAvailable`, `lastActivityTimestamp`

### frontend/components/canvas/LivingCanvas.tsx

- Added `getDynamicPosition()` with 12 predefined perimeter slots for dynamically registered agents
- Agents not in the static layout get stable, non-overlapping positions
- Overflow agents beyond 12 are placed in an expanding golden-angle spiral
