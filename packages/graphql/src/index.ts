import { generateSchema } from "./schemaGenerator.js";
import { generateResolvers } from "./resolvers.js";
import type { CollectionSchema, ZerithGraphQLApp, ZerithGraphQLResult } from "./types.js";

export type {
  CollectionSchema,
  FieldDef,
  GraphQLScalarType,
  ZerithGraphQLApp,
  ZerithGraphQLCollection,
  ZerithGraphQLResult,
} from "./types.js";
export { generateSchema, toTypeName } from "./schemaGenerator.js";
export { generateResolvers } from "./resolvers.js";

/**
 * Generates GraphQL type definitions and mutation resolvers from collection schemas.
 * Plug the result into `makeExecutableSchema` (graphql-tools) or `buildSchema` (graphql).
 */
export function createZerithGraphQL(
  schemas: CollectionSchema[],
  app: ZerithGraphQLApp
): ZerithGraphQLResult {
  return {
    typeDefs: generateSchema(schemas),
    resolvers: generateResolvers(schemas, app),
  };
}
