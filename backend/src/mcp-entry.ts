import { seedDatabase } from "./db/seed.js";
import { startMcpServer } from "./mcp/server.js";

// Initialize database and seed
seedDatabase();

// Start MCP server on stdio
startMcpServer().catch((err) => {
  console.error("[mcp] Fatal error:", err);
  process.exit(1);
});
