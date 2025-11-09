<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- RDL/Paginated Report Icon -->
    <g>
      <!-- Document outline -->
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#F4511E"/>
      
      <!-- Folded corner -->
      <path d="M14 2V8H20" fill="#D84315"/>
      
      <!-- Lines representing text -->
      <rect x="7" y="12" width="10" height="1" rx="0.5" fill="white" opacity="0.9"/>
      <rect x="7" y="15" width="10" height="1" rx="0.5" fill="white" opacity="0.9"/>
      <rect x="7" y="18" width="6" height="1" rx="0.5" fill="white" opacity="0.9"/>
    </g>
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

