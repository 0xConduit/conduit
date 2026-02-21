import { getDb } from "../db/connection.js";
import type { Escrow } from "../shared/types.js";
import { updateAgentBalance } from "./agent.service.js";
import { hederaEscrow } from "../chains/hedera.stub.js";

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
}): Escrow {
  const db = getDb();
  const id = `escrow-${generateId()}`;
  const now = Date.now();

  // Deduct from payer's balance
  updateAgentBalance(params.payerAgentId, -params.amount);

  const txHash = hederaEscrow.lockFunds({ taskId: params.taskId, payerAgentId: params.payerAgentId, amount: params.amount });

  db.prepare(
    "INSERT INTO escrows (id, task_id, payer_agent_id, payee_agent_id, amount, status, chain, chain_tx_hash, created_at) VALUES (?, ?, ?, ?, ?, 'locked', ?, ?, ?)"
  ).run(id, params.taskId, params.payerAgentId, params.payeeAgentId ?? null, params.amount, "hedera", txHash.toString(), now);

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

  hederaEscrow.releaseFunds({ escrowId: escrowId, payeeAgentId: escrow.payeeAgentId!, amount: escrow.amount });

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
  hederaEscrow.refundFunds({ escrowId: escrowId, payerAgentId: escrow.payerAgentId, amount: escrow.amount });
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
