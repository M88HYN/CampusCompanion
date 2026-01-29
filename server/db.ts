import "dotenv/config";
import { initializeDatabase, getDatabase, closeDatabase } from "./db-sqlite";

// Initialize database on first import
let dbInstance: any = null;

function initDb() {
  if (!dbInstance) {
    dbInstance = initializeDatabase();
  }
  return dbInstance;
}

// Export database instance - initialized immediately
const database = initDb();
export const db = database;

export { closeDatabase };
export function getDb() {
  return dbInstance || initDb();
}

