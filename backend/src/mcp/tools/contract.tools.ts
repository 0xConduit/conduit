import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAgent, getAgentWalletAddress } from "../../services/agent.service.js";
import {
  conduitGetAgent,
  conduitGetJob,
  conduitGetJobCount,
  conduitGetBalance,
  conduitGetContractBalance,
  conduitQueryEvents,
  conduitGetJobsForAgent,
} from "../../chains/conduit.service.js";

export function registerContractTools(server: McpServer) {
  server.tool(
    "contract_get_agent",
    "Read an agent's on-chain profile from the Conduit contract by wallet address",
    {
      address: z.string().describe("Ethereum wallet address of the agent"),
    },
    async (params) => {
      const result = await conduitGetAgent(params.address);
      if (!result) {
        return {
          content: [{ type: "text", text: `Failed to read agent at ${params.address}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_get_job",
    "Read job details from the Conduit contract by job ID",
    {
      jobId: z.number().int().min(0).describe("The on-chain job ID"),
    },
    async (params) => {
      const job = await conduitGetJob(params.jobId);
      if (!job) {
        return {
          content: [{ type: "text", text: `Job ${params.jobId} not found` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(job, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_get_job_count",
    "Get the total number of jobs created on the Conduit contract",
    {},
    async () => {
      const count = await conduitGetJobCount();
      return {
        content: [{ type: "text", text: JSON.stringify({ count }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_get_balance",
    "Get the ETH balance of any wallet address on 0G Newton testnet",
    {
      address: z.string().describe("Ethereum wallet address to check balance for"),
    },
    async (params) => {
      const balance = await conduitGetBalance(params.address);
      return {
        content: [{ type: "text", text: JSON.stringify({ address: params.address, balance }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_get_contract_balance",
    "Get the ETH balance held by the Conduit contract (escrowed job payments)",
    {},
    async () => {
      const balance = await conduitGetContractBalance();
      return {
        content: [{ type: "text", text: JSON.stringify({ balance }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_query_events",
    "Query event logs from the Conduit contract with optional filters (event type, agent address, job ID, block range)",
    {
      eventType: z.string().optional().describe("Event name filter: JobCreated, JobAccepted, JobRejected, JobCompleted, JobRefunded, AgentRegistered, AgentUpdated, AgentDeregistered"),
      agentAddress: z.string().optional().describe("Filter events by agent wallet address"),
      jobId: z.number().int().optional().describe("Filter events by job ID"),
      fromBlock: z.number().int().optional().describe("Start block number (default: 0)"),
      limit: z.number().int().optional().describe("Max events to return (default: 100)"),
    },
    async (params) => {
      const events = await conduitQueryEvents({
        eventType: params.eventType,
        agentAddress: params.agentAddress,
        jobId: params.jobId,
        fromBlock: params.fromBlock,
        limit: params.limit,
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ count: events.length, events }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_get_agent_jobs",
    "Get all on-chain jobs for an agent by their system agent ID. Finds the agent's wallet address and queries JobCreated events.",
    {
      agentId: z.string().describe("The system agent ID to look up jobs for"),
    },
    async (params) => {
      const agent = getAgent(params.agentId);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" not found` }],
          isError: true,
        };
      }
      const walletAddress = getAgentWalletAddress(params.agentId);
      if (!walletAddress) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" has no wallet address` }],
          isError: true,
        };
      }
      const jobs = await conduitGetJobsForAgent(walletAddress);
      return {
        content: [{ type: "text", text: JSON.stringify({ agentId: params.agentId, walletAddress, jobs }, null, 2) }],
      };
    }
  );
}
