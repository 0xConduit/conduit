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
