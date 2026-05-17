<template>
  <div>
    <header class="app-header">
      <h1>✅ Vue Todo — <span>ZerithDB</span></h1>
      <p>A local-first todo app powered by ZerithDB</p>
    </header>

    <!-- Stats: demonstrates count() -->
    <div class="stats">
      <div class="stat-card">
        <div class="value">{{ totalCount }}</div>
        <div class="label">Total</div>
      </div>
      <div class="stat-card">
        <div class="value">{{ doneCount }}</div>
        <div class="label">Completed</div>
      </div>
      <div class="stat-card">
        <div class="value">{{ totalCount - doneCount }}</div>
        <div class="label">Remaining</div>
      </div>
    </div>

    <!-- Add todo form: demonstrates insert() -->
    <AddTodo @add="handleAdd" />

    <!-- Todo list: demonstrates find(), update(), delete() -->
    <TodoList
      :items="items"
      @toggle="handleToggle"
      @remove="handleRemove"
    />

    <!-- Clear all: demonstrates clearAll() -->
    <div v-if="items.length > 0" class="actions">
      <button class="clear-btn" @click="handleClearAll">
        Clear all todos
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * App.vue — Root component.
 *
 * Orchestrates all ZerithDB CRUD operations:
 * - insert()   → AddTodo emits "add"
 * - find()     → loads all todos on mount and after mutations
 * - update()   → TodoItem emits "toggle"
 * - delete()   → TodoItem emits "remove"
 * - count()    → computed from the loaded items
 * - clearAll() → "Clear all" button
 */
import { ref, computed, onMounted } from "vue";
import { todos } from "./db.js";
import AddTodo from "./components/AddTodo.vue";
import TodoList from "./components/TodoList.vue";

// Reactive state — the list of todo documents from ZerithDB
const items = ref([]);

// Computed counts derived from the loaded items
const totalCount = computed(() => items.value.length);
const doneCount = computed(() => items.value.filter((t) => t.done).length);

/**
 * Refresh the todo list from ZerithDB.
 * Uses find() with an empty filter to fetch all documents.
 */
async function loadTodos() {
  items.value = await todos.find();
}

/**
 * Insert a new todo document.
 * Demonstrates: todos.insert({ text, done })
 */
async function handleAdd(text) {
  await todos.insert({ text, done: false });
  await loadTodos();
}

/**
 * Toggle the "done" status of a todo.
 * Demonstrates: todos.update(filter, { $set: { ... } })
 */
async function handleToggle(item) {
  await todos.update({ _id: item._id }, { $set: { done: !item.done } });
  await loadTodos();
}

/**
 * Delete a single todo by its ID.
 * Demonstrates: todos.delete(filter)
 */
async function handleRemove(item) {
  await todos.delete({ _id: item._id });
  await loadTodos();
}

/**
 * Clear every document in the collection.
 * Demonstrates: todos.clearAll()
 */
async function handleClearAll() {
  await todos.clearAll();
  await loadTodos();
}

// Load todos from IndexedDB when the component mounts
onMounted(loadTodos);
</script>
