<template>
  <div v-if="items.length === 0" class="empty">
    <div class="icon">📝</div>
    <p>No todos yet — add one above!</p>
  </div>

  <div v-else class="todo-list">
    <TodoItem
      v-for="item in items"
      :key="item._id"
      :item="item"
      @toggle="$emit('toggle', item)"
      @remove="$emit('remove', item)"
    />
  </div>
</template>

<script setup>
/**
 * TodoList.vue — Renders the list of todo items.
 *
 * Receives items from the parent (loaded via todos.find())
 * and delegates toggle/remove events upward.
 */
import TodoItem from "./TodoItem.vue";

defineProps({
  items: {
    type: Array,
    required: true,
  },
});

defineEmits(["toggle", "remove"]);
</script>
