import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "./schema";

const sqlite = openDatabaseSync("launchpad.db");

sqlite.execSync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS app_items (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS app_items_created_at_idx ON app_items (created_at DESC);
`);

export const database = drizzle(sqlite, { schema });
