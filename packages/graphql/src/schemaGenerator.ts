import type { CollectionSchema, FieldDef } from "./types.js";

function toTypeName(collectionName: string): string {
  const singular = collectionName.endsWith("s") ? collectionName.slice(0, -1) : collectionName;
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

function fieldType(field: FieldDef): string {
  const base = field.type;
  return field.required ? `${base}!` : base;
}

function renderObjectType(typeName: string, fields: FieldDef[]): string {
  const lines = fields.map((f) => `  ${f.name}: ${fieldType(f)}`);
  return `type ${typeName} {\n${lines.join("\n")}\n}`;
}

function renderInputType(typeName: string, fields: FieldDef[]): string {
  const inputFields = fields.filter((f) => f.name !== "id");
  const lines = inputFields.map((f) => {
    const required = f.required && f.name !== "id";
    const suffix = required ? "!" : "";
    return `  ${f.name}: ${f.type}${suffix}`;
  });
  return `input ${typeName} {\n${lines.join("\n")}\n}`;
}

function renderMutationBlock(schemas: CollectionSchema[]): string {
  const entries = schemas.flatMap((schema) => {
    const typeName = toTypeName(schema.name);
    return [
      `  insert${typeName}(input: ${typeName}Input!): ${typeName}`,
      `  update${typeName}(id: ID!, input: ${typeName}Input!): ${typeName}`,
      `  delete${typeName}(id: ID!): Boolean`,
    ];
  });

  return `type Mutation {\n${entries.join("\n")}\n}`;
}

/**
 * Generates GraphQL SDL for the given collection schemas.
 * Each collection yields a type, input type, and insert/update/delete mutations.
 */
export function generateSchema(schemas: CollectionSchema[]): string {
  const blocks: string[] = [];

  for (const schema of schemas) {
    const typeName = toTypeName(schema.name);
    blocks.push(renderObjectType(typeName, schema.fields));
    blocks.push(renderInputType(`${typeName}Input`, schema.fields));
  }

  blocks.push(renderMutationBlock(schemas));
  blocks.push("type Query {\n  _zerith: Boolean\n}");

  return `${blocks.join("\n\n")}\n`;
}

export { toTypeName };
