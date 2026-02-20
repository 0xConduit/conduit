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
