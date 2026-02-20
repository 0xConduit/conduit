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
