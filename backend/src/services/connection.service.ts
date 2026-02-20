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
