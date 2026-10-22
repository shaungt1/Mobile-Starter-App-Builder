import { desc, eq } from "drizzle-orm";

import { database } from "@/data/database";
import { appItems } from "@/data/schema";
import type { AppItem } from "@/data/schema";

export interface ItemRepository {
  list(): Promise<AppItem[]>;
  add(title: string): Promise<AppItem>;
  toggle(id: string, completed: boolean): Promise<void>;
}

export const localItemRepository: ItemRepository = {
  async list() {
    return database.select().from(appItems).orderBy(desc(appItems.createdAt));
  },
  async add(title) {
    const item: AppItem = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date(),
    };
    await database.insert(appItems).values(item);
    return item;
  },
  async toggle(id, completed) {
    await database.update(appItems).set({ completed }).where(eq(appItems.id, id));
  },
};
