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

export async function completeTask(params: {
  taskId: string;
  result?: string;
  attestationScore?: number;
}): Promise<Task | null> {
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

  // Release escrow if exists (this will trigger Base revenue settlement)
  const escrow = getEscrowByTaskId(params.taskId);
  if (escrow && escrow.status === "locked") {
    await releaseEscrow(escrow.id);

    const conn = findConnection(task.requesterAgentId, task.assignedAgentId);
    recordActivity({
      message: `[SETTLEMENT] ${escrow.amount} USDC settled: ${task.requesterAgentId} → ${task.assignedAgentId}${escrow.chainTxHash ? ` (Base tx: ${escrow.chainTxHash})` : ""}`,
      type: "payment",
      connectionId: conn?.id,
      taskId: params.taskId,
    });
  }

  return getTask(params.taskId);
}
