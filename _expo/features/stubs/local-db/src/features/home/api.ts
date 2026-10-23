/**
 * The local-db feature (SQLite + Drizzle) was removed. Items now live in memory for this
 * session only; replace this with your own storage or re-add the feature from the builder.
 */
type AppItem = { id: string; title: string; completed: boolean; createdAt: Date };

const items: AppItem[] = [];

export const itemRepository = {
  async list(): Promise<AppItem[]> {
    return [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },
  async add(title: string): Promise<AppItem> {
    const item = {
      id: `${Date.now()}-${items.length}`,
      title,
      completed: false,
      createdAt: new Date(),
    };
    items.push(item);
    return item;
  },
};
