import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appItems = sqliteTable("app_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export type AppItem = typeof appItems.$inferSelect;
export type NewAppItem = typeof appItems.$inferInsert;
