import { seedDatabase } from "./db/seed.js";
import { startRestServer } from "./rest/server.js";

// Initialize database and seed
seedDatabase();

// Start REST server
startRestServer();
