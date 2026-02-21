import { getDb } from "../db/connection.js";
import type { Attestation } from "../shared/types.js";
import { updateAgentAttestationScore } from "./agent.service.js";
import { hederaAttestation } from "../chains/hedera.stub.js";

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

  hederaAttestation.recordAttestation({ agentId: params.agentId, attesterId: params.attesterId, score: params.score, metadata: params.metadata, topicId: params.taskId! });

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
