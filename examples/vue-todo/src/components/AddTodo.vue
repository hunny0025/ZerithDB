<template>
  <form class="add-form" @submit.prevent="onSubmit">
    <input
      v-model="text"
      type="text"
      placeholder="What needs to be done?"
      autofocus
    />
    <button type="submit" :disabled="!text.trim()">Add</button>
  </form>
</template>

<script setup>
/**
 * AddTodo.vue — Input form for creating new todos.
 *
 * Emits an "add" event with the todo text.
 * The parent component handles the actual todos.insert() call.
 */
import { ref } from "vue";

const emit = defineEmits(["add"]);
const text = ref("");

function onSubmit() {
  const trimmed = text.value.trim();
  if (!trimmed) return;
  emit("add", trimmed);
  text.value = "";
}
</script>
