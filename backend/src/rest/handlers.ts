import { listAgents, getAgent, registerAgent, getAgentEncryptedKey, getAgentWalletAddress } from "../services/agent.service.js";
import { listConnections } from "../services/connection.service.js";
import { computeVitals } from "../services/vitals.service.js";
import { listActivity } from "../services/activity.service.js";
import { listTasks, getTask, createTask, dispatchTask, completeTask } from "../services/task.service.js";
import {
  fundAgentWallet,
  conduitRegisterAgent,
  conduitDeregister,
  conduitUpdateName,
  conduitUpdateChain,
  conduitUpdatePrice,
  conduitUpdateAbilities,
  conduitRentAgent,
  conduitAcceptJob,
  conduitRejectJob,
  conduitCompleteJob,
  conduitRefundJob,
  conduitCreateTask,
  conduitCompleteTask,
  conduitGetAgent,
} from "../chains/conduit.service.js";
import { getDb } from "../db/connection.js";
import type { DeployedChain, AgentRole } from "../shared/types.js";

type Handler = (req: Request, params: Record<string, string>) => Response | Promise<Response>;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const handlers: Record<string, Handler> = {
  // ── GET ──────────────────────────────────────────────────────────────────
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

  // ── POST /api/agents ─────────────────────────────────────────────────────
  "POST /api/agents": async (req) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const validRoles: AgentRole[] = ["router", "executor", "settler"];
    if (!body.role || !validRoles.includes(body.role as AgentRole)) {
      return json({ error: "role must be one of: router, executor, settler" }, 400);
    }

    // Check for duplicate id
    if (body.id && getAgent(body.id as string)) {
      return json({ error: "Agent already exists" }, 409);
    }

    const validChains: DeployedChain[] = ["base", "hedera", "zerog", "0g"];
    const deployedChain: DeployedChain = validChains.includes(body.deployedChain as DeployedChain)
      ? (body.deployedChain as DeployedChain)
      : "base";

    const capabilities = Array.isArray(body.capabilities) ? body.capabilities as string[] : [];

    const agent = await registerAgent({
      id: body.id as string | undefined,
      role: body.role as AgentRole,
      capabilities,
      deployedChain,
      conduitName: body.conduitName as string | undefined,
      conduitPrice: body.conduitPrice as string | undefined,
      conduitAbilities: body.conduitAbilities as string | undefined,
    });

    return json(agent, 201);
  },

  // ── POST /api/tasks ──────────────────────────────────────────────────────
  "POST /api/tasks": (req) => {
    return (async () => {
      let body: Record<string, unknown>;
      try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

      if (!body.title || typeof body.title !== "string") {
        return json({ error: "title is required" }, 400);
      }
      if (!body.requesterAgentId) {
        return json({ error: "requesterAgentId is required" }, 400);
      }

      const requester = getAgent(body.requesterAgentId as string);
      if (!requester) {
        return json({ error: "Requester agent not found" }, 404);
      }

      const escrowAmount = typeof body.escrowAmount === "number" ? body.escrowAmount : undefined;
      if (escrowAmount !== undefined && escrowAmount > 0 && requester.settlementBalance < escrowAmount) {
        return json({
          error: `Insufficient balance: has ${requester.settlementBalance}, needs ${escrowAmount}`,
        }, 400);
      }

      const task = createTask({
        title: body.title as string,
        description: body.description as string | undefined,
        requirements: Array.isArray(body.requirements) ? body.requirements as string[] : [],
        requesterAgentId: body.requesterAgentId as string,
        escrowAmount,
      });

      return json(task, 201);
    })();
  },

  // ── POST /api/tasks/:id/dispatch ─────────────────────────────────────────
  "POST /api/tasks/:id/dispatch": (req, params) => {
    return (async () => {
      let body: Record<string, unknown>;
      try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

      if (!body.agentId) {
        return json({ error: "agentId is required" }, 400);
      }

      const task = dispatchTask({ taskId: params.id, agentId: body.agentId as string });
      if (!task) {
        return json({ error: "Task not found, not pending, or agent not found" }, 400);
      }

      return json(task, 200);
    })();
  },

  // ── POST /api/tasks/:id/complete ─────────────────────────────────────────
  "POST /api/tasks/:id/complete": (req, params) => {
    return (async () => {
      let body: Record<string, unknown>;
      try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

      if (body.attestationScore !== undefined) {
        const score = body.attestationScore as number;
        if (typeof score !== "number" || score < 0 || score > 1) {
          return json({ error: "attestationScore must be a number between 0 and 1" }, 400);
        }
      }

      const task = completeTask({
        taskId: params.id,
        result: body.result as string | undefined,
        attestationScore: body.attestationScore as number | undefined,
      });
      if (!task) {
        return json({ error: "Task not found or not in dispatched state" }, 400);
      }

      return json(task, 200);
    })();
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ── Contract Endpoints ─────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // GET on-chain agent state
  "GET /api/agents/:id/contract": async (_req, params) => {
    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);
    if (!agent.walletAddress) return json({ error: "Agent has no wallet" }, 400);

    const onChain = await conduitGetAgent(agent.walletAddress);
    return json({ walletAddress: agent.walletAddress, conduitRegistered: agent.conduitRegistered, ...onChain });
  },

  // Register agent on Conduit contract
  "POST /api/agents/:id/contract/register": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    const name = body.name as string;
    if (!name) return json({ error: "name is required" }, 400);

    const result = await conduitRegisterAgent({
      agentId: params.id,
      encryptedPrivateKey: encryptedKey,
      name,
      chain: (body.chain as string) ?? agent.deployedChain,
      pricePerMinute: (body.pricePerMinute as string) ?? "0",
      abilitiesMask: (body.abilitiesMask as string) ?? "0",
    });

    if (result.txHash !== "0x0") {
      const db = getDb();
      db.prepare("UPDATE agents SET conduit_registered = 1, conduit_tx_hash = ? WHERE id = ?")
        .run(result.txHash, params.id);
    }

    return json({ txHash: result.txHash });
  },

  // Deregister from contract
  "POST /api/agents/:id/contract/deregister": async (_req, params) => {
    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    const result = await conduitDeregister({ agentId: params.id, encryptedPrivateKey: encryptedKey });

    if (result.txHash !== "0x0") {
      const db = getDb();
      db.prepare("UPDATE agents SET conduit_registered = 0 WHERE id = ?").run(params.id);
    }

    return json({ txHash: result.txHash });
  },

  // Update on-chain agent properties
  "POST /api/agents/:id/contract/update": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    const results: { field: string; txHash: string }[] = [];

    if (body.name) {
      const r = await conduitUpdateName({ agentId: params.id, encryptedPrivateKey: encryptedKey, name: body.name as string });
      results.push({ field: "name", txHash: r.txHash });
    }
    if (body.chain) {
      const r = await conduitUpdateChain({ agentId: params.id, encryptedPrivateKey: encryptedKey, chain: body.chain as string });
      results.push({ field: "chain", txHash: r.txHash });
    }
    if (body.pricePerMinute) {
      const r = await conduitUpdatePrice({ agentId: params.id, encryptedPrivateKey: encryptedKey, pricePerMinute: body.pricePerMinute as string });
      results.push({ field: "pricePerMinute", txHash: r.txHash });
    }
    if (body.abilitiesMask) {
      const r = await conduitUpdateAbilities({ agentId: params.id, encryptedPrivateKey: encryptedKey, abilitiesMask: body.abilitiesMask as string });
      results.push({ field: "abilitiesMask", txHash: r.txHash });
    }

    return json({ updates: results });
  },

  // Rent another agent
  "POST /api/agents/:id/contract/rent": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    // Resolve target agent's wallet address
    const targetAgentId = body.targetAgentId as string;
    let targetAddress = body.targetAddress as string | undefined;
    if (!targetAddress && targetAgentId) {
      targetAddress = getAgentWalletAddress(targetAgentId) ?? undefined;
    }
    if (!targetAddress) return json({ error: "Target agent wallet address not found" }, 400);

    const result = await conduitRentAgent({
      agentId: params.id,
      encryptedPrivateKey: encryptedKey,
      targetAddress,
      minutes: (body.minutes as number) ?? 1,
      valueEth: (body.valueEth as string) ?? "0",
    });

    return json({ txHash: result.txHash, jobId: result.jobId });
  },

  // Accept a job
  "POST /api/agents/:id/contract/accept-job": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    if (body.jobId === undefined) return json({ error: "jobId is required" }, 400);

    const result = await conduitAcceptJob({
      agentId: params.id,
      encryptedPrivateKey: encryptedKey,
      jobId: body.jobId as number,
    });

    return json({ txHash: result.txHash });
  },

  // Reject a job
  "POST /api/agents/:id/contract/reject-job": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    if (body.jobId === undefined) return json({ error: "jobId is required" }, 400);

    const result = await conduitRejectJob({
      agentId: params.id,
      encryptedPrivateKey: encryptedKey,
      jobId: body.jobId as number,
    });

    return json({ txHash: result.txHash });
  },

  // Complete a job
  "POST /api/agents/:id/contract/complete-job": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    if (body.jobId === undefined) return json({ error: "jobId is required" }, 400);

    const result = await conduitCompleteJob({
      agentId: params.id,
      encryptedPrivateKey: encryptedKey,
      jobId: body.jobId as number,
      attestation: (body.attestation as string) ?? "",
    });

    return json({ txHash: result.txHash });
  },

  // Refund a job
  "POST /api/agents/:id/contract/refund-job": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    if (body.jobId === undefined) return json({ error: "jobId is required" }, 400);

    const result = await conduitRefundJob({
      agentId: params.id,
      encryptedPrivateKey: encryptedKey,
      jobId: body.jobId as number,
    });

    return json({ txHash: result.txHash });
  },

  // Create on-chain task
  "POST /api/agents/:id/contract/create-task": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    // Resolve assignee agent's wallet address
    const assigneeAgentId = body.assigneeAgentId as string;
    let assigneeAddress = body.assigneeAddress as string | undefined;
    if (!assigneeAddress && assigneeAgentId) {
      assigneeAddress = getAgentWalletAddress(assigneeAgentId) ?? undefined;
    }
    if (!assigneeAddress) return json({ error: "Assignee agent wallet address not found" }, 400);

    const result = await conduitCreateTask({
      agentId: params.id,
      encryptedPrivateKey: encryptedKey,
      assigneeAddress,
      paymentEth: (body.paymentEth as string) ?? "0",
    });

    return json({ txHash: result.txHash, taskId: result.taskId });
  },

  // Complete on-chain task
  "POST /api/agents/:id/contract/complete-task": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    if (body.taskId === undefined) return json({ error: "taskId is required" }, 400);

    const result = await conduitCompleteTask({
      agentId: params.id,
      encryptedPrivateKey: encryptedKey,
      taskId: body.taskId as number,
      reputationDelta: (body.reputationDelta as number) ?? 0,
    });

    return json({ txHash: result.txHash });
  },

  // Fund agent wallet with gas
  "POST /api/agents/:id/fund": async (req, params) => {
    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);
    if (!agent.walletAddress) return json({ error: "Agent has no wallet" }, 400);

    let amountEth = "0.01";
    try {
      const body = await req.json() as Record<string, unknown>;
      if (body.amountEth) amountEth = body.amountEth as string;
    } catch { /* use default */ }

    const result = await fundAgentWallet(agent.walletAddress, amountEth);
    return json({ txHash: result.txHash });
  },
};
