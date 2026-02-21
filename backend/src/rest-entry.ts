import { seedDatabase } from "./db/seed.js";
import { startRestServer } from "./rest/server.js";
import { startGasMonitor } from "./services/gas-monitor.service.js";

// Initialize database and seed
seedDatabase();

// Start gas monitoring service for self-sustaining agents
startGasMonitor();

// Start REST server
startRestServer();
