# Vue Todo — ZerithDB Example

A minimal todo application built with **Vue 3** and **ZerithDB**, demonstrating
local-first data persistence with IndexedDB.

## Features Demonstrated

| ZerithDB API | Used In | Purpose |
|-------------|---------|---------|
| `createApp()` | `src/db.js` | Initialize ZerithDB with an app ID |
| `app.db("todos")` | `src/db.js` | Get a collection client |
| `todos.insert()` | `App.vue` | Add a new todo |
| `todos.find()` | `App.vue` | List all todos |
| `todos.update()` | `App.vue` | Toggle todo completion |
| `todos.delete()` | `App.vue` | Remove a single todo |
| `todos.clearAll()` | `App.vue` | Remove all todos |

## Quick Start

```bash
cd examples/vue-todo
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
vue-todo/
├── index.html                  # Vite entry HTML
├── package.json                # Dependencies (vue + zerithdb-sdk)
├── vite.config.js              # Vite + Vue plugin
├── README.md                   # This file
└── src/
    ├── main.js                 # Vue app bootstrap
    ├── db.js                   # ZerithDB initialization
    ├── style.css               # Global styles
    ├── App.vue                 # Root component (CRUD orchestration)
    └── components/
        ├── AddTodo.vue         # New todo form (insert)
        ├── TodoList.vue        # List container (find)
        └── TodoItem.vue        # Single todo (update/delete)
```

## How It Works

1. **`src/db.js`** creates a ZerithDB app instance with `createApp({ appId: "vue-todo-example" })` and exports the `todos` collection client.

2. **`App.vue`** imports the `todos` collection and performs all CRUD operations:
   - `todos.find()` — loads all documents on mount
   - `todos.insert({ text, done: false })` — adds a new todo
   - `todos.update({ _id }, { $set: { done: !done } })` — toggles completion
   - `todos.delete({ _id })` — removes a todo
   - `todos.clearAll()` — clears the entire collection

3. Data persists in **IndexedDB** — refresh the page and your todos are still there.

## Tech Stack

- **Vue 3** — Composition API with `<script setup>`
- **Vite** — Development server and bundler
- **ZerithDB SDK** — Local-first database
- No router, no state management library, no CSS framework
