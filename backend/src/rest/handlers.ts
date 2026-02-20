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
