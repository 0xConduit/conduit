import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAgent, getAgentWalletAddress, getAgentEncryptedKey } from "../../services/agent.service.js";
import {
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

  server.tool(
    "contract_get_all_agents",
    "Get all registered agents from the Conduit contract with their on-chain profiles (address, name, chain, price, reputation, abilities)",
    {},
    async () => {
      const agents = await conduitGetAllAgents();
      return {
        content: [{ type: "text", text: JSON.stringify({ count: agents.length, agents }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_get_agent_count",
    "Get the total number of registered agents on the Conduit contract",
    {},
    async () => {
      const count = await conduitGetAgentCount();
      return {
        content: [{ type: "text", text: JSON.stringify({ count }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_get_open_jobs",
    "Get all open/pending jobs for an agent (not yet accepted, rejected, or completed)",
    {
      agentId: z.string().describe("The system agent ID to look up open jobs for"),
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
      const jobs = await conduitGetOpenJobs(walletAddress);
      return {
        content: [{ type: "text", text: JSON.stringify({ agentId: params.agentId, walletAddress, openJobs: jobs }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_pause_agent",
    "Pause an agent on the Conduit contract. Paused agents cannot be rented.",
    {
      agentId: z.string().describe("The system agent ID to pause"),
    },
    async (params) => {
      const agent = getAgent(params.agentId);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" not found` }],
          isError: true,
        };
      }
      const encryptedKey = getAgentEncryptedKey(params.agentId);
      if (!encryptedKey) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" has no wallet` }],
          isError: true,
        };
      }
      const result = await conduitPause({ agentId: params.agentId, encryptedPrivateKey: encryptedKey });
      return {
        content: [{ type: "text", text: JSON.stringify({ agentId: params.agentId, txHash: result.txHash }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_unpause_agent",
    "Unpause an agent on the Conduit contract. Restores the agent's ability to be rented.",
    {
      agentId: z.string().describe("The system agent ID to unpause"),
    },
    async (params) => {
      const agent = getAgent(params.agentId);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" not found` }],
          isError: true,
        };
      }
      const encryptedKey = getAgentEncryptedKey(params.agentId);
      if (!encryptedKey) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" has no wallet` }],
          isError: true,
        };
      }
      const result = await conduitUnpause({ agentId: params.agentId, encryptedPrivateKey: encryptedKey });
      return {
        content: [{ type: "text", text: JSON.stringify({ agentId: params.agentId, txHash: result.txHash }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_get_all_active_agents",
    "Get all active (non-paused) agents from the Conduit contract",
    {},
    async () => {
      const agents = await conduitGetAllActiveAgents();
      return {
        content: [{ type: "text", text: JSON.stringify({ count: agents.length, agents }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_add_ability",
    "Add a single ability (0-255) to an agent's abilities bitmask on the Conduit contract",
    {
      agentId: z.string().describe("The system agent ID"),
      ability: z.number().int().min(0).max(255).describe("The ability index to add (0-255)"),
    },
    async (params) => {
      const agent = getAgent(params.agentId);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" not found` }],
          isError: true,
        };
      }
      const encryptedKey = getAgentEncryptedKey(params.agentId);
      if (!encryptedKey) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" has no wallet` }],
          isError: true,
        };
      }
      const result = await conduitAddAbility({ agentId: params.agentId, encryptedPrivateKey: encryptedKey, ability: params.ability });
      return {
        content: [{ type: "text", text: JSON.stringify({ agentId: params.agentId, ability: params.ability, txHash: result.txHash }, null, 2) }],
      };
    }
  );

  server.tool(
    "contract_remove_ability",
    "Remove a single ability (0-255) from an agent's abilities bitmask on the Conduit contract",
    {
      agentId: z.string().describe("The system agent ID"),
      ability: z.number().int().min(0).max(255).describe("The ability index to remove (0-255)"),
    },
    async (params) => {
      const agent = getAgent(params.agentId);
      if (!agent) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" not found` }],
          isError: true,
        };
      }
      const encryptedKey = getAgentEncryptedKey(params.agentId);
      if (!encryptedKey) {
        return {
          content: [{ type: "text", text: `Agent "${params.agentId}" has no wallet` }],
          isError: true,
        };
      }
      const result = await conduitRemoveAbility({ agentId: params.agentId, encryptedPrivateKey: encryptedKey, ability: params.ability });
      return {
        content: [{ type: "text", text: JSON.stringify({ agentId: params.agentId, ability: params.ability, txHash: result.txHash }, null, 2) }],
      };
    }
  );
}
