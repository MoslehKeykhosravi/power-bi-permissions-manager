<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Minimal Server Icon -->
    <!-- Top server unit -->
    <rect x="3" y="4" width="18" height="5" rx="1.5" :stroke="color" stroke-width="1.5" fill="none"/>
    <circle cx="7" cy="6.5" r="0.8" :fill="color"/>
    <circle cx="10" cy="6.5" r="0.8" :fill="color"/>
    
    <!-- Middle server unit -->
    <rect x="3" y="10" width="18" height="5" rx="1.5" :stroke="color" stroke-width="1.5" fill="none"/>
    <circle cx="7" cy="12.5" r="0.8" :fill="color"/>
    <circle cx="10" cy="12.5" r="0.8" :fill="color"/>
    
    <!-- Bottom server unit -->
    <rect x="3" y="16" width="18" height="5" rx="1.5" :stroke="color" stroke-width="1.5" fill="none"/>
    <circle cx="7" cy="18.5" r="0.8" :fill="color"/>
    <circle cx="10" cy="18.5" r="0.8" :fill="color"/>
  </svg>
</template>

<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 20
  },
  color: {
    type: String,
    default: 'currentColor'
  }
})
</script>

