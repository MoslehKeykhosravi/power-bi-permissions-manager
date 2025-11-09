<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Elegant Permissions Icon - Shield with Lock and Analytics -->
    
    <defs>
      <!-- Modern gradient for shield -->
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
      <!-- Accent gradient -->
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f093fb;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f5576c;stop-opacity:1" />
      </linearGradient>
    </defs>
    
    <!-- Outer shield glow -->
    <path 
      d="M12 2.5L5 6V11.5C5 16.3 8.2 20.5 12 22C15.8 20.5 19 16.3 19 11.5V6L12 2.5Z" 
      fill="url(#shieldGrad)"
      opacity="0.15"
    />
    
    <!-- Main shield -->
    <path 
      d="M12 3L5.5 6.5V11.5C5.5 15.9 8.4 19.8 12 21.2C15.6 19.8 18.5 15.9 18.5 11.5V6.5L12 3Z" 
      fill="url(#shieldGrad)"
    />
    
    <!-- Lock body -->
    <rect x="9.5" y="11" width="5" height="5.5" rx="0.8" fill="white" opacity="0.95"/>
    
    <!-- Lock shackle -->
    <path 
      d="M10.5 11V9.5C10.5 8.67 11.17 8 12 8C12.83 8 13.5 8.67 13.5 9.5V11" 
      stroke="white" 
      stroke-width="1.3" 
      stroke-linecap="round"
      opacity="0.95"
    />
    
    <!-- Keyhole -->
    <circle cx="12" cy="13.5" r="0.7" fill="url(#accentGrad)"/>
    <rect x="11.65" y="13.5" width="0.7" height="1.5" rx="0.35" fill="url(#accentGrad)"/>
    
    <!-- Analytics dots (representing data/insights) -->
    <circle cx="7.5" cy="8" r="0.6" fill="white" opacity="0.6"/>
    <circle cx="9" cy="7" r="0.5" fill="white" opacity="0.5"/>
    <circle cx="15" cy="7" r="0.5" fill="white" opacity="0.5"/>
    <circle cx="16.5" cy="8" r="0.6" fill="white" opacity="0.6"/>
  </svg>
</template>

<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: 24
  }
})
</script>

