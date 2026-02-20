import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerRegistryTools } from "./tools/registry.tools.js";
import { registerTaskTools } from "./tools/task.tools.js";
import { registerReputationTools } from "./tools/reputation.tools.js";
import { registerPaymentTools } from "./tools/payment.tools.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "conduit",
    version: "0.1.0",
  });

  // Register all tool groups
  registerRegistryTools(server);
  registerTaskTools(server);
  registerReputationTools(server);
  registerPaymentTools(server);

  return server;
}

export async function startMcpServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp] Conduit MCP server running on stdio");
}
