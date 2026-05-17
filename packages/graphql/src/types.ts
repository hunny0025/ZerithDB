/** Supported GraphQL scalar type names for schema fields */
export type GraphQLScalarType = "String" | "Int" | "Float" | "Boolean" | "ID";

export interface FieldDef {
  name: string;
  type: GraphQLScalarType;
  required?: boolean;
}

export interface CollectionSchema {
  /** Collection name passed to `app.db(name)` — e.g. `"todos"` */
  name: string;
  fields: FieldDef[];
}

/** Minimal ZerithDB app surface required by GraphQL resolvers */
export interface ZerithGraphQLApp {
  db(name: string): ZerithGraphQLCollection;
}

export interface ZerithGraphQLCollection {
  insert(document: Record<string, unknown>): Promise<{ id: string }>;
  update(
    filter: Record<string, unknown>,
    spec: { $set?: Record<string, unknown> }
  ): Promise<number>;
  delete(filter: Record<string, unknown>): Promise<number>;
  findById(id: string): Promise<Record<string, unknown> | undefined>;
}

type GraphQLResolverFn = (
  parent: unknown,
  args: Record<string, unknown>
) => Promise<Record<string, unknown> | boolean> | Record<string, unknown> | boolean;

export interface ZerithGraphQLResult {
  typeDefs: string;
  resolvers: {
    Query: Record<string, GraphQLResolverFn>;
    Mutation: Record<string, GraphQLResolverFn>;
  };
}
