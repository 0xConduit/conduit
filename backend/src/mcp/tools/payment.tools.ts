import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createEscrow, getEscrow, releaseEscrow, getAgentPendingEscrows } from "../../services/payment.service.js";
import { getAgent } from "../../services/agent.service.js";

export function registerPaymentTools(server: McpServer) {
  server.tool(
    "escrow_payment",
    "Lock funds in escrow for a task (via Hedera HTS stub). Deducts from payer balance.",
    {
      taskId: z.string().describe("Task ID the escrow is for"),
      payerAgentId: z.string().describe("Agent paying into escrow"),
      payeeAgentId: z.string().optional().describe("Agent who will receive payment on release"),
      amount: z.number().positive().describe("Amount to lock in escrow"),
    },
    async (params) => {
      const escrow = createEscrow({
        taskId: params.taskId,
        payerAgentId: params.payerAgentId,
        payeeAgentId: params.payeeAgentId,
        amount: params.amount,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(escrow, null, 2) }],
      };
    }
  );

  server.tool(
    "settle_payment",
    "Release escrowed funds to the payee agent",
    {
      escrowId: z.string().describe("ID of the escrow to settle/release"),
    },
    async (params) => {
      const escrow = releaseEscrow(params.escrowId);
      if (!escrow) {
        return {
          content: [{ type: "text", text: `Escrow "${params.escrowId}" not found or not in 'locked' status` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(escrow, null, 2) }],
      };
    }
  );

  server.tool(
    "get_balance",
    "Get an agent's settlement balance and pending escrow total",
    {
      agentId: z.string().describe("The agent ID to check balance for"),
    },
    async (params) => {
      const agent = getAgent(params.agentId);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" not found` }],
          isError: true,
        };
      }
      const pendingEscrows = getAgentPendingEscrows(params.agentId);
      const result = {
        agentId: params.agentId,
        settlementBalance: agent.settlementBalance,
        pendingEscrows,
        availableBalance: agent.settlementBalance,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
