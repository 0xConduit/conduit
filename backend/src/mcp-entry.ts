import { seedDatabase } from "./db/seed.js";
import { startMcpServer } from "./mcp/server.js";
import { startGasMonitor } from "./services/gas-monitor.service.js";

// Initialize database and seed
seedDatabase();

// Start gas monitoring service for self-sustaining agents
startGasMonitor();

// Start MCP server on stdio
startMcpServer().catch((err) => {
  console.error("[mcp] Fatal error:", err);
  process.exit(1);
});
