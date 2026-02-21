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
  conduitRateJob,
  conduitGetAgent,
  conduitGetJob,
  conduitGetJobCount,
  conduitGetBalance,
  conduitGetContractBalance,
  conduitQueryEvents,
  conduitGetJobsForAgent,
  conduitGetAllAgents,
  conduitGetAgentCount,
  conduitGetOpenJobs,
  conduitPause,
  conduitUnpause,
  conduitGetAllActiveAgents,
  conduitAddAbility,
  conduitRemoveAbility,
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

      const task = await completeTask({
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

  // Rate a completed job
  "POST /api/agents/:id/contract/rate-job": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    if (body.jobId === undefined) return json({ error: "jobId is required" }, 400);
    if (body.rating === undefined) return json({ error: "rating is required (-10 to 10)" }, 400);

    const rating = body.rating as number;
    if (rating < -10 || rating > 10) return json({ error: "rating must be between -10 and 10" }, 400);

    const result = await conduitRateJob({
      agentId: params.id,
      encryptedPrivateKey: encryptedKey,
      jobId: body.jobId as number,
      rating,
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

  // ══════════════════════════════════════════════════════════════════════════
  // ── Contract Read Endpoints ───────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  // Get total job count (+ optional ?recent=true&limit=N for recent jobs)
  "GET /api/contract/jobs": async (req) => {
    const url = new URL(req.url);
    const recent = url.searchParams.get("recent") === "true";
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const count = await conduitGetJobCount();
    if (!recent) return json({ count });

    // Fetch the most recent jobs by reading backwards from count
    const jobs = [];
    for (let i = count - 1; i >= Math.max(0, count - limit); i--) {
      const job = await conduitGetJob(i);
      if (job) jobs.push(job);
    }
    return json({ count, jobs });
  },

  // Get a specific job by ID
  "GET /api/contract/jobs/:jobId": async (_req, params) => {
    const jobId = parseInt(params.jobId, 10);
    if (isNaN(jobId)) return json({ error: "Invalid jobId" }, 400);

    const job = await conduitGetJob(jobId);
    if (!job) return json({ error: "Job not found" }, 404);
    return json(job);
  },

  // Get contract's held ETH balance
  "GET /api/contract/balance": async () => {
    const balance = await conduitGetContractBalance();
    return json({ balance });
  },

  // Get ETH balance for any address
  "GET /api/contract/balance/:address": async (_req, params) => {
    const balance = await conduitGetBalance(params.address);
    return json({ address: params.address, balance });
  },

  // Query contract events with filters
  "GET /api/contract/events": async (req) => {
    const url = new URL(req.url);
    const events = await conduitQueryEvents({
      eventType: url.searchParams.get("type") ?? undefined,
      agentAddress: url.searchParams.get("agent") ?? undefined,
      jobId: url.searchParams.has("jobId") ? parseInt(url.searchParams.get("jobId")!, 10) : undefined,
      fromBlock: url.searchParams.has("fromBlock") ? parseInt(url.searchParams.get("fromBlock")!, 10) : undefined,
      limit: url.searchParams.has("limit") ? parseInt(url.searchParams.get("limit")!, 10) : undefined,
    });
    return json({ events });
  },

  // Get all on-chain jobs for an agent
  "GET /api/agents/:id/contract/jobs": async (_req, params) => {
    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);
    if (!agent.walletAddress) return json({ error: "Agent has no wallet" }, 400);

    const jobs = await conduitGetJobsForAgent(agent.walletAddress);
    return json({ jobs });
  },

  // Get ETH balance for an agent's wallet
  "GET /api/agents/:id/contract/balance": async (_req, params) => {
    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);
    if (!agent.walletAddress) return json({ error: "Agent has no wallet" }, 400);

    const balance = await conduitGetBalance(agent.walletAddress);
    return json({ walletAddress: agent.walletAddress, balance });
  },

  // Get open/pending jobs for an agent
  "GET /api/agents/:id/contract/open-jobs": async (_req, params) => {
    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);
    if (!agent.walletAddress) return json({ error: "Agent has no wallet" }, 400);

    const jobs = await conduitGetOpenJobs(agent.walletAddress);
    return json({ jobs });
  },

  // Get all on-chain registered agents
  "GET /api/contract/agents": async () => {
    const agents = await conduitGetAllAgents();
    return json({ agents, count: agents.length });
  },

  // Get on-chain agent count
  "GET /api/contract/agents/count": async () => {
    const count = await conduitGetAgentCount();
    return json({ count });
  },

  // Get all active (non-paused) on-chain agents
  "GET /api/contract/agents/active": async () => {
    const agents = await conduitGetAllActiveAgents();
    return json({ agents, count: agents.length });
  },

  // Pause agent on Conduit contract
  "POST /api/agents/:id/contract/pause": async (_req, params) => {
    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    const result = await conduitPause({ agentId: params.id, encryptedPrivateKey: encryptedKey });
    return json({ txHash: result.txHash });
  },

  // Add a single ability to agent on Conduit contract
  "POST /api/agents/:id/contract/add-ability": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    if (body.ability === undefined) return json({ error: "ability is required (0-255)" }, 400);
    const ability = body.ability as number;
    if (typeof ability !== "number" || ability < 0 || ability > 255) return json({ error: "ability must be 0-255" }, 400);

    const result = await conduitAddAbility({ agentId: params.id, encryptedPrivateKey: encryptedKey, ability });
    return json({ txHash: result.txHash });
  },

  // Remove a single ability from agent on Conduit contract
  "POST /api/agents/:id/contract/remove-ability": async (req, params) => {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    if (body.ability === undefined) return json({ error: "ability is required (0-255)" }, 400);
    const ability = body.ability as number;
    if (typeof ability !== "number" || ability < 0 || ability > 255) return json({ error: "ability must be 0-255" }, 400);

    const result = await conduitRemoveAbility({ agentId: params.id, encryptedPrivateKey: encryptedKey, ability });
    return json({ txHash: result.txHash });
  },

  // Unpause agent on Conduit contract
  "POST /api/agents/:id/contract/unpause": async (_req, params) => {
    const agent = getAgent(params.id);
    if (!agent) return json({ error: "Agent not found" }, 404);

    const encryptedKey = getAgentEncryptedKey(params.id);
    if (!encryptedKey) return json({ error: "Agent has no wallet" }, 400);

    const result = await conduitUnpause({ agentId: params.id, encryptedPrivateKey: encryptedKey });
    return json({ txHash: result.txHash });
  },
};
