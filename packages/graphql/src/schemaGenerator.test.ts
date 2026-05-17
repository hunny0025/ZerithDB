import { describe, expect, it } from "vitest";
import { buildSchema } from "graphql";
import { generateSchema } from "./schemaGenerator.js";
import type { CollectionSchema } from "./types.js";

const todosSchema: CollectionSchema = {
  name: "todos",
  fields: [
    { name: "id", type: "ID", required: true },
    { name: "text", type: "String", required: true },
    { name: "done", type: "Boolean", required: false },
  ],
};

describe("generateSchema", () => {
  it("generates type, input, and mutation blocks for a collection", () => {
    const sdl = generateSchema([todosSchema]);

    expect(sdl).toContain("type Todo {");
    expect(sdl).toContain("id: ID!");
    expect(sdl).toContain("text: String!");
    expect(sdl).toContain("done: Boolean");

    expect(sdl).toContain("input TodoInput {");
    expect(sdl).toContain("text: String!");
    expect(sdl).not.toContain("input TodoInput {\n  id:");

    expect(sdl).toContain("insertTodo(input: TodoInput!): Todo");
    expect(sdl).toContain("updateTodo(id: ID!, input: TodoInput!): Todo");
    expect(sdl).toContain("deleteTodo(id: ID!): Boolean");
  });

  it("produces valid GraphQL SDL", () => {
    const sdl = generateSchema([todosSchema]);
    expect(() => buildSchema(sdl)).not.toThrow();
  });

  it("supports multiple collections", () => {
    const usersSchema: CollectionSchema = {
      name: "users",
      fields: [
        { name: "id", type: "ID", required: true },
        { name: "name", type: "String", required: true },
      ],
    };

    const sdl = generateSchema([todosSchema, usersSchema]);
    expect(sdl).toContain("insertTodo");
    expect(sdl).toContain("insertUser");
    expect(sdl).toContain("type User {");
  });
});
