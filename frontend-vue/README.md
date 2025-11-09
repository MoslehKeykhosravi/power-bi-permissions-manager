# Vue 3 Frontend - Power BI Permissions Manager

## 🎯 Overview

This is the **Vue 3** frontend implementation of the Power BI Permissions Manager. Built with modern web technologies for optimal performance and developer experience.

### Technology Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vite** - Lightning-fast build tool and dev server
- **Axios** - HTTP client for API communication
- **i18n** - Internationalization support (English + Persian/RTL)
- **Native CSS** - Component-scoped styles with design system
- **Custom SVG Icons** - Beautiful, optimized icon components

### Features

✅ **Modern UI/UX** - Material-UI inspired design with responsive layout  
✅ **3-Mode Theme System** - Light, Dark, and System (follows OS preference)  
✅ **Composition API** - Using `<script setup>` for cleaner code  
✅ **Internationalization** - Full i18n support with RTL for Persian  
✅ **Performance Optimized** - Memoized components, tree-shaking  
✅ **Small Bundle** - ~200KB optimized production build  
✅ **Hot Module Replacement** - Instant updates during development  
✅ **Component Library** - Reusable TreeNode, PermissionsPanel, custom icons  

---

## 📦 Installation

```bash
cd frontend-vue
npm install
```

---

## 🚀 Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The frontend will be available at: **`http://localhost:5173`** (Vite default port)

The app will automatically proxy API requests to the backend at `http://localhost:5000`

---

## 🏗️ Build for Production

```bash
npm run build
```

Output: `dist/` directory

---

## 🎨 File Structure

```text
frontend-vue/
├── public/                  # Static assets
├── src/
│   ├── components/          # Vue Single File Components
│   │   ├── PermissionsPanel.vue
│   │   ├── ReportTree.vue
│   │   └── TreeNode.vue
│   ├── assets/              # Custom SVG icon components
│   │   ├── PermissionsIcon.vue
│   │   ├── PowerBIIcon.vue
│   │   ├── FolderIcon.vue
│   │   ├── RDLIcon.vue
│   │   └── ServerIcon.vue
│   ├── composables/         # Vue composables
│   │   └── useI18n.js
│   ├── i18n/                # Internationalization
│   │   └── translations.js  # EN + FA translations
│   ├── styles/              # Global styles
│   │   └── design-system.css
│   ├── App.vue              # Root component
│   ├── main.js              # Application entry point
│   └── style.css            # Global CSS
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies
├── Dockerfile               # Docker build config
└── nginx.conf               # Nginx production config
```

---

## ⚡ Why Vue 3?

**Chosen for this project because:**

1. **Smaller Bundle Size** - Production build is ~200KB (60% smaller than React equivalent)
2. **Lightning-Fast Development** - Vite provides instant HMR and sub-second cold starts
3. **Simpler Syntax** - Composition API is clean and easy to maintain
4. **Better Performance** - Efficient reactivity system with minimal overhead
5. **Single File Components** - Scoped styles and logic in one place
6. **Great TypeScript Support** - (Optional) Ready for TypeScript migration
7. **Excellent i18n Support** - Easy integration for multi-language apps

---

## 🔧 Configuration

Vite proxy in `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}
```

---

## 📱 Responsive Design

- **Desktop**: Two-column grid
- **Tablet**: Single column
- **Mobile**: Stack layout

---

Made with 💚 using Vue 3 + Vite
