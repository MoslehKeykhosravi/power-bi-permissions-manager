<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Folder Icon -->
    <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="#FF9800"/>
    <!-- Folder tab highlight -->
    <path d="M10 4H4C2.9 4 2.01 4.9 2.01 6H12L10 4Z" fill="#FFB74D" opacity="0.7"/>
  </svg>
</template>

<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 20
  }
})
</script>

