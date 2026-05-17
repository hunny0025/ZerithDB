export const EXAMPLES = [
  {
    id: "basic",
    title: "Basic Operations",
    code: `const app = createApp({ appId: "demo-app" });

// Insert a document
await app.db("todos").insert({
  text: "Hello ZerithDB",
  done: false
});

// Find the document
const todos = await app.db("todos").find({});

console.log("Todos:", todos);`,
  },
  {
    id: "query",
    title: "Complex Query",
    code: `const app = createApp({ appId: "query-demo" });

await app.db("users").insert([
  { name: "Alice", age: 25, role: "admin" },
  { name: "Bob", age: 30, role: "user" },
  { name: "Charlie", age: 35, role: "user" }
]);

const users = await app.db("users").find({
  age: { $gt: 28 },
  role: "user"
});

console.log("Filtered Users:", users);`,
  },
  {
    id: "update",
    title: "Updating Data",
    code: `const app = createApp({ appId: "update-demo" });

const id = await app.db("profile").insert({
  name: "John Doe",
  email: "john@example.com"
});

await app.db("profile").update(
  { id },
  { $set: { name: "John Updated" } }
);

const profile = await app.db("profile").findOne({ id });
console.log("Updated Profile:", profile);`,
  },
];
