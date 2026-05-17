/**
 * db.js — ZerithDB initialization module.
 *
 * Creates a single ZerithDB app instance and exposes the "todos" collection.
 * Import `todos` anywhere you need to perform CRUD operations.
 */
import { createApp } from "zerithdb-sdk";

// Initialize ZerithDB with a unique app identifier.
// This scopes all IndexedDB storage and P2P sync rooms.
const app = createApp({
  appId: "vue-todo-example",
});

// Export the "todos" collection client for use in components.
// The collection is created lazily on first use — no manual setup needed.
export const todos = app.db("todos");
