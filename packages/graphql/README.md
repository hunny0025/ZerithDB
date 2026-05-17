# zerithdb-graphql

Auto-generates GraphQL mutation schemas and resolvers from ZerithDB collection definitions. Each
collection gets `insert`, `update`, and `delete` mutations that call `app.db(name).insert()`,
`.update()`, and `.delete()` under the hood.

## Install

```bash
pnpm add zerithdb-graphql graphql
```

`graphql` is a **peer dependency** — install it in your app alongside this package.

## Usage

```typescript
import { buildSchema, graphql } from "graphql";
import { createApp } from "zerithdb-sdk";
import { createZerithGraphQL, type CollectionSchema } from "zerithdb-graphql";

const app = createApp({ appId: "my-app" });

const todosSchema: CollectionSchema = {
  name: "todos",
  fields: [
    { name: "id", type: "ID", required: true },
    { name: "text", type: "String", required: true },
    { name: "done", type: "Boolean", required: false },
  ],
};

const { typeDefs, resolvers } = createZerithGraphQL([todosSchema], app);
const schema = buildSchema(typeDefs);

const result = await graphql({
  schema,
  source: `
    mutation {
      insertTodo(input: { text: "Buy milk", done: false }) {
        id
        text
        done
      }
    }
  `,
  rootValue: {
    Query: resolvers.Query,
    Mutation: resolvers.Mutation,
  },
});

console.log(result.data?.insertTodo);
```

### With Apollo or graphql-tools

Pass `typeDefs` and `resolvers` to `makeExecutableSchema` from `@graphql-tools/schema`:

```typescript
import { makeExecutableSchema } from "@graphql-tools/schema";

const schema = makeExecutableSchema({ typeDefs, resolvers });
```

## Generated schema

For a `todos` collection, `createZerithGraphQL` produces:

```graphql
type Todo {
  id: ID!
  text: String!
  done: Boolean
}

input TodoInput {
  text: String!
  done: Boolean
}

type Mutation {
  insertTodo(input: TodoInput!): Todo
  updateTodo(id: ID!, input: TodoInput!): Todo
  deleteTodo(id: ID!): Boolean
}
```

## API

| Export                              | Description                       |
| ----------------------------------- | --------------------------------- |
| `createZerithGraphQL(schemas, app)` | Returns `{ typeDefs, resolvers }` |
| `generateSchema(schemas)`           | SDL string only                   |
| `generateResolvers(schemas, app)`   | Resolver map only                 |

## Field types

Supported scalars: `String`, `Int`, `Float`, `Boolean`, `ID`.

The `id` field maps to ZerithDB's `_id` internally. It is included on output types but omitted from
input types (assigned on insert).
