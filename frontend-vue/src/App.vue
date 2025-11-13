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
        <!-- Loading State -->
        <div v-if="loading" class="card loading-card">
          <div class="spinner"></div>
          <p>{{ t('loading') }}</p>
        </div>

        <!-- Main Content Grid -->
        <div v-if="!loading" class="content-grid">
          <!-- Reports Panel -->
          <div class="card reports-panel">
            <!-- User Search and Action Buttons -->
            <div class="user-search-section">
              <div class="user-search-row">
                <label class="user-search-label">{{ t('userNameOrGroup') || 'User Name or Group' }}</label>
                
                <!-- Live Search Input -->
                <div class="user-search-container">
                  <input
                    v-model="adSearchQuery"
                    type="text"
                    placeholder="Search users or groups from Active Directory..."
                    class="text-input user-search-input"
                    @input="searchAdUsers"
                    @focus="showSearchResults = true"
                  />
                  <button v-if="adSearchQuery" @click="clearAdSearch" class="clear-input-btn">×</button>
                  
                  <!-- Live Search Results -->
                  <div v-if="showSearchResults && (adLoading || adError || adUsers.length > 0 || adSearchQuery)" class="live-search-results">
                    <!-- Loading State -->
                    <div v-if="adLoading" class="search-result-item loading-item">
                      <span class="spinner-small"></span> Searching...
                    </div>
                    
                    <!-- Error State -->
                    <div v-if="adError && !adLoading" class="search-result-item error-item">
                      {{ adError }}
                    </div>
                    
                    <!-- User Results -->
                    <div v-if="!adLoading && !adError && adUsers.length > 0">
                      <div
                        v-for="user in adUsers"
                        :key="user.name"
                        class="search-result-item"
                        :class="{ selected: isAdUserSelected(user) }"
                        @click="selectAdUser(user)"
                      >
                        <!-- Status Icon for Users (active/inactive) -->
                        <span 
                          v-if="user.type === 'User' && user.isActive !== undefined" 
                          class="status-indicator"
                          :class="{ active: user.isActive, inactive: !user.isActive }"
                          :title="user.isActive ? 'Active' : 'Inactive'"
                        >
                          <svg v-if="user.isActive" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </span>
                        
                        <!-- Status Icon for Groups (always active/green) -->
                        <span 
                          v-if="user.type === 'Group'" 
                          class="status-indicator active"
                          title="Group"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </span>
                        
                        <!-- User Icon (Single Person - Blue) -->
                        <svg v-if="user.type === 'User'" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="user-type-icon">
                          <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" fill="currentColor"/>
                          <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18V18H4V18Z" fill="currentColor"/>
                        </svg>
                        
                        <!-- Group Icon (3 People - Orange) -->
                        <svg v-else width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="group-type-icon">
                          <circle cx="5.5" cy="5" r="2.5" fill="currentColor"/>
                          <path d="M1 14C1 11.7909 2.79086 10 5 10C6.48 10 7.77 10.81 8.46 12" fill="currentColor"/>
                          <circle cx="10" cy="4.5" r="3" fill="currentColor"/>
                          <path d="M5 16C5 13.2386 7.23858 11 10 11C12.7614 11 15 13.2386 15 16V17H5V16Z" fill="currentColor"/>
                          <circle cx="14.5" cy="5" r="2.5" fill="currentColor"/>
                          <path d="M19 14C19 11.7909 17.2091 10 15 10C13.52 10 12.23 10.81 11.54 12" fill="currentColor"/>
                        </svg>
                        
                        <div class="user-result-info">
                          <span class="user-result-display">{{ user.displayText }}</span>
                        </div>
                        
                        <!-- View Details Button (for users) -->
                        <button 
                          v-if="user.type === 'User'" 
                          @click.stop="showUserDetails(user.name)" 
                          class="user-info-btn"
                          title="View Details"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </button>
                        
                        <!-- View Group Members Button (for groups) -->
                        <button 
                          v-if="user.type === 'Group'" 
                          @click.stop="showGroupMembers(user.name)" 
                          class="user-info-btn"
                          title="View Group Members"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </button>
                        
                        <span v-if="isAdUserSelected(user)" class="check-icon">✓</span>
                      </div>
                    </div>
                    
                    <!-- Empty State -->
                    <div v-if="!adLoading && !adError && adUsers.length === 0 && adSearchQuery" class="search-result-item empty-item">
                      No users or groups found for "{{ adSearchQuery }}"
                    </div>
                  </div>
                </div>
                
                <!-- Apply Permission Button -->
                <button
                  class="apply-btn-minimal-top"
                  @click="handleApplyPermissions"
                  :disabled="applyLoading || (selectedItems.length === 0 && markedForRemovalItems.length === 0) || selectedAdUsers.length === 0 || !connectionInfo?.serverUri"
                >
                  <span v-if="applyLoading" class="spinner-small"></span>
                  <span v-else>{{ t('applyPermissions') || 'Apply Permissions' }}</span>
                </button>
                
                <!-- Check Permission Button -->
                <button
                  class="check-btn-minimal-top"
                  @click="handleCheckPermissionsClick"
                  :disabled="checkLoading || selectedAdUsers.length === 0 || !connectionInfo?.serverUri"
                >
                  <span v-if="checkLoading" class="spinner-small"></span>
                  <span v-else>{{ t('checkPermissions') || 'Check Permissions' }}</span>
                </button>
              </div>
              
              <!-- Selected Users Tags -->
              <div v-if="selectedAdUsers.length > 0" class="selected-users-tags-top">
                <span v-for="user in selectedAdUsers" :key="user.name" class="user-tag">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" fill="currentColor"/>
                    <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18V18H4V18Z" fill="currentColor"/>
                  </svg>
                  {{ user.name }}
                  <button @click="removeAdUser(user)" class="user-tag-remove">×</button>
                </span>
              </div>
            </div>
            
            <ReportTree
              :reports="reports"
              :connection-info="connectionInfo"
              :on-items-selected="handleItemsSelected"
              :on-reload-reports="reloadReports"
              :permissions-data="permissionsData"
              :on-role-changes="handleRoleChanges"
              :server-list="serverList"
              :on-server-switch="handleServerSwitch"
            />
          </div>

        </div>
      </div>
    </main>

    <!-- Toast Notifications -->
    <div v-if="toast.show" class="toast" :class="[toast.type, { 'rtl': isRTL }]">
      {{ toast.message }}
    </div>

    <!-- User Details Modal -->
    <div v-if="showUserDetailsModal" class="modal-overlay" @click="closeUserDetailsModal">
      <div class="modal-content user-details-modal ltr-content" @click.stop>
        <div class="modal-header">
          <h3>👤 User Details</h3>
          <button class="modal-close" @click="closeUserDetailsModal">×</button>
        </div>
        
        <div v-if="loadingUserDetails" class="modal-body">
          <div class="loading-section">
            <span class="spinner-small"></span>
            <span>Loading user details...</span>
          </div>
        </div>
        
        <div v-else-if="userDetailsError" class="modal-body">
          <div class="error-section">
            {{ userDetailsError }}
          </div>
        </div>
        
        <div v-else-if="selectedUserDetails" class="modal-body user-details-content">
          <!-- Basic Information -->
          <div class="details-section">
            <h4>📋 Basic Information</h4>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Display Name:</span>
                <span class="detail-value">{{ selectedUserDetails.displayName || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Username:</span>
                <span class="detail-value">{{ selectedUserDetails.sAMAccountName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ selectedUserDetails.email || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Title:</span>
                <span class="detail-value">{{ selectedUserDetails.title || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Department:</span>
                <span class="detail-value">{{ selectedUserDetails.department || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Company:</span>
                <span class="detail-value">{{ selectedUserDetails.company || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Office:</span>
                <span class="detail-value">{{ selectedUserDetails.office || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ selectedUserDetails.telephoneNumber || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                  <span :class="['status-badge', selectedUserDetails.isActive ? 'active' : 'inactive']">
                    {{ selectedUserDetails.isActive ? '✓ Active' : '✗ Inactive' }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- Manager Chain -->
          <div v-if="managerChain && managerChain.length > 0" class="details-section">
            <h4>👥 Organizational Hierarchy</h4>
            <div class="manager-chain">
              <div 
                v-for="(manager, index) in managerChain" 
                :key="index"
                class="manager-item"
                :class="{ 'current-user': index === 0 }"
              >
                <div class="manager-level">{{ index === 0 ? 'Current' : `Level ${index}` }}</div>
                <div class="manager-info">
                  <div class="manager-name">{{ manager.displayName || manager.cn }}</div>
                  <div class="manager-meta">
                    <span v-if="manager.title">{{ manager.title }}</span>
                    <span v-if="manager.department"> • {{ manager.department }}</span>
                  </div>
                </div>
                <div v-if="index < managerChain.length - 1" class="hierarchy-arrow">↑</div>
              </div>
            </div>
          </div>

          <!-- Direct Reports -->
          <div v-if="directReports && directReports.length > 0" class="details-section">
            <h4>👤 Direct Reports ({{ directReports.length }})</h4>
            <div class="direct-reports-list">
              <div v-for="report in directReports" :key="report.sAMAccountName" class="report-item">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" fill="currentColor"/>
                  <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18V18H4V18Z" fill="currentColor"/>
                </svg>
                <div class="report-info">
                  <div class="report-name">{{ report.displayName || report.cn }}</div>
                  <div class="report-meta">
                    <span v-if="report.title">{{ report.title }}</span>
                    <span v-if="report.department"> • {{ report.department }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Group Memberships -->
          <div v-if="selectedUserDetails.groups && selectedUserDetails.groups.length > 0" class="details-section">
            <h4>🔐 Group Memberships ({{ selectedUserDetails.groups.length }})</h4>
            <div class="groups-list">
              <span 
                v-for="group in selectedUserDetails.groups.slice(0, showAllGroups ? undefined : 10)" 
                :key="group" 
                class="group-badge"
                @click="showGroupMembers(group)"
                :title="'Click to view group members'"
              >
                {{ group }}
              </span>
              <button 
                v-if="selectedUserDetails.groups.length > 10 && !showAllGroups"
                @click="showAllGroups = true"
                class="show-more-groups-btn"
              >
                +{{ selectedUserDetails.groups.length - 10 }} more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Group Members Modal -->
    <div v-if="showGroupMembersModal" class="modal-overlay" @click="closeGroupMembersModal">
      <div class="modal-content ltr-content" @click.stop>
        <div class="modal-header">
          <h3>👥 Group Members: {{ selectedGroupName }}</h3>
          <button class="modal-close" @click="closeGroupMembersModal">×</button>
        </div>
        
        <div v-if="loadingGroupMembers" class="modal-body">
          <div class="loading-section">
            <span class="spinner-small"></span>
            <span>Loading group members...</span>
          </div>
        </div>
        
        <div v-else-if="groupMembersError" class="modal-body">
          <div class="error-section">
            {{ groupMembersError }}
          </div>
        </div>
        
        <div v-else-if="groupMembers" class="modal-body">
          <div class="group-info-header">
            <p v-if="groupMembersData.description">{{ groupMembersData.description }}</p>
            <p class="member-count">{{ groupMembers.length }} members</p>
          </div>
          
          <div class="modal-search">
            <input
              v-model="groupMemberSearchQuery"
              type="text"
              placeholder="Search members..."
              class="modal-search-input"
            />
          </div>
          
          <div class="members-list">
            <div 
              v-for="member in filteredGroupMembers" 
              :key="member.distinguishedName"
              class="member-item"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" fill="currentColor"/>
                <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18V18H4V18Z" fill="currentColor"/>
              </svg>
              <div class="member-info">
                <div class="member-name">{{ member.displayName || member.cn }}</div>
                <div class="member-meta">
                  <span class="member-type-badge" :class="member.type">{{ member.type }}</span>
                  <span v-if="member.title"> • {{ member.title }}</span>
                  <span v-if="member.department"> • {{ member.department }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import ReportTree from './components/ReportTree.vue'
import { useI18n } from './composables/useI18n'
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
const markedForRemovalItems = ref([])
const newItems = ref([]) // New items to add permissions (not in original)
const originalPermissionIds = ref([]) // IDs of items user originally had
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
const itemRoles = ref(new Map()) // Track role changes from ReportTree

// AD User Search State
const selectedAdUsers = ref([])
const adUsers = ref([])
const adSearchQuery = ref('')
const adLoading = ref(false)
const adError = ref('')
const showSearchResults = ref(false)
const applyLoading = ref(false)
const checkLoading = ref(false)
let searchTimeout = null

// User Details Modal
const showUserDetailsModal = ref(false)
const selectedUserDetails = ref(null)
const loadingUserDetails = ref(false)
const userDetailsError = ref('')
const managerChain = ref([])
const directReports = ref([])
const showAllGroups = ref(false)

// Group Members Modal
const showGroupMembersModal = ref(false)
const selectedGroupName = ref('')
const groupMembers = ref([])
const groupMembersData = ref({})
const loadingGroupMembers = ref(false)
const groupMembersError = ref('')
const groupMemberSearchQuery = ref('')

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
      if (reports.value.length > 0) {
        showToast(t('connectionSuccess', { count: reports.value.length }), 'success')
      } else {
        showToast(t('noReportsFound') || 'No reports found on this server', 'info')
      }
    } else {
      throw new Error('Failed to fetch reports')
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || t('connectionError')
    error.value = errorMsg
    // Still set connection info and show tree even on error, so user can switch servers
    connectionInfo.value = { 
      serverUri: urlToUse.trim(),
      adConfig: adConfigGlobal.value 
    }
    reports.value = []
    connected.value = true
    selectedItems.value = []
    showToast(errorMsg, 'error')
  } finally {
    loading.value = false
  }
}

const handleItemsSelected = (items, markedItems = [], newItemsList = [], originalIds = []) => {
  selectedItems.value = items
  markedForRemovalItems.value = markedItems
  newItems.value = newItemsList
  originalPermissionIds.value = originalIds
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

const handleRoleChanges = (rolesMap) => {
  itemRoles.value = rolesMap
}

const handleServerSwitch = async (serverUri) => {
  if (!serverUri || !serverUri.trim()) {
    return
  }

  // Set the selected server
  if (serverList.value.includes(serverUri)) {
    selectedServer.value = serverUri
    useCustom.value = false
  } else {
    customUrl.value = serverUri
    useCustom.value = true
  }

  // Automatically connect to the new server
  loading.value = true
  error.value = null

  try {
    const response = await axios.post('/api/reports/list', {
      serverUri: serverUri.trim()
    })

    if (response.data.success) {
      // Include AD config in connection info
      connectionInfo.value = { 
        serverUri: serverUri.trim(),
        adConfig: adConfigGlobal.value 
      }
      reports.value = response.data.reports || []
      connected.value = true
      selectedItems.value = []
      if (reports.value.length > 0) {
        showToast(t('connectionSuccess', { count: reports.value.length }), 'success')
      } else {
        showToast(t('noReportsFound') || 'No reports found on this server', 'info')
      }
    } else {
      throw new Error('Failed to fetch reports')
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || t('connectionError')
    error.value = errorMsg
    // Still set connection info and show tree even on error, so user can switch servers
    connectionInfo.value = { 
      serverUri: serverUri.trim(),
      adConfig: adConfigGlobal.value 
    }
    reports.value = []
    connected.value = true
    selectedItems.value = []
    showToast(errorMsg, 'error')
  } finally {
    loading.value = false
  }
}

// AD User Search Functions
const searchAdUsers = async () => {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  const query = adSearchQuery.value.trim()
  
  if (query.length < 1) {
    adUsers.value = []
    return
  }

  // Debounce search
  searchTimeout = setTimeout(async () => {
    adLoading.value = true
    adError.value = ''

    try {
      const adConfig = connectionInfo.value?.adConfig || adConfigGlobal.value
      
      if (!adConfig) {
        adError.value = 'Active Directory configuration is missing. Please check your backend .env file for LDAP settings, or reload the page.'
        adLoading.value = false
        return
      }

      const response = await axios.post('/api/ad/search', {
        ldapUrl: adConfig.ldapUrl,
        bindDN: adConfig.bindDN,
        bindPassword: adConfig.bindPassword,
        searchBase: adConfig.searchBase,
        searchFilter: query
      })

      if (response.data.success) {
        adUsers.value = response.data.results || []
        if (adUsers.value.length === 0) {
          adError.value = 'No users or groups found'
        }
      } else {
        adError.value = response.data.error || 'Failed to search users'
      }
    } catch (error) {
      console.error('Error searching AD:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to search Active Directory'
      if (errorMsg.includes('Size Limit Exceeded') || errorMsg.includes('SizeLimitExceeded')) {
        adError.value = 'Too many results. Please be more specific in your search.'
      } else {
        adError.value = errorMsg
      }
    } finally {
      adLoading.value = false
    }
  }, 300)
}

const clearAdSearch = () => {
  adSearchQuery.value = ''
  adUsers.value = []
  adError.value = ''
  showSearchResults.value = false
}

const selectAdUser = (user) => {
  const index = selectedAdUsers.value.findIndex(u => u.name === user.name)
  if (index > -1) {
    selectedAdUsers.value.splice(index, 1)
  } else {
    selectedAdUsers.value.push(user)
  }
}

const removeAdUser = (user) => {
  const index = selectedAdUsers.value.findIndex(u => u.name === user.name)
  if (index > -1) {
    selectedAdUsers.value.splice(index, 1)
  }
}

const isAdUserSelected = (user) => {
  return selectedAdUsers.value.some(u => u.name === user.name)
}

// Computed: Filter group members
const filteredGroupMembers = computed(() => {
  if (!groupMembers.value || groupMembers.value.length === 0) {
    return []
  }
  
  if (!groupMemberSearchQuery.value.trim()) {
    return groupMembers.value
  }
  
  const searchLower = groupMemberSearchQuery.value.toLowerCase()
  return groupMembers.value.filter(member => {
    const name = (member.displayName || member.cn || '').toLowerCase()
    const username = (member.sAMAccountName || '').toLowerCase()
    const email = (member.email || '').toLowerCase()
    
    return name.includes(searchLower) || 
           username.includes(searchLower) || 
           email.includes(searchLower)
  })
})

// Show User Details
const showUserDetails = async (userName) => {
  showUserDetailsModal.value = true
  loadingUserDetails.value = true
  userDetailsError.value = ''
  selectedUserDetails.value = null
  managerChain.value = []
  directReports.value = []
  showAllGroups.value = false
  
  try {
    const adConfig = connectionInfo.value?.adConfig || adConfigGlobal.value
    
    if (!adConfig) {
      userDetailsError.value = 'Active Directory configuration is missing'
      loadingUserDetails.value = false
      return
    }

    // Fetch user details
    const detailsPromise = axios.post('/api/ad/user/details', {
      ldapUrl: adConfig.ldapUrl,
      bindDN: adConfig.bindDN,
      bindPassword: adConfig.bindPassword,
      searchBase: adConfig.searchBase,
      userName: userName
    })

    // Fetch manager chain
    const managerPromise = axios.post('/api/ad/user/manager-chain', {
      ldapUrl: adConfig.ldapUrl,
      bindDN: adConfig.bindDN,
      bindPassword: adConfig.bindPassword,
      searchBase: adConfig.searchBase,
      userName: userName
    })

    // Fetch direct reports
    const reportsPromise = axios.post('/api/ad/user/direct-reports', {
      ldapUrl: adConfig.ldapUrl,
      bindDN: adConfig.bindDN,
      bindPassword: adConfig.bindPassword,
      searchBase: adConfig.searchBase,
      userName: userName
    })

    // Wait for all requests
    const [detailsRes, managerRes, reportsRes] = await Promise.all([
      detailsPromise,
      managerPromise,
      reportsPromise
    ])

    if (detailsRes.data.success) {
      selectedUserDetails.value = detailsRes.data.user
    }

    if (managerRes.data.success) {
      managerChain.value = managerRes.data.managerChain
    }

    if (reportsRes.data.success) {
      directReports.value = reportsRes.data.directReports
    }
  } catch (error) {
    console.error('Error fetching user details:', error)
    userDetailsError.value = error.response?.data?.message || error.message || 'Failed to load user details'
  } finally {
    loadingUserDetails.value = false
  }
}

const closeUserDetailsModal = () => {
  showUserDetailsModal.value = false
  selectedUserDetails.value = null
  managerChain.value = []
  directReports.value = []
  showAllGroups.value = false
}

// Show Group Members
const showGroupMembers = async (groupName) => {
  // Close user details modal if open
  showUserDetailsModal.value = false
  
  showGroupMembersModal.value = true
  selectedGroupName.value = groupName
  loadingGroupMembers.value = true
  groupMembersError.value = ''
  groupMembers.value = []
  groupMembersData.value = {}
  groupMemberSearchQuery.value = ''
  
  try {
    const adConfig = connectionInfo.value?.adConfig || adConfigGlobal.value
    
    if (!adConfig) {
      groupMembersError.value = 'Active Directory configuration is missing'
      loadingGroupMembers.value = false
      return
    }

    const response = await axios.post('/api/ad/group/members', {
      ldapUrl: adConfig.ldapUrl,
      bindDN: adConfig.bindDN,
      bindPassword: adConfig.bindPassword,
      searchBase: adConfig.searchBase,
      groupName: groupName
    })

    if (response.data.success) {
      groupMembers.value = response.data.members
      groupMembersData.value = response.data.group
    } else {
      groupMembersError.value = response.data.error || 'Failed to load group members'
    }
  } catch (error) {
    console.error('Error fetching group members:', error)
    groupMembersError.value = error.response?.data?.message || error.message || 'Failed to load group members'
  } finally {
    loadingGroupMembers.value = false
  }
}

const closeGroupMembersModal = () => {
  showGroupMembersModal.value = false
  selectedGroupName.value = ''
  groupMembers.value = []
  groupMembersData.value = {}
  groupMemberSearchQuery.value = ''
}

// Handle Apply Permissions
const handleApplyPermissions = async () => {
  // Validate: must have server connection
  if (!connectionInfo.value?.serverUri) {
    showToast('Server connection is required. Please select a server first.', 'error')
    return
  }
  
  // Validate: must have selected users
  if (selectedAdUsers.value.length === 0) {
    showToast('Please select at least one user from Active Directory', 'error')
    return
  }
  
  // Validate: must have selected items or marked for removal items
  if (selectedItems.value.length === 0 && markedForRemovalItems.value.length === 0) {
    showToast('Please select at least one item to apply permissions', 'error')
    return
  }
  
  // Validate: must have role changes or new items
  const hasItemRoles = itemRoles.value && itemRoles.value.size > 0
  const hasNewItems = newItems.value && newItems.value.length > 0
  const hasRemovals = markedForRemovalItems.value && markedForRemovalItems.value.length > 0
  
  if (!hasItemRoles && !hasNewItems && !hasRemovals) {
    showToast('No changes to apply. Please select items and roles first.', 'error')
    return
  }
  
  applyLoading.value = true
  const userNames = selectedAdUsers.value.map(u => u.name)
  let successCount = 0
  let failCount = 0
  const errors = []
  
  try {
    // Apply permissions for items with role changes
    if (hasItemRoles && itemRoles.value.size > 0) {
      for (const [nodeId, roles] of itemRoles.value.entries()) {
        // Find the item
        let item = selectedItems.value.find(selectedItem => {
          if (nodeId === 'server-root') {
            return selectedItem.path === '/'
          } else if (nodeId.startsWith('report_')) {
            const reportId = nodeId.replace('report_', '')
            return selectedItem.id === reportId
          } else if (nodeId.startsWith('folder_')) {
            const folderPath = nodeId.replace('folder_', '')
            return selectedItem.type === 'Folder' && selectedItem.path === folderPath
          }
          return false
        })
        
        // If not found in selectedItems, try to find from reports list
        if (!item && nodeId.startsWith('report_')) {
          const reportId = nodeId.replace('report_', '')
          item = reports.value.find(r => r.id === reportId)
        }
        
        // If still not found and it's server-root, construct it
        if (!item && nodeId === 'server-root') {
          item = {
            type: 'Folder',
            path: '/',
            name: '/',
            itemType: 'Folder'
          }
        }
        
        if (!item) continue
        
        const itemType = item.type === 'Folder' ? 'Folder' : 'Report'
        const itemPath = item.path || item.fullPath || (item.path === '/' ? '/' : '')
        
        for (const user of userNames) {
          try {
            const response = await axios.post('/api/permissions/set', {
              serverUri: connectionInfo.value.serverUri,
              itemId: item.id,
              itemPath: itemPath,
              userName: user,
              roles: roles.length === 0 ? [] : roles,
              itemType: itemType
            })
            
            if (response.data.success) {
              successCount++
            } else {
              failCount++
              errors.push(`${user} → ${item.name || item.path}: ${response.data.error || 'Failed'}`)
            }
          } catch (err) {
            failCount++
            errors.push(`${user} → ${item.name || item.path}: ${err.message}`)
          }
        }
      }
    }
    
    // Apply permissions for new items (default to Browser role)
    if (hasNewItems) {
      for (const item of newItems.value) {
        const itemType = item.type === 'Folder' ? 'Folder' : 'Report'
        
        // Get roles from itemRoles if available, otherwise default to Browser
        let rolesToApply = ['Browser']
        if (itemRoles.value && itemRoles.value.size > 0) {
          const nodeId = item.id ? `report_${item.id}` : `folder_${item.path}`
          if (itemRoles.value.has(nodeId)) {
            const itemRolesList = itemRoles.value.get(nodeId)
            if (itemRolesList && itemRolesList.length > 0) {
              rolesToApply = itemRolesList
            }
          }
        }
        
        for (const user of userNames) {
          try {
            const response = await axios.post('/api/permissions/set', {
              serverUri: connectionInfo.value.serverUri,
              itemId: item.id,
              itemPath: item.path || item.fullPath,
              userName: user,
              roles: rolesToApply,
              itemType: itemType
            })
            
            if (response.data.success) {
              successCount++
            } else {
              failCount++
              errors.push(`${user} → ${item.name}: Failed to add`)
            }
          } catch (err) {
            failCount++
            errors.push(`${user} → ${item.name}: ${err.message}`)
          }
        }
      }
    }
    
    // Remove permissions from marked items
    if (hasRemovals) {
      for (const item of markedForRemovalItems.value) {
        const itemType = item.type === 'Folder' ? 'Folder' : 'Report'
        
        for (const user of userNames) {
          try {
            const response = await axios.post('/api/permissions/set', {
              serverUri: connectionInfo.value.serverUri,
              itemId: item.id,
              itemPath: item.path || item.fullPath,
              userName: user,
              roles: [], // Empty array means remove all permissions
              itemType: itemType
            })
            
            if (response.data.success) {
              successCount++
            } else {
              failCount++
              errors.push(`${user} → ${item.name}: Failed to remove`)
            }
          } catch (err) {
            failCount++
            errors.push(`${user} → ${item.name}: ${err.message}`)
          }
        }
      }
    }
    
    if (failCount === 0) {
      showToast(`Successfully applied ${successCount} permission change(s)`, 'success')
      // Reload reports to refresh permissions
      if (connectionInfo.value?.serverUri) {
        await reloadReports()
      }
      // Automatically check permissions after successful apply
      // Only check if we have selected users
      if (selectedAdUsers.value.length > 0) {
        // Use a small delay to ensure the apply operation is fully complete
        setTimeout(async () => {
          await handleCheckPermissionsClick()
        }, 500)
      }
    } else {
      const errorMsg = `Applied ${successCount} change(s), ${failCount} failed. ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`
      showToast(errorMsg, 'error')
    }
  } catch (err) {
    console.error('Error applying permissions:', err)
    showToast(err.response?.data?.message || err.message || 'Failed to apply permissions', 'error')
  } finally {
    applyLoading.value = false
  }
}

// Handle Check Permissions
const handleCheckPermissionsClick = async () => {
  // Validate: must have server connection
  if (!connectionInfo.value?.serverUri) {
    showToast('Server connection is required. Please select a server first.', 'error')
    return
  }
  
  // Validate: must have selected users
  if (selectedAdUsers.value.length === 0) {
    showToast('Please select at least one user to check permissions', 'error')
    return
  }
  
  checkLoading.value = true
  const userNames = selectedAdUsers.value.map(u => u.name)
  
  try {
    const requestBody = {
      serverUri: connectionInfo.value.serverUri
    }
    
    if (userNames.length === 1) {
      requestBody.userName = userNames[0]
    } else {
      requestBody.userNames = userNames
    }
    
    const response = await axios.post('/api/permissions/check', requestBody)
    
    if (response.data.success) {
      const permissions = response.data.permissions || []
      permissionsData.value = permissions
      
      if (userNames.length === 1) {
        showToast(`Loaded permissions for ${userNames[0]}`, 'success')
      } else {
        showToast(`Loaded mutual permissions for ${userNames.length} users: ${userNames.join(', ')}`, 'success')
      }
    } else {
      showToast(response.data.error || 'Failed to check permissions', 'error')
    }
  } catch (err) {
    console.error('Error checking permissions:', err)
    showToast(err.response?.data?.message || err.message || 'Failed to check permissions', 'error')
  } finally {
    checkLoading.value = false
  }
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
  
  // Close dropdowns when clicking outside
  window.addEventListener('click', (e) => {
    const target = e.target
    if (!target.closest('.user-search-container')) {
      showSearchResults.value = false
    }
  })
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
  grid-template-columns: 1fr;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.reports-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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

/* User Search Section at Top of Reports Panel */
.user-search-section {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.user-search-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.user-search-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-color);
  white-space: nowrap;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  height: 40px;
}

.user-search-container {
  position: relative;
  flex: 1;
  min-width: 250px;
  height: 40px;
}

.user-search-input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  height: 40px;
  box-sizing: border-box;
}

.user-search-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.dark-mode .user-search-input {
  background: #2c2c2c;
  color: white;
  border-color: #555;
}

.dark-mode .user-search-input:focus {
  border-color: #64b5f6;
  box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
}

.clear-input-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  color: #999;
  transition: color 0.2s ease;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-input-btn:hover {
  color: #666;
}

.dark-mode .clear-input-btn {
  color: #aaa;
}

.dark-mode .clear-input-btn:hover {
  color: #fff;
}

.live-search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  max-height: 320px;
  overflow-y: auto;
  animation: slideDown 0.2s ease;
}

.dark-mode .live-search-results {
  background: #2c2c2c;
  border-color: #444;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  border-bottom: 1px solid #f0f0f0;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: linear-gradient(90deg, #f5f8ff 0%, #f0f4ff 100%);
}

.dark-mode .search-result-item {
  border-bottom-color: #3a3a3a;
}

.dark-mode .search-result-item:hover {
  background: linear-gradient(90deg, #2a3540 0%, #2d3844 100%);
}

.search-result-item.selected {
  background: linear-gradient(90deg, #e3f2fd 0%, #bbdefb 100%);
}

.dark-mode .search-result-item.selected {
  background: linear-gradient(90deg, #1a2332 0%, #2c3e50 100%);
}

.search-result-item svg {
  flex-shrink: 0;
}

.search-result-item .user-type-icon {
  color: #2196f3;
}

.dark-mode .search-result-item .user-type-icon {
  color: #64b5f6;
}

.search-result-item .group-type-icon {
  color: #ff9800 !important;
}

.dark-mode .search-result-item .group-type-icon {
  color: #ffb74d !important;
}

.user-result-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.user-result-display {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-icon {
  color: #4caf50;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.loading-item,
.error-item,
.empty-item {
  justify-content: center;
  cursor: default;
  color: #666;
}

.loading-item {
  gap: 8px;
}

.error-item {
  color: #d32f2f;
  background: #ffebee;
}

.dark-mode .error-item {
  background: #3a1f1f;
  color: #ef5350;
}

.empty-item {
  font-style: italic;
}

.spinner-small {
  width: 14px;
  height: 14px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #2196f3;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 3px 6px;
  border-radius: 12px;
  margin-right: 6px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-indicator.active {
  background: #e8f5e9;
  color: #2e7d32 !important;
}

.status-indicator.inactive {
  background: #ffebee;
  color: #c62828 !important;
}

.dark-mode .status-indicator.active {
  background: #1b5e20;
  color: #81c784 !important;
}

.dark-mode .status-indicator.inactive {
  background: #b71c1c;
  color: #ef5350 !important;
}

.status-indicator svg {
  width: 12px;
  height: 12px;
  display: block;
}

.status-indicator svg path {
  stroke: currentColor !important;
}

.apply-btn-minimal-top,
.check-btn-minimal-top {
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  background: transparent;
  color: #6b7280;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 40px;
  min-width: 140px;
  flex-shrink: 0;
  box-sizing: border-box;
}

.apply-btn-minimal-top:hover:not(:disabled),
.check-btn-minimal-top:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
  border-color: rgba(0, 0, 0, 0.2);
}

.dark-mode .apply-btn-minimal-top,
.dark-mode .check-btn-minimal-top {
  color: #9ca3af;
}

.dark-mode .apply-btn-minimal-top:hover:not(:disabled),
.dark-mode .check-btn-minimal-top:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
  border-color: rgba(255, 255, 255, 0.2);
}

.apply-btn-minimal-top:disabled,
.check-btn-minimal-top:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected-users-tags-top {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-color);
}

.user-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 4px 10px;
  background: linear-gradient(135deg, #66bb6a 0%, #4caf50 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  position: relative;
}

.user-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
}

.user-tag svg {
  flex-shrink: 0;
}

.user-tag-remove {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.user-tag-remove:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dark-mode .user-tag {
  background: linear-gradient(135deg, #388e3c 0%, #2e7d32 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

/* User Info Button (Eye Icon) in Search Results */
.user-info-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  width: 32px;
  height: 32px;
  margin-left: 4px;
}

.user-info-btn:hover {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
  transform: translateY(-1px);
}

.user-info-btn:active {
  transform: translateY(0);
}

.dark-mode .user-info-btn {
  color: #999;
}

.dark-mode .user-info-btn:hover {
  background: rgba(100, 181, 246, 0.15);
  color: #64b5f6;
}

.user-info-btn svg {
  width: 18px;
  height: 18px;
  display: block;
}

/* Force LTR for AD data (names, emails are in English) */
.ltr-content {
  direction: ltr !important;
  text-align: left !important;
}

.ltr-content * {
  direction: ltr !important;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Content */
.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dark-mode .modal-content {
  background: #2c2c2c;
  border: 1px solid #444;
}

/* Modal Header */
.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dark-mode .modal-header {
  border-bottom-color: #444;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #333;
}

.dark-mode .modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

/* Modal Search */
.modal-search {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.dark-mode .modal-search {
  border-bottom-color: #444;
}

.modal-search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  color: var(--text-color);
  transition: all 0.2s ease;
}

.modal-search-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.dark-mode .modal-search-input {
  background: #1e1e1e;
  border-color: #555;
}

.dark-mode .modal-search-input:focus {
  border-color: #64b5f6;
  box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
}

/* Modal Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  min-height: 200px;
}

.modal-empty {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
  font-style: italic;
}

/* Modal scrollbar */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.dark-mode .modal-body::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.dark-mode .modal-body::-webkit-scrollbar-thumb {
  background: #555;
}

.dark-mode .modal-body::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* User Details Modal Styles */
.user-details-modal {
  max-width: 900px;
  max-height: 90vh;
}

.user-details-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-section {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
}

.details-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark-mode .detail-label {
  color: #999;
}

.detail-value {
  font-size: 0.9rem;
  color: var(--text-color);
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background: #ffebee;
  color: #c62828;
}

.dark-mode .status-badge.active {
  background: #1b5e20;
  color: #81c784;
}

.dark-mode .status-badge.inactive {
  background: #b71c1c;
  color: #ef5350;
}

/* Manager Chain Styles */
.manager-chain {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.manager-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  align-items: center;
  transition: all 0.2s ease;
}

.manager-item.current-user {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 2px solid #2196f3;
}

.dark-mode .manager-item {
  background: #2c2c2c;
}

.dark-mode .manager-item.current-user {
  background: linear-gradient(135deg, #1a2332 0%, #2c3e50 100%);
  border-color: #64b5f6;
}

.manager-level {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.dark-mode .manager-level {
  color: #999;
}

.manager-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.manager-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-color);
}

.manager-meta {
  font-size: 0.85rem;
  color: #666;
}

.dark-mode .manager-meta {
  color: #999;
}

.hierarchy-arrow {
  font-size: 1.5rem;
  color: #2196f3;
  font-weight: bold;
}

.dark-mode .hierarchy-arrow {
  color: #64b5f6;
}

/* Direct Reports Styles */
.direct-reports-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.report-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.report-item:hover {
  background: #e3f2fd;
  transform: translateX(4px);
}

.dark-mode .report-item {
  background: #2c2c2c;
}

.dark-mode .report-item:hover {
  background: #1a2332;
}

.report-item svg {
  color: #2196f3;
  flex-shrink: 0;
}

.dark-mode .report-item svg {
  color: #64b5f6;
}

.report-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.report-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
}

.report-meta {
  font-size: 0.8rem;
  color: #666;
}

.dark-mode .report-meta {
  color: #999;
}

/* Groups List Styles */
.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.group-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.group-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.dark-mode .group-badge {
  background: linear-gradient(135deg, #ef6c00 0%, #d84315 100%);
}

.show-more-groups-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.show-more-groups-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: #999;
}

.dark-mode .show-more-groups-btn {
  color: #999;
}

.dark-mode .show-more-groups-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Group Members Modal Styles */
.group-info-header {
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.dark-mode .group-info-header {
  background: #2c2c2c;
}

.member-count {
  font-weight: 600;
  color: #2196f3;
  margin: 0.5rem 0 0 0;
}

.dark-mode .member-count {
  color: #64b5f6;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.member-item:hover {
  background: #e3f2fd;
}

.dark-mode .member-item {
  background: #2c2c2c;
}

.dark-mode .member-item:hover {
  background: #1a2332;
}

.member-item svg {
  color: #2196f3;
  flex-shrink: 0;
}

.dark-mode .member-item svg {
  color: #64b5f6;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.member-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
}

.member-meta {
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dark-mode .member-meta {
  color: #999;
}

.member-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.member-type-badge.user {
  background: #e3f2fd;
  color: #1976d2;
}

.member-type-badge.group {
  background: #fff3e0;
  color: #f57c00;
}

.dark-mode .member-type-badge.user {
  background: #1a2332;
  color: #64b5f6;
}

.dark-mode .member-type-badge.group {
  background: #2a1f0f;
  color: #ffb74d;
}

/* Loading and Error States */
.loading-section,
.error-section {
  padding: 3rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.error-section {
  color: #d32f2f;
  background: #ffebee;
  border-radius: 8px;
  padding: 2rem;
}

.dark-mode .error-section {
  background: #3a1f1f;
  color: #ef5350;
}

/* Responsive Design for Modals */
@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .manager-item {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .hierarchy-arrow {
    text-align: center;
  }
}
</style>
