<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Power BI Logo - Three bars with gradient from yellow to orange -->
    <g>
      <!-- Left bar (shortest, lightest) -->
      <rect x="4" y="14" width="4" height="6" rx="1.5" fill="#F2C811"/>
      
      <!-- Middle bar (medium, medium color) -->
      <rect x="10" y="10" width="4" height="10" rx="1.5" fill="#F2A900"/>
      
      <!-- Right bar (tallest, darkest) -->
      <rect x="16" y="4" width="4" height="16" rx="1.5" fill="#E68A00"/>
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

