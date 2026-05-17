import { describe, expect, it, vi } from "vitest";
import { createZerithGraphQL } from "./index.js";
import type { CollectionSchema, ZerithGraphQLApp } from "./types.js";

const todosSchema: CollectionSchema = {
  name: "todos",
  fields: [
    { name: "id", type: "ID", required: true },
    { name: "text", type: "String", required: true },
    { name: "done", type: "Boolean", required: false },
  ],
};

function createMockApp() {
  const store = new Map<string, Record<string, unknown>>();

  const todos = {
    insert: vi.fn(async (doc: Record<string, unknown>) => {
      const id = "todo-1";
      store.set(id, { _id: id, ...doc, _createdAt: 1, _updatedAt: 1 });
      return { id };
    }),
    update: vi.fn(
      async (filter: Record<string, unknown>, spec: { $set?: Record<string, unknown> }) => {
        const id = filter._id as string;
        const existing = store.get(id);
        if (!existing) return 0;
        store.set(id, { ...existing, ...spec.$set, _updatedAt: 2 });
        return 1;
      }
    ),
    delete: vi.fn(async (filter: Record<string, unknown>) => {
      const id = filter._id as string;
      return store.delete(id) ? 1 : 0;
    }),
    findById: vi.fn(async (id: string) => store.get(id)),
  };

  const app: ZerithGraphQLApp = {
    db: vi.fn((name: string) => {
      if (name !== "todos") throw new Error(`Unknown collection: ${name}`);
      return todos;
    }),
  };

  return { app, todos, store };
}

describe("generateResolvers / createZerithGraphQL", () => {
  it("insertTodo calls app.db().insert() and returns the document", async () => {
    const { app, todos } = createMockApp();
    const { resolvers } = createZerithGraphQL([todosSchema], app);

    const result = await resolvers.Mutation.insertTodo(null, {
      input: { text: "Buy milk", done: false },
    });

    expect(todos.insert).toHaveBeenCalledWith({ text: "Buy milk", done: false });
    expect(result).toEqual({ id: "todo-1", text: "Buy milk", done: false });
  });

  it("updateTodo calls app.db().update() and returns the updated document", async () => {
    const { app, todos, store } = createMockApp();
    store.set("todo-1", { _id: "todo-1", text: "Buy milk", done: false });

    const { resolvers } = createZerithGraphQL([todosSchema], app);

    const result = await resolvers.Mutation.updateTodo(null, {
      id: "todo-1",
      input: { text: "Buy oat milk", done: true },
    });

    expect(todos.update).toHaveBeenCalledWith(
      { _id: "todo-1" },
      { $set: { text: "Buy oat milk", done: true } }
    );
    expect(result).toEqual({ id: "todo-1", text: "Buy oat milk", done: true });
  });

  it("deleteTodo calls app.db().delete() and returns true", async () => {
    const { app, todos, store } = createMockApp();
    store.set("todo-1", { _id: "todo-1", text: "Buy milk", done: false });

    const { resolvers } = createZerithGraphQL([todosSchema], app);

    const result = await resolvers.Mutation.deleteTodo(null, { id: "todo-1" });

    expect(todos.delete).toHaveBeenCalledWith({ _id: "todo-1" });
    expect(result).toBe(true);
  });
});
