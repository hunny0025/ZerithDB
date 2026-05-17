import { toTypeName } from "./schemaGenerator.js";
import type { CollectionSchema, ZerithGraphQLApp } from "./types.js";

function toGraphQLDocument(
  doc: Record<string, unknown>,
  schema: CollectionSchema
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of schema.fields) {
    if (field.name === "id") {
      result.id = doc._id ?? doc.id;
    } else {
      result[field.name] = doc[field.name];
    }
  }

  return result;
}

function inputToDocument(
  input: Record<string, unknown>,
  schema: CollectionSchema
): Record<string, unknown> {
  const doc: Record<string, unknown> = {};

  for (const field of schema.fields) {
    if (field.name === "id") continue;
    if (field.name in input) {
      doc[field.name] = input[field.name];
    }
  }

  return doc;
}

/**
 * Builds GraphQL mutation resolvers that delegate to ZerithDB collection methods.
 */
export function generateResolvers(
  schemas: CollectionSchema[],
  app: ZerithGraphQLApp
): {
  Query: Record<string, () => boolean>;
  Mutation: Record<
    string,
    (parent: unknown, args: Record<string, unknown>) => Promise<Record<string, unknown> | boolean>
  >;
} {
  const mutations: Record<
    string,
    (parent: unknown, args: Record<string, unknown>) => Promise<Record<string, unknown> | boolean>
  > = {};

  for (const schema of schemas) {
    const typeName = toTypeName(schema.name);
    const collection = () => app.db(schema.name);

    mutations[`insert${typeName}`] = async (_parent, { input }) => {
      const payload = inputToDocument(input as Record<string, unknown>, schema);
      const { id } = await collection().insert(payload);
      const doc = await collection().findById(id);
      if (!doc) {
        throw new Error(`Failed to load document after insert in "${schema.name}"`);
      }
      return toGraphQLDocument(doc, schema);
    };

    mutations[`update${typeName}`] = async (_parent, { id, input }) => {
      const payload = inputToDocument(input as Record<string, unknown>, schema);
      await collection().update({ _id: id }, { $set: payload });
      const doc = await collection().findById(id as string);
      if (!doc) {
        throw new Error(`Document "${id}" not found in "${schema.name}"`);
      }
      return toGraphQLDocument(doc, schema);
    };

    mutations[`delete${typeName}`] = async (_parent, { id }) => {
      await collection().delete({ _id: id });
      return true;
    };
  }

  return {
    Query: {
      _zerith: () => true,
    },
    Mutation: mutations,
  };
}
