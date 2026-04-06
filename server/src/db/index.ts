import { mkdirSync } from "fs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema.js";

// Ensure data directory exists
mkdirSync("./data", { recursive: true });

const sqlite = new Database("./data/tasks.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Auto-run migrations on startup
migrate(db, { migrationsFolder: "./drizzle" });
