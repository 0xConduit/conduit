import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createTask, getTask, dispatchTask, completeTask } from "../../services/task.service.js";

export function registerTaskTools(server: McpServer) {
  server.tool(
    "create_task",
    "Create a new task in the Conduit network. Optionally lock escrow funds.",
    {
      title: z.string().describe("Task title"),
      description: z.string().optional().describe("Detailed task description"),
      requirements: z.array(z.string()).describe("Required capabilities to complete this task"),
      requesterAgentId: z.string().describe("ID of the agent requesting the task"),
      escrowAmount: z.number().optional().describe("Amount to lock in escrow for payment"),
    },
    async (params) => {
      const task = createTask({
        title: params.title,
        description: params.description,
        requirements: params.requirements,
        requesterAgentId: params.requesterAgentId,
        escrowAmount: params.escrowAmount,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );

  server.tool(
    "dispatch_task",
    "Assign a pending task to a specific agent. Creates connection, sets agent to processing, logs activity.",
    {
      taskId: z.string().describe("ID of the task to dispatch"),
      agentId: z.string().describe("ID of the agent to assign the task to"),
    },
    async (params) => {
      const task = dispatchTask({
        taskId: params.taskId,
        agentId: params.agentId,
      });
      if (!task) {
        return {
          content: [{ type: "text", text: `Failed to dispatch task "${params.taskId}". It may not exist or may not be in 'pending' status.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );

  server.tool(
    "complete_task",
    "Mark a dispatched task as completed. Optionally record attestation and release escrow.",
    {
      taskId: z.string().describe("ID of the task to complete"),
      result: z.string().optional().describe("Result or output of the completed task"),
      attestationScore: z.number().min(0).max(1).optional().describe("Quality score (0.0-1.0) to attest for the assigned agent"),
    },
    async (params) => {
      const task = await completeTask({
        taskId: params.taskId,
        result: params.result,
        attestationScore: params.attestationScore,
      });
      if (!task) {
        return {
          content: [{ type: "text", text: `Failed to complete task "${params.taskId}". It may not exist or may not be in 'dispatched' status.` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );

  server.tool(
    "get_task",
    "Get details of a specific task by ID",
    {
      taskId: z.string().describe("The task ID to look up"),
    },
    async (params) => {
      const task = getTask(params.taskId);
      if (!task) {
        return {
          content: [{ type: "text", text: `Task "${params.taskId}" not found` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );
}
