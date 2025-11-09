<template>
  <div class="app-container" :class="{ 'dark-mode': darkMode, 'rtl': isRTL }">
    <!-- Minimal Header -->
    <header class="minimal-header">
      <div class="header-left">
        <!-- Theme Switcher - 3 Icons -->
        <div class="theme-switcher">
          <!-- Light Mode -->
          <button 
            class="theme-btn" 
            :class="{ active: themeMode === 'light' }"
            @click="setThemeMode('light')"
            title="Light Mode"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          
          <!-- System Mode -->
          <button 
            class="theme-btn" 
            :class="{ active: themeMode === 'system' }"
            @click="setThemeMode('system')"
            title="System Mode"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          
          <!-- Dark Mode -->
          <button 
            class="theme-btn" 
            :class="{ active: themeMode === 'dark' }"
            @click="setThemeMode('dark')"
            title="Dark Mode"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
        
        <!-- Language Toggle Button -->
        <button 
          class="theme-btn language-btn" 
          @click="switchLocale" 
          :title="locale === 'en' ? 'Switch to Persian' : 'Switch to English'"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 3c2.5 0 4.5 4 4.5 9s-2 9-4.5 9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 3C9.5 3 7.5 7 7.5 12s2 9 4.5 9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M3 12h18M4 8h16M4 16h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      
      <h1 class="header-title">
        <PermissionsIcon :size="28" class="title-icon" />
        {{ t('appTitle') }}
      </h1>
      
      <div class="header-right">
        <!-- Empty for balance -->
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <div class="container">
        <!-- Horizontal Server Connection -->
        <div class="card connection-card">
          <div class="connection-horizontal">
            <label class="connection-label">
              <ServerIcon :size="18" class="server-icon" />
              {{ t('serverConnection') }}:
            </label>
            
            <!-- Editable dropdown - becomes input when custom is selected -->
            <input
              v-if="useCustom"
              v-model="customUrl"
              type="text"
              :placeholder="t('customServerUrl')"
              @keypress.enter="handleConnect"
              @blur="handleCustomBlur"
              class="minimal-select editable"
              list="server-list"
              autofocus
            />
            <select 
              v-else
              v-model="selectedServer" 
              @change="handleServerChange" 
              class="minimal-select"
            >
              <option value="" disabled>{{ t('selectServer') }}</option>
              <option v-for="server in serverList" :key="server" :value="server">
                {{ server }}
              </option>
              <option value="CUSTOM">{{ t('customUrl') }}</option>
            </select>

            <!-- Datalist for suggestions when typing custom URL -->
            <datalist id="server-list">
              <option v-for="server in serverList" :key="server" :value="server" />
            </datalist>

            <button 
              class="minimal-btn-small" 
              @click="handleConnect" 
              :disabled="loading || !currentServerUri"
            >
              {{ loading ? t('connecting') : t('loadReports') }}
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="card loading-card">
          <div class="spinner"></div>
          <p>{{ t('loading') }}</p>
        </div>

        <!-- Main Content Grid -->
        <div v-if="!loading && connected && reports.length > 0" class="content-grid">
          <!-- Reports Panel -->
          <div class="card reports-panel">
            <ReportTree
              :reports="reports"
              :connection-info="connectionInfo"
              :on-items-selected="handleItemsSelected"
              :on-reload-reports="reloadReports"
              :permissions-data="permissionsData"
            />
          </div>

          <!-- Permissions Panel -->
          <div class="card permissions-panel">
            <PermissionsPanel
              :selected-items="selectedItems"
              :connection-info="connectionInfo"
              :on-success="showSuccessToast"
              :on-error="showErrorToast"
              :on-check-permissions="handleCheckPermissions"
              :on-items-selected="handleItemsSelected"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && connected && reports.length === 0" class="card empty-state-card">
          <p>📭 {{ t('noReportsFound') }}</p>
        </div>
      </div>
    </main>

    <!-- Toast Notifications -->
    <div v-if="toast.show" class="toast" :class="[toast.type, { 'rtl': isRTL }]">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import ReportTree from './components/ReportTree.vue'
import PermissionsPanel from './components/PermissionsPanel.vue'
import { useI18n } from './composables/useI18n'
import ServerIcon from './assets/ServerIcon.vue'
import PermissionsIcon from './assets/PermissionsIcon.vue'

const { t, locale, isRTL, switchLocale } = useI18n()

// State
const themeMode = ref('system') // 'light', 'dark', or 'system'
const darkMode = ref(false)
const loading = ref(false)
const connected = ref(false)
const reports = ref([])
const connectionInfo = ref({})
const selectedItems = ref([])
const serverList = ref([])
const selectedServer = ref('')
const customUrl = ref('')
const useCustom = ref(false)
const error = ref(null)

const toast = ref({
  show: false,
  message: '',
  type: 'info'
})

const permissionsData = ref(null)

// Computed
const currentServerUri = computed(() => {
  return useCustom.value ? customUrl.value : selectedServer.value
})

// Methods
const applyTheme = (isDark) => {
  darkMode.value = isDark
  document.body.classList.toggle('dark-mode', isDark)
}

const updateTheme = () => {
  if (themeMode.value === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(prefersDark)
  } else {
    applyTheme(themeMode.value === 'dark')
  }
}

const setThemeMode = (mode) => {
  themeMode.value = mode
  localStorage.setItem('themeMode', mode)
  updateTheme()
}

// Watch for system theme changes
const systemThemeWatcher = window.matchMedia('(prefers-color-scheme: dark)')
systemThemeWatcher.addEventListener('change', (e) => {
  if (themeMode.value === 'system') {
    applyTheme(e.matches)
  }
})

const showToast = (message, type = 'info') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const showSuccessToast = (message) => {
  showToast(message, 'success')
}

const showErrorToast = (message) => {
  showToast(message, 'error')
}

// Store AD config globally
const adConfigGlobal = ref(null)

const loadServers = async () => {
  try {
    const response = await axios.get('/api/config/servers')
    if (response.data.success && response.data.servers.length > 0) {
      serverList.value = response.data.servers // All servers from backend
      selectedServer.value = '' // Default to empty (show "Select server" placeholder)
      
      // Store AD config if available
      if (response.data.adConfig) {
        adConfigGlobal.value = response.data.adConfig
        console.log('✓ Active Directory configuration loaded')
      } else {
        console.warn('⚠ No Active Directory configuration found. Please configure LDAP settings in .env file.')
      }
    }
  } catch (err) {
    console.error('Failed to load server list:', err)
    // Fallback to default servers if API fails
    serverList.value = [
      'https://insight.cinnagen.com/power_bi',
      'https://cg-bi-insight2.cinnagen.com/Power_BI',
      'https://server3.domain.com/Power_BI'
    ]
    selectedServer.value = '' // Default to empty (show "Select server" placeholder)
  }
}

const handleServerChange = () => {
  if (selectedServer.value === 'CUSTOM') {
    useCustom.value = true
    customUrl.value = ''
    selectedServer.value = ''
  } else {
    useCustom.value = false
    customUrl.value = ''
  }
}

const handleCustomBlur = () => {
  // If user clears the custom URL, go back to select
  if (!customUrl.value.trim()) {
    useCustom.value = false
    selectedServer.value = serverList.value[serverList.value.length - 1]
  }
}

const handleConnect = async () => {
  const urlToUse = currentServerUri.value

  if (!urlToUse || !urlToUse.trim()) {
    error.value = t('connectionError')
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await axios.post('/api/reports/list', {
      serverUri: urlToUse.trim()
    })

    if (response.data.success) {
      // Include AD config in connection info
      connectionInfo.value = { 
        serverUri: urlToUse.trim(),
        adConfig: adConfigGlobal.value 
      }
      reports.value = response.data.reports || []
      connected.value = true
      selectedItems.value = []
      showToast(t('connectionSuccess', { count: reports.value.length }), 'success')
    } else {
      throw new Error('Failed to fetch reports')
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || t('connectionError')
    error.value = errorMsg
    showToast(errorMsg, 'error')
  } finally {
    loading.value = false
  }
}

const handleItemsSelected = (items) => {
  selectedItems.value = items
}

const reloadReports = async () => {
  if (!connectionInfo.value.serverUri) return
  
  loading.value = true
  try {
    const response = await axios.post('/api/reports/list', {
      serverUri: connectionInfo.value.serverUri
    })

    if (response.data.success) {
      // Ensure AD config is still available
      connectionInfo.value.adConfig = adConfigGlobal.value
      reports.value = response.data.reports || []
      showToast(t('connectionSuccess', { count: reports.value.length }), 'success')
    }
  } catch (err) {
    console.error('Failed to reload reports:', err)
  } finally {
    loading.value = false
  }
}

const handleCheckPermissions = (permissions) => {
  // Update the permissions data which will trigger the tree view to update
  permissionsData.value = permissions
}

// Lifecycle
onMounted(() => {
  // Load saved theme mode or default to 'system'
  const savedThemeMode = localStorage.getItem('themeMode') || 'system'
  themeMode.value = savedThemeMode
  updateTheme()
  
  const savedLocale = localStorage.getItem('locale') || 'en'
  document.documentElement.dir = savedLocale === 'fa' ? 'rtl' : 'ltr'
  document.documentElement.lang = savedLocale
  
  loadServers()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Minimal Header - No Blue Background */
.minimal-header {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 150px;
}

.header-left {
  justify-content: flex-start;
}

.header-right {
  justify-content: flex-end;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-icon {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}

/* Theme Switcher and Language Button */
.theme-switcher {
  display: flex;
  align-items: center;
  gap: 2px;
  background: transparent;
  padding: 0;
}

.theme-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  position: relative;
}

/* Light Mode - Hover */
.theme-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
}

/* Dark Mode - Hover */
.dark-mode .theme-btn {
  color: #9ca3af;
}

.dark-mode .theme-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
}

/* Light Mode - Active State */
.theme-btn.active {
  background: rgba(0, 0, 0, 0.08);
  color: #111827;
}

.theme-btn.active svg {
  color: #111827;
}

/* Dark Mode - Active State */
.dark-mode .theme-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: #f9fafb;
}

.dark-mode .theme-btn.active svg {
  color: #f9fafb;
}

.theme-btn svg {
  display: block;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.theme-btn:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.theme-btn:focus:not(:focus-visible) {
  outline: none;
}

/* Language Button - Add spacing from theme switcher */
.language-btn {
  margin-left: 0.75rem;
}

.framework-badge {
  background: var(--background-light);
  border: 1px solid var(--border-color);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  color: var(--text-color);
}

.dark-mode .framework-badge {
  background: var(--background-dark);
}

.app-main {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
  background: var(--background-light);
  min-height: 0;
}

.dark-mode .app-main {
  background: var(--background-dark);
}

.container {
  max-width: 100%;
  height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Horizontal Connection Layout */
.connection-card {
  flex-shrink: 0;
}

.connection-horizontal {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.connection-label {
  font-weight: 500;
  white-space: nowrap;
  min-width: fit-content;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.server-icon {
  flex-shrink: 0;
  opacity: 0.8;
}

.minimal-select {
  flex: 1;
  min-width: 300px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.minimal-select.editable {
  cursor: text;
}

.minimal-select:hover {
  border-color: #999;
}

.minimal-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.minimal-btn-small {
  padding: 8px 20px;
  font-size: 0.95rem;
  background: transparent;
  color: #6b7280;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.minimal-btn-small:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
  border-color: rgba(0, 0, 0, 0.2);
}

.dark-mode .minimal-btn-small {
  color: #9ca3af;
}

.dark-mode .minimal-btn-small:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
  border-color: rgba(255, 255, 255, 0.2);
}

.minimal-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-url-section {
  margin-top: 1rem;
}

.minimal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 0.95rem;
}

.minimal-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.error-message {
  margin-top: 0.75rem;
  padding: 8px 12px;
  background: #fff3f3;
  border-left: 3px solid #f44336;
  border-radius: 4px;
  color: #c62828;
  font-size: 0.9rem;
}

.dark-mode .error-message {
  background: #3a1f1f;
  color: #ef5350;
}

.content-grid {
  display: grid;
  grid-template-columns: 43% 57%;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.reports-panel,
.permissions-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
    overflow: auto;
  }
  
  .reports-panel,
  .permissions-panel {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .connection-horizontal {
    flex-direction: column;
    align-items: stretch;
  }
  
  .minimal-select {
    min-width: 100%;
  }
  
  .minimal-btn-small {
    width: 100%;
  }
}

.loading-card {
  text-align: center;
  padding: 3rem;
  flex-shrink: 0;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state-card {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #999;
  flex-shrink: 0;
}

.toast {
  position: fixed;
  top: 80px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 4px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
  z-index: 10000;
  max-width: 400px;
}

.toast.rtl {
  right: auto;
  left: 20px;
  animation: slideInRTL 0.3s ease-out;
}

.toast.success {
  background: #4caf50;
}

.toast.error {
  background: #f44336;
}

.toast.warning {
  background: #ff9800;
}

.toast.info {
  background: #2196f3;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRTL {
  from {
    transform: translateX(-400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* RTL Support */
.rtl .minimal-header {
  direction: rtl;
}

.rtl .connection-horizontal {
  direction: rtl;
}

[dir="rtl"] .error-message {
  border-left: none;
  border-right: 3px solid #f44336;
}
</style>
