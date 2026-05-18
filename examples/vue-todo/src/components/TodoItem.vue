<template>
  <div class="todo-item" :class="{ done: item.done }">
    <input type="checkbox" :checked="item.done" @change="$emit('toggle')" />
    <span class="text">{{ item.text }}</span>
    <button class="delete-btn" title="Delete" @click="$emit('remove')">✕</button>
  </div>
</template>

<script setup>
/**
 * TodoItem.vue — A single todo entry.
 *
 * - Checkbox emits "toggle" → parent calls todos.update()
 * - Delete button emits "remove" → parent calls todos.delete()
 */
defineProps({
  item: {
    type: Object,
    required: true,
  },
});

defineEmits(["toggle", "remove"]);
</script>
