<template>
  <div class="permissions-panel">
    <h2>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2C8.34315 2 7 3.34315 7 5V8H6C5.44772 8 5 8.44772 5 9V17C5 17.5523 5.44772 18 6 18H14C14.5523 18 15 17.5523 15 17V9C15 8.44772 14.5523 8 14 8H13V5C13 3.34315 11.6569 2 10 2ZM11 8V5C11 4.44772 10.5523 4 10 4C9.44772 4 9 4.44772 9 5V8H11Z" fill="currentColor"/>
      </svg>
      {{ t('setUserAccess') }}
    </h2>

    <!-- User Input Row -->
    <div class="form-section user-input-row">
      <label>{{ t('userNameOrGroup') }}</label>
      <div class="user-input-container">
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
                  <!-- Person 1 (Left) -->
                  <circle cx="5.5" cy="5" r="2.5" fill="currentColor"/>
                  <path d="M1 14C1 11.7909 2.79086 10 5 10C6.48 10 7.77 10.81 8.46 12" fill="currentColor"/>
                  
                  <!-- Person 2 (Center - Larger) -->
                  <circle cx="10" cy="4.5" r="3" fill="currentColor"/>
                  <path d="M5 16C5 13.2386 7.23858 11 10 11C12.7614 11 15 13.2386 15 16V17H5V16Z" fill="currentColor"/>
                  
                  <!-- Person 3 (Right) -->
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
      </div>
    </div>

    <!-- Apply and Check Permission Buttons Row -->
    <div class="form-section buttons-row">
      <label></label>
      <div class="buttons-container">
        <!-- Apply Button -->
        <button
          class="apply-btn-minimal"
          @click="handleApplyPermissions"
          :disabled="loading || (selectedItems.length === 0 && props.markedForRemovalItems.length === 0) || selectedAdUsers.length === 0 || !hasActualChanges"
        >
          <span v-if="loading" class="spinner-small"></span>
          <span v-else>{{ t('applyPermissions') }}</span>
        </button>
        
        <!-- Check Permission Button -->
        <button
          class="check-btn-minimal"
          @click="handleCheckPermissions"
          :disabled="checkLoading || selectedAdUsers.length === 0"
        >
          <span v-if="checkLoading" class="spinner-small"></span>
          <span v-else>{{ t('checkPermissions') }}</span>
        </button>
      </div>
    </div>

    <!-- Selected Users Tags - Below the input row -->
    <div v-if="selectedAdUsers.length > 0" class="selected-users-section">
      <div class="selected-users-tags">
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


    <!-- Selected Items Summary -->
    <div class="form-section selected-items-section">
      <label>{{ t('selectedItems') }}</label>
      <div class="form-content">
        <div v-if="selectedItems.length === 0" class="selected-info">
          {{ t('noItemsSelected') }}
        </div>
        
        <div v-else class="selected-tags-container">
          <!-- Summary Badges -->
          <div class="summary-badges">
            <span class="badge success">{{ t('total') }}: {{ selectedItems.length }} {{ t('selected') }}</span>
            <span class="badge">{{ reportCount }} {{ t('reports') }}</span>
            <span class="badge">{{ folderCount }} {{ t('folders') }}</span>
          </div>
          
          <!-- Item Tags - With Show More Tag -->
          <div class="tags-scrollable">
            <!-- Folders Section -->
            <div v-if="selectedFolders.length > 0" class="tags-line">
              <span v-for="folder in displayedFolders" :key="folder.path" class="item-tag folder-tag">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 4C3 3.44772 3.44772 3 4 3H8.58579C8.851 3 9.10536 3.10536 9.29289 3.29289L11 5H16C16.5523 5 17 5.44772 17 6V15C17 15.5523 16.5523 16 16 16H4C3.44772 16 3 15.5523 3 15V4Z" fill="currentColor"/>
                </svg>
                {{ folder.name || folder.path.split('/').pop() }}
                <button @click.stop="removeItem(folder, 'folder')" class="tag-remove-btn">×</button>
              </span>
              <span v-if="hasMoreFolders" @click="openModal('folders')" class="item-tag folder-tag show-more-tag">
                +{{ remainingFoldersCount }} {{ t('showMore') }}
              </span>
            </div>
          
            <!-- PBIX Reports Section -->
            <div v-if="selectedPbixReports.length > 0" class="tags-line">
              <span v-for="report in displayedPbixReports" :key="report.id" class="item-tag pbix-tag">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="3" height="12" rx="1" fill="currentColor"/>
                  <rect x="8" y="2" width="3" height="14" rx="1" fill="currentColor"/>
                  <rect x="13" y="6" width="3" height="10" rx="1" fill="currentColor"/>
                </svg>
                {{ report.name.replace(/\.(pbix|rdl)$/i, '') }}
                <button @click.stop="removeItem(report, 'pbix')" class="tag-remove-btn">×</button>
              </span>
              <span v-if="hasMorePbix" @click="openModal('pbix')" class="item-tag pbix-tag show-more-tag">
                +{{ remainingPbixCount }} {{ t('showMore') }}
              </span>
            </div>
          
            <!-- RDL Reports Section -->
            <div v-if="selectedRdlReports.length > 0" class="tags-line">
              <span v-for="report in displayedRdlReports" :key="report.id" class="item-tag rdl-tag">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 3C4.44772 3 4 3.44772 4 4V16C4 16.5523 4.44772 17 5 17H15C15.5523 17 16 16.5523 16 16V7L12 3H5Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <path d="M12 3V7H16" stroke="currentColor" stroke-width="1.5" fill="none"/>
                  <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="1.5"/>
                  <line x1="7" y1="13" x2="13" y2="13" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                {{ report.name.replace(/\.(pbix|rdl)$/i, '') }}
                <button @click.stop="removeItem(report, 'rdl')" class="tag-remove-btn">×</button>
              </span>
              <span v-if="hasMoreRdl" @click="openModal('rdl')" class="item-tag rdl-tag show-more-tag">
                +{{ remainingRdlCount }} {{ t('showMore') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Info Box -->
    <div v-if="loading" class="info-box-floating">
      {{ t('applyingInfo') }}
    </div>

    <!-- Modal for viewing all items -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-search">
          <input
            v-model="modalSearchQuery"
            type="text"
            :placeholder="t('searchPlaceholder')"
            class="modal-search-input"
          />
        </div>
        <div class="modal-body">
          <div v-if="filteredModalItems.length === 0" class="modal-empty">
            {{ t('noItemsFound') }}
          </div>
          <div v-else class="modal-tags">
            <span v-for="item in filteredModalItems" :key="item.key" class="item-tag" :class="modalItemClass">
              <svg v-if="modalType === 'folders'" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 4C3 3.44772 3.44772 3 4 3H8.58579C8.851 3 9.10536 3.10536 9.29289 3.29289L11 5H16C16.5523 5 17 5.44772 17 6V15C17 15.5523 16.5523 16 16 16H4C3.44772 16 3 15.5523 3 15V4Z" fill="currentColor"/>
              </svg>
              <svg v-else-if="modalType === 'pbix'" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="3" height="12" rx="1" fill="currentColor"/>
                <rect x="8" y="2" width="3" height="14" rx="1" fill="currentColor"/>
                <rect x="13" y="6" width="3" height="10" rx="1" fill="currentColor"/>
              </svg>
              <svg v-else-if="modalType === 'rdl'" width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3C4.44772 3 4 3.44772 4 4V16C4 16.5523 4.44772 17 5 17H15C15.5523 17 16 16.5523 16 16V7L12 3H5Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M12 3V7H16" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="1.5"/>
                <line x1="7" y1="13" x2="13" y2="13" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              {{ item.name }}
            </span>
          </div>
        </div>
      </div>
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
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const props = defineProps({
  selectedItems: {
    type: Array,
    default: () => []
  },
  markedForRemovalItems: {
    type: Array,
    default: () => []
  },
  newItems: {
    type: Array,
    default: () => []
  },
  originalPermissionIds: {
    type: Array,
    default: () => []
  },
  connectionInfo: {
    type: Object,
    default: () => ({})
  },
  itemRoles: {
    type: Map,
    default: () => new Map()
  },
  reports: {
    type: Array,
    default: () => []
  },
  permissionsData: {
    type: Array,
    default: null
  },
  onSuccess: {
    type: Function,
    default: () => {}
  },
  onError: {
    type: Function,
    default: () => {}
  },
  onCheckPermissions: {
    type: Function,
    default: () => {}
  },
  onItemsSelected: {
    type: Function,
    default: () => {}
  }
})

const userName = ref('')

// Watch button disabled state for debugging
watch([() => hasActualChanges.value, () => props.selectedItems.length, () => selectedAdUsers.value.length, () => loading.value], 
  ([hasChanges, itemsCount, usersCount, isLoading]) => {
    const isDisabled = isLoading || itemsCount === 0 || usersCount === 0 || !hasChanges
    console.log('🔘 [Apply Button State]', {
      disabled: isDisabled,
      reasons: {
        loading: isLoading,
        noItems: itemsCount === 0,
        noUsers: usersCount === 0,
        noChanges: !hasChanges
      },
      hasActualChanges: hasChanges,
      selectedItemsCount: itemsCount,
      selectedUsersCount: usersCount
    })
  },
  { immediate: true }
)

const loading = ref(false)
const checkLoading = ref(false)

// AD User Selection
const selectedAdUsers = ref([])
const adUsers = ref([])
const adSearchQuery = ref('')
const adLoading = ref(false)
const adError = ref('')
const showSearchResults = ref(false)
let searchTimeout = null

// Permissions Count by Role
const permissionsCountByRole = ref({})
const showPermissionsCounts = ref(false)
const checkedUserName = ref('')

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

// Computed: Filter roles with count > 0 and format for display
const roleCountBadges = computed(() => {
  const badges = []
  
  for (const [role, count] of Object.entries(permissionsCountByRole.value)) {
    if (count > 0) {
      badges.push({ role, count })
    }
  }
  
  // Sort by count (descending)
  badges.sort((a, b) => b.count - a.count)
  
  return badges
})

// Computed: Total count of all permissions
const totalPermissionsCount = computed(() => {
  return Object.values(permissionsCountByRole.value).reduce((sum, count) => sum + count, 0)
})

// Tag Display - Calculate PER TYPE based on average name length
// Container: 913px measured
// Formula: (913px × 3 lines - showMoreWidth) / (avgTagWidth + gap)

const calculateMaxVisibleTags = (items, getItemName) => {
  if (items.length === 0) return 0
  
  const containerWidth = 913 // Fixed from measurement
  const showMoreWidth = 112 // From measurement
  const gap = 8
  
  // Calculate average name length for THIS type
  let totalChars = 0
  for (const item of items) {
    totalChars += getItemName(item).length
  }
  const avgNameLength = totalChars / items.length
  
  // Tag width = 60px overhead + (avgNameLength × 7px per char)
  const avgTagWidth = 60 + (avgNameLength * 7)
  
  // Total space for 3 lines minus "Show More"
  const totalSpace = (3 * containerWidth) - showMoreWidth - gap
  
  // Max tags = totalSpace / (avgTagWidth + gap)
  let maxTags = Math.floor(totalSpace / (avgTagWidth + gap))
  
  // Safety: reduce by 10% to ensure "Show More" fits on line 3
  maxTags = Math.floor(maxTags * 0.9)
  
  return Math.max(1, Math.min(maxTags, items.length))
}


// Computed properties for displayed items
const displayedFolders = computed(() => {
  const maxVisible = calculateMaxVisibleTags(
    selectedFolders.value,
    (folder) => folder.name || folder.path.split('/').pop()
  )
  
  if (selectedFolders.value.length <= maxVisible) {
    return selectedFolders.value
  }
  return selectedFolders.value.slice(0, maxVisible)
})

const displayedPbixReports = computed(() => {
  const maxVisible = calculateMaxVisibleTags(
    selectedPbixReports.value,
    (report) => report.name.replace(/\.(pbix|rdl)$/i, '')
  )
  
  if (selectedPbixReports.value.length <= maxVisible) {
    return selectedPbixReports.value
  }
  return selectedPbixReports.value.slice(0, maxVisible)
})

const displayedRdlReports = computed(() => {
  const maxVisible = calculateMaxVisibleTags(
    selectedRdlReports.value,
    (report) => report.name.replace(/\.(pbix|rdl)$/i, '')
  )
  
  if (selectedRdlReports.value.length <= maxVisible) {
    return selectedRdlReports.value
  }
  return selectedRdlReports.value.slice(0, maxVisible)
})

const hasMoreFolders = computed(() => selectedFolders.value.length > displayedFolders.value.length)
const hasMorePbix = computed(() => selectedPbixReports.value.length > displayedPbixReports.value.length)
const hasMoreRdl = computed(() => selectedRdlReports.value.length > displayedRdlReports.value.length)

const remainingFoldersCount = computed(() => selectedFolders.value.length - displayedFolders.value.length)
const remainingPbixCount = computed(() => selectedPbixReports.value.length - displayedPbixReports.value.length)
const remainingRdlCount = computed(() => selectedRdlReports.value.length - displayedRdlReports.value.length)

// Modal functionality
const showModal = ref(false)
const modalType = ref('') // 'folders', 'pbix', or 'rdl'
const modalSearchQuery = ref('')
const modalTitle = computed(() => {
  if (modalType.value === 'folders') return t('folders')
  if (modalType.value === 'pbix') return 'PBIX Reports'
  if (modalType.value === 'rdl') return 'RDL Reports'
  return ''
})
const modalItemClass = computed(() => {
  if (modalType.value === 'folders') return 'folder-tag'
  if (modalType.value === 'pbix') return 'pbix-tag'
  if (modalType.value === 'rdl') return 'rdl-tag'
  return ''
})

const availableRoles = [
  'Browser',
  'Content Manager',
  'My Reports',
  'Publisher',
  'Report Builder'
]

// Role translation mapping
const getRoleText = (role) => {
  const roleKey = 'role' + role.replace(/\s+/g, '')
  return t(roleKey)
}

// Check if there are role changes in the table
const hasRoleChanges = computed(() => {
  return props.itemRoles && props.itemRoles.size > 0
})

// Build a map of original permissions: nodeId -> roles
const originalPermissionsMap = computed(() => {
  const map = new Map()
  if (!props.permissionsData || props.permissionsData.length === 0) {
    return map
  }
  
  props.permissionsData.forEach(permission => {
    const path = permission.path || permission.fullPath || ''
    const permissionName = permission.name || ''
    
    // Normalize path: handle Unicode properly, don't use toLowerCase on Persian chars
    const normalizePath = (p) => {
      if (!p) return ''
      // Decode URL encoding if present
      try {
        p = decodeURIComponent(p)
      } catch (e) {
        // If decoding fails, use original
      }
      return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
    }
    const roles = permission.roles || []
    
    // Find the nodeId for this permission
    if (permission.itemType === 'Folder') {
      const nodeId = `folder_${permission.path}`
      map.set(nodeId, roles)
    } else if (permission.itemType === 'Report') {
      // Try to find report by ID first (most reliable, especially for Persian characters)
      let report = null
      if (permission.id) {
        report = props.reports.find(r => r.id === permission.id)
      }
      
      // If not found by ID, try to find by path/name matching (with better Unicode handling)
      if (!report) {
        const normalizedPermissionPath = normalizePath(path)
        const normalizedPermissionName = normalizePath(permissionName)
        const permissionFolderPath = permission.folderPath || (path.includes('/') ? path.substring(0, path.lastIndexOf('/')) || '/' : '/')
        
        report = props.reports.find(r => {
          const reportPath = r.path || '/'
          const reportName = r.name || ''
          const reportFullPath = r.fullPath || (r.path === '/' ? `/${r.name}` : r.path === '' ? `/${r.name}` : `${r.path}/${r.name}`)
          
          const normalizedReportPath = normalizePath(reportPath)
          const normalizedReportName = normalizePath(reportName)
          const normalizedReportFullPath = normalizePath(reportFullPath)
          const normalizedPermissionFolderPath = normalizePath(permissionFolderPath)
          
          // Strategy 1: Match by full path (most common - CatalogItems path matches report fullPath)
          if (normalizedReportFullPath === normalizedPermissionPath) {
            return true
          }
          
          // Strategy 2: Match folder path + name separately
          if (normalizedPermissionFolderPath === normalizedReportPath && normalizedPermissionName === normalizedReportName) {
            return true
          }
          
          // Strategy 3: Match just by name (for cases where path comparison fails due to encoding)
          if (normalizedPermissionName && normalizedReportName && 
              normalizedPermissionName === normalizedReportName &&
              (normalizedPermissionFolderPath === '/' || normalizedPermissionFolderPath === normalizedReportPath || normalizedReportPath === '/')) {
            return true
          }
          
          // Strategy 4: Match by extracting name from permission path
          const pathParts = normalizedPermissionPath.split('/').filter(p => p)
          const lastPathPart = pathParts[pathParts.length - 1] || ''
          if (lastPathPart && normalizedReportName === normalizePath(lastPathPart)) {
            if (normalizedReportPath === normalizedPermissionFolderPath || 
                (normalizedPermissionFolderPath === '/' && normalizedReportPath === '/') ||
                (normalizedPermissionPath === normalizedReportFullPath)) {
              return true
            }
          }
          
          // Strategy 5: Exact name match with compatible paths (fallback)
          if (permissionName === reportName && 
              (normalizedPermissionFolderPath === '/' || normalizedReportPath === '/') &&
              (normalizedPermissionPath.includes(reportName) || normalizedReportFullPath.includes(permissionName))) {
            return true
          }
          
          return false
        })
      }
      
      if (report) {
        const nodeId = `report_${report.id}`
        map.set(nodeId, roles)
      } else {
        console.warn(`⚠ Could not find report for permission in originalPermissionsMap:`, {
          permissionPath: path,
          permissionFolderPath: permission.folderPath || 'N/A',
          permissionName: permissionName,
          permissionId: permission.id || 'N/A'
        })
      }
    }
  })
  
  return map
})

// Check if there are actual changes (not just itemRoles entries, but actual differences)
const hasActualRoleChanges = computed(() => {
  const originalMap = originalPermissionsMap.value
  
  console.log('🔍 [hasActualRoleChanges] Computing...', {
    originalMapSize: originalMap.size,
    itemRolesSize: props.itemRoles?.size || 0,
    selectedItemsCount: props.selectedItems?.length || 0,
    markedForRemovalCount: props.markedForRemovalItems?.length || 0,
    newItemsCount: props.newItems?.length || 0
  })
  
  // If there are no original permissions, check if there are any itemRoles (new permissions)
  if (originalMap.size === 0) {
    const result = props.itemRoles && props.itemRoles.size > 0
    console.log('🔍 [hasActualRoleChanges] No original permissions, checking itemRoles:', result)
    return result
  }
  
  // If there are no itemRoles, check if there are items in originalMap that should be tracked
  // (this handles the case where items were removed from itemRoles but still have original permissions)
  if (!props.itemRoles || props.itemRoles.size === 0) {
    // Check if any items in originalPermissionsMap are in selectedItems but not in itemRoles
    // This indicates items that originally had permissions but are now being removed
    if (props.selectedItems && props.selectedItems.length > 0) {
      for (const item of props.selectedItems) {
        const nodeId = item.id ? `report_${item.id}` : `folder_${item.path}`
        if (originalMap.has(nodeId) && (!props.itemRoles || !props.itemRoles.has(nodeId))) {
          // This item originally had permissions but is no longer in itemRoles
          // This is a removal, so there's a change
          console.log('✅ [hasActualRoleChanges] Found removal: item in originalMap but not in itemRoles', {
            nodeId,
            itemName: item.name || item.path
          })
          return true
        }
      }
    }
    console.log('🔍 [hasActualRoleChanges] No itemRoles, no removals found')
    return false
  }
  
  // Check each item in itemRoles to see if it's different from original
  for (const [nodeId, currentRoles] of props.itemRoles.entries()) {
    const originalRoles = originalMap.get(nodeId) || []
    
    // Normalize roles arrays for comparison (sort and compare)
    const normalizeRoles = (roles) => {
      if (!roles || !Array.isArray(roles) || roles.length === 0) return ''
      return [...roles].sort().join(',')
    }
    const currentRolesStr = normalizeRoles(currentRoles)
    const originalRolesStr = normalizeRoles(originalRoles)
    
    // If roles are different, there's an actual change
    // This includes: empty array vs non-empty (removal), different roles (modification)
    if (currentRolesStr !== originalRolesStr) {
      console.log('✅ [hasActualRoleChanges] Found role change:', {
        nodeId,
        originalRoles: originalRolesStr || '(empty)',
        currentRoles: currentRolesStr || '(empty)',
        isRemoval: currentRolesStr === '' && originalRolesStr !== ''
      })
      return true
    }
  }
  
  // Also check if there are items in originalMap that are not in itemRoles
  // This handles the case where an item originally had permissions but was removed from itemRoles
  for (const [nodeId, originalRoles] of originalMap.entries()) {
    if (originalRoles && originalRoles.length > 0) {
      // If this item had original permissions but is not in itemRoles, it's a removal
      if (!props.itemRoles.has(nodeId)) {
        // Check if this item is in selectedItems (meaning it's still selected but roles were removed)
        const itemExists = props.selectedItems && props.selectedItems.some(item => {
          const itemNodeId = item.id ? `report_${item.id}` : `folder_${item.path}`
          return itemNodeId === nodeId
        })
        if (itemExists) {
          // Item is selected but not in itemRoles - this means all roles were removed
          console.log('✅ [hasActualRoleChanges] Found removal: item in originalMap and selectedItems but not in itemRoles', {
            nodeId,
            originalRoles: originalRoles.join(',')
          })
          return true
        }
      }
    }
  }
  
  // IMPORTANT: Also check items in markedForRemovalItems that originally had permissions
  // This handles the case where items are marked for removal (all roles deselected)
  // but might have been removed from itemRoles entirely
  if (props.markedForRemovalItems && props.markedForRemovalItems.length > 0) {
    for (const item of props.markedForRemovalItems) {
      const nodeId = item.id ? `report_${item.id}` : `folder_${item.path}`
      if (originalMap.has(nodeId)) {
        const originalRoles = originalMap.get(nodeId) || []
        if (originalRoles && originalRoles.length > 0) {
          // This item originally had permissions and is now marked for removal
          // Check if it's in itemRoles with empty array, or not in itemRoles at all
          const currentRoles = props.itemRoles?.get(nodeId)
          if (!currentRoles || currentRoles.length === 0) {
            // Item is marked for removal and has no roles (or empty array) - this is a change
            console.log('✅ [hasActualRoleChanges] Found removal: item in markedForRemovalItems with original permissions', {
              nodeId,
              itemName: item.name || item.path,
              originalRoles: originalRoles.join(','),
              currentRoles: currentRoles?.length === 0 ? '(empty)' : '(not in itemRoles)'
            })
            return true
          }
        }
      }
    }
  }
  
  console.log('❌ [hasActualRoleChanges] No changes detected')
  return false
})

// Check if there are any actual changes (new items, removals, or role changes)
const hasActualChanges = computed(() => {
  const hasNewItems = props.newItems.length > 0
  const hasRemovals = props.markedForRemovalItems.length > 0
  const hasRoleChanges = hasActualRoleChanges.value
  
  const result = hasNewItems || hasRemovals || hasRoleChanges
  
  console.log('📊 [hasActualChanges] Final check:', {
    hasNewItems,
    hasRemovals,
    hasRoleChanges,
    result,
    newItemsCount: props.newItems.length,
    markedForRemovalCount: props.markedForRemovalItems.length,
    buttonEnabled: result && props.selectedItems.length > 0 && props.selectedAdUsers.length > 0
  })
  
  return result
})

const reportCount = computed(() => {
  return props.selectedItems.filter(i => {
    return i.type && (i.type.includes('Report') || i.type.includes('PBIX') || i.type.includes('RDL'))
  }).length
})

const folderCount = computed(() => {
  return props.selectedItems.filter(i => i.type === 'Folder').length
})

const selectedFolders = computed(() => {
  return props.selectedItems.filter(i => i.type === 'Folder')
})

const selectedPbixReports = computed(() => {
  return props.selectedItems.filter(i => i.type && i.type.includes('PBIX'))
})

const selectedRdlReports = computed(() => {
  return props.selectedItems.filter(i => i.type && i.type.includes('RDL') && !i.type.includes('PBIX'))
})

// Remove item from selection
const removeItem = (item, type) => {
  const currentItems = [...props.selectedItems]
  let indexToRemove = -1
  
  if (type === 'folder') {
    indexToRemove = currentItems.findIndex(i => i.type === 'Folder' && i.path === item.path)
  } else {
    indexToRemove = currentItems.findIndex(i => i.id === item.id)
  }
  
  if (indexToRemove > -1) {
    currentItems.splice(indexToRemove, 1)
    props.onItemsSelected(currentItems)
  }
}

// Modal items with search filtering
const filteredModalItems = computed(() => {
  let items = []
  
  if (modalType.value === 'folders') {
    items = selectedFolders.value.map(f => ({
      key: f.path,
      name: f.name || f.path.split('/').pop()
    }))
  } else if (modalType.value === 'pbix') {
    items = selectedPbixReports.value.map(r => ({
      key: r.id,
      name: r.name.replace(/\.(pbix|rdl)$/i, '')
    }))
  } else if (modalType.value === 'rdl') {
    items = selectedRdlReports.value.map(r => ({
      key: r.id,
      name: r.name.replace(/\.(pbix|rdl)$/i, '')
    }))
  }
  
  if (!modalSearchQuery.value.trim()) {
    return items
  }
  
  const searchLower = modalSearchQuery.value.toLowerCase()
  return items.filter(item => item.name.toLowerCase().includes(searchLower))
})

const openModal = (type) => {
  modalType.value = type
  modalSearchQuery.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  modalSearchQuery.value = ''
  modalType.value = ''
}


// AD User Selection Functions
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

  // Debounce search - faster response
  searchTimeout = setTimeout(async () => {
    adLoading.value = true
    adError.value = ''

    try {
      const adConfig = props.connectionInfo?.adConfig
      
      if (!adConfig) {
        adError.value = 'Active Directory configuration is missing. Please check your backend .env file for LDAP settings, or reload the page.'
        adLoading.value = false
        console.warn('AD Config missing:', props.connectionInfo)
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
      // Handle size limit exceeded more gracefully
      if (errorMsg.includes('Size Limit Exceeded') || errorMsg.includes('SizeLimitExceeded')) {
        adError.value = 'Too many results. Please be more specific in your search.'
      } else {
        adError.value = errorMsg
      }
    } finally {
      adLoading.value = false
    }
  }, 300) // 300ms debounce - faster response
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
    // Already selected, remove it
    selectedAdUsers.value.splice(index, 1)
  } else {
    // Not selected, add it
    selectedAdUsers.value.push(user)
  }
  // Don't close results, let user continue selecting
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
    const adConfig = props.connectionInfo?.adConfig
    
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
    const adConfig = props.connectionInfo?.adConfig
    
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

const handleApplyPermissions = async () => {
  // Validate: must have actual changes
  if (!hasActualChanges.value) {
    if (props.onError) {
      props.onError('No changes to apply. All checked items already have the selected permissions.')
    }
    return
  }

  // Get user names from AD selection
  let userNames = []
  if (selectedAdUsers.value.length === 0) {
    if (props.onError) {
      props.onError('Please select at least one user from Active Directory')
    }
    return
  }
  userNames = selectedAdUsers.value.map(u => u.name)

  // Check if new items have roles assigned in itemRoles
  if (props.newItems.length > 0) {
    const hasRolesForNewItems = props.newItems.some(item => {
      const nodeId = item.id ? `report_${item.id}` : `folder_${item.path}`
      return props.itemRoles && props.itemRoles.has(nodeId) && props.itemRoles.get(nodeId).length > 0
    })
    
    if (!hasRolesForNewItems && !hasActualRoleChanges.value) {
      if (props.onError) {
        props.onError('Please assign roles to items using the role tags in the table before applying permissions.')
      }
      return
    }
  }

  // Get items with role changes (items that are in originalPermissions but have actual role changes)
  // Separate items with empty roles (removing all roles) from items with role modifications
  const itemsWithRoleChanges = []
  const itemsRemovingAllRoles = [] // Items where all roles are removed (empty roles array)
  const markedForRemovalNodeIds = new Set()
  props.markedForRemovalItems.forEach(item => {
    if (item.id) {
      markedForRemovalNodeIds.add(`report_${item.id}`)
    } else if (item.path) {
      markedForRemovalNodeIds.add(`folder_${item.path}`)
    }
  })
  
  if (hasActualRoleChanges.value && props.itemRoles && props.itemRoles.size > 0) {
    const originalMap = originalPermissionsMap.value
    // We need to map nodeIds to actual items
    // Check both selectedItems and originalPermissionIds to find items
    props.itemRoles.forEach((roles, nodeId) => {
      // Skip items marked for removal - they will be handled in the removal section
      if (markedForRemovalNodeIds.has(nodeId)) {
        return
      }
      
      // Find the item that matches this nodeId
      // First try selectedItems
      let item = props.selectedItems.find(selectedItem => {
        if (nodeId.startsWith('report_')) {
          const reportId = nodeId.replace('report_', '')
          return selectedItem.id === reportId
        } else if (nodeId.startsWith('folder_')) {
          const folderPath = nodeId.replace('folder_', '')
          return selectedItem.type === 'Folder' && selectedItem.path === folderPath
        }
        return false
      })
      
      // If not found in selectedItems, try to find it from reports list
      if (!item) {
        if (nodeId.startsWith('report_')) {
          const reportId = nodeId.replace('report_', '')
          // Find report from reports list
          const report = props.reports.find(r => r.id === reportId)
          if (report) {
            item = report
          }
        }
      }
      
      // If still not found, try to find it from permissionsData (for mutual permissions items)
      // This is CRITICAL for items from mutual permissions that might not be in selectedItems
      if (!item && props.permissionsData && props.permissionsData.length > 0) {
        // Normalize path function for Unicode/Persian character handling
        const normalizePath = (p) => {
          if (!p) return ''
          // Decode URL encoding if present (important for Persian characters)
          try {
            p = decodeURIComponent(p)
          } catch (e) {
            // If decoding fails, use original
          }
          return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
        }
        
        if (nodeId.startsWith('report_')) {
          const reportId = nodeId.replace('report_', '')
          // Find permission from permissionsData - try by ID first (most reliable)
          let permission = props.permissionsData.find(p => p.id === reportId && p.itemType === 'Report')
          
          // If not found by ID, try by path matching with normalization (for Persian names)
          // This is important for items that are NOT in mutual permissions but are in one user's permissions
          if (!permission) {
            // Try to find report from reports list to get the correct path
            const report = props.reports.find(r => r.id === reportId)
            if (report) {
              const reportPath = report.path || report.fullPath || ''
              const reportName = report.name || ''
              const reportFullPath = report.fullPath || (report.path === '/' ? `/${report.name}` : report.path === '' ? `/${report.name}` : `${report.path}/${report.name}`)
              
              const normalizedReportPath = normalizePath(reportPath)
              const normalizedReportFullPath = normalizePath(reportFullPath)
              
              console.log(`🔍 [Apply Permissions] Trying to find permission by path matching (for Persian names):`, {
                reportId,
                reportName,
                reportPath,
                reportFullPath,
                normalizedReportFullPath,
                permissionsDataCount: props.permissionsData.length
              })
              
              // Find permission by matching normalized paths
              permission = props.permissionsData.find(p => {
                if (p.itemType !== 'Report') return false
                const permPath = p.path || p.fullPath || ''
                const permFullPath = p.fullPath || p.path || ''
                const normalizedPermPath = normalizePath(permPath)
                const normalizedPermFullPath = normalizePath(permFullPath)
                
                // Match by full path or path + name (with normalization for Persian characters)
                const match = normalizedPermFullPath === normalizedReportFullPath || 
                       normalizedPermPath === normalizedReportPath ||
                       (p.name && normalizePath(p.name) === normalizePath(reportName))
                
                if (match) {
                  console.log(`✅ [Apply Permissions] Found permission by path matching:`, {
                    permissionId: p.id,
                    permissionName: p.name,
                    permissionPath: permPath,
                    permissionFullPath: permFullPath,
                    normalizedPermissionFullPath: normalizedPermFullPath
                  })
                }
                
                return match
              })
            }
          }
          
          // If still not found, log a warning with details for debugging Persian name issues
          if (!permission) {
            console.warn(`⚠ [Apply Permissions] Could not find permission in permissionsData for report:`, {
              reportId,
              permissionsDataCount: props.permissionsData.length,
              samplePermissions: props.permissionsData.filter(p => p.itemType === 'Report').slice(0, 5).map(p => ({
                id: p.id,
                name: p.name,
                path: p.path || p.fullPath,
                normalizedPath: normalizePath(p.path || p.fullPath)
              }))
            })
          }
          
          if (permission) {
            console.log(`✅ [Apply Permissions] Found item from permissionsData (mutual permissions):`, {
              nodeId,
              reportId,
              permissionName: permission.name,
              permissionPath: permission.path || permission.fullPath,
              foundBy: permission.id === reportId ? 'ID' : 'Path matching'
            })
            // Construct item from permission data
            item = {
              id: permission.id,
              name: permission.name,
              path: permission.path || permission.fullPath,
              fullPath: permission.fullPath || permission.path,
              type: 'Report',
              itemType: 'Report'
            }
          } else {
            console.warn(`⚠ [Apply Permissions] Could not find report in permissionsData:`, {
              nodeId,
              reportId,
              permissionsDataCount: props.permissionsData.length,
              samplePermissions: props.permissionsData.slice(0, 3).map(p => ({
                id: p.id,
                name: p.name,
                path: p.path || p.fullPath,
                itemType: p.itemType
              }))
            })
          }
        } else if (nodeId.startsWith('folder_')) {
          const folderPath = nodeId.replace('folder_', '')
          const normalizedFolderPath = normalizePath(folderPath)
          
          // Find permission from permissionsData with path normalization (critical for Persian names)
          const permission = props.permissionsData.find(p => {
            if (p.itemType !== 'Folder') return false
            const permPath = p.path || p.fullPath || ''
            const permFullPath = p.fullPath || p.path || ''
            const normalizedPermPath = normalizePath(permPath)
            const normalizedPermFullPath = normalizePath(permFullPath)
            
            // Match with normalized paths (handles URL encoding differences for Persian characters)
            return normalizedPermPath === normalizedFolderPath || 
                   normalizedPermFullPath === normalizedFolderPath ||
                   permPath === folderPath || 
                   permFullPath === folderPath
          })
          
          if (permission) {
            console.log(`✅ [Apply Permissions] Found folder from permissionsData (mutual permissions):`, {
              nodeId,
              folderPath,
              normalizedFolderPath,
              permissionName: permission.name,
              permissionPath: permission.path || permission.fullPath,
              normalizedPermissionPath: normalizePath(permission.path || permission.fullPath)
            })
            item = {
              type: 'Folder',
              path: permission.path || permission.fullPath,
              name: permission.name || folderPath.split('/').pop(),
              itemType: 'Folder'
            }
          } else {
            console.warn(`⚠ [Apply Permissions] Could not find folder in permissionsData:`, {
              nodeId,
              folderPath,
              normalizedFolderPath,
              permissionsDataCount: props.permissionsData.length,
              samplePermissions: props.permissionsData.filter(p => p.itemType === 'Folder').slice(0, 3).map(p => ({
                name: p.name,
                path: p.path || p.fullPath,
                normalizedPath: normalizePath(p.path || p.fullPath)
              }))
            })
            // Fallback: construct from nodeId if not found in permissionsData
            item = {
              type: 'Folder',
              path: folderPath,
              name: folderPath.split('/').pop(),
              itemType: 'Folder'
            }
          }
        }
      }
      
      // Last resort: construct from nodeId or reports list if still not found
      // This is important for items NOT in mutual permissions (like Persian-named items)
      if (!item) {
        if (nodeId.startsWith('report_')) {
          const reportId = nodeId.replace('report_', '')
          // Try to find from reports list one more time
          const report = props.reports.find(r => r.id === reportId)
          if (report) {
            console.log(`✅ [Apply Permissions] Found item from reports list (fallback for non-mutual items):`, {
              nodeId,
              reportId,
              reportName: report.name,
              reportPath: report.path || report.fullPath
            })
            item = report
          } else {
            console.warn(`⚠ [Apply Permissions] Could not find report anywhere for nodeId: ${nodeId}`, {
              reportId,
              reportsCount: props.reports.length,
              permissionsDataCount: props.permissionsData ? props.permissionsData.length : 0
            })
          }
        } else if (nodeId.startsWith('folder_')) {
          const folderPath = nodeId.replace('folder_', '')
          item = {
            type: 'Folder',
            path: folderPath,
            name: folderPath.split('/').pop(),
            itemType: 'Folder'
          }
        }
      }
      
      // Only process if we found the item
      if (item) {
        const originalRoles = originalMap.get(nodeId) || []
        const hasOriginalPermissions = originalMap.has(nodeId)
        
        // Check if all roles are being removed (empty roles array)
        if (!roles || roles.length === 0) {
          // This is removing all roles - treat as removal, not role update
          // Only if it originally had permissions
          if (hasOriginalPermissions) {
            itemsRemovingAllRoles.push(item)
          }
        } else {
          // Normalize roles arrays for comparison
          const normalizeRoles = (roles) => [...roles].sort().join(',')
          const currentRolesStr = normalizeRoles(roles || [])
          const originalRolesStr = normalizeRoles(originalRoles)
          
          console.log(`🔍 [Apply Permissions] Processing item from itemRoles:`, {
            nodeId,
            itemName: item.name || item.path,
            currentRoles: roles,
            originalRoles: originalRoles,
            currentRolesStr,
            originalRolesStr,
            isDifferent: currentRolesStr !== originalRolesStr,
            hasOriginalPermissions,
            isMultipleUsers: userNames.length > 1
          })
          
          // IMPORTANT: If item is NOT in originalPermissionsMap (not in mutual permissions),
          // it means some users don't have it yet. We need to:
          // 1. Add it to itemsWithRoleChanges for users who already have it (to update their roles)
          // 2. The API call will handle adding it for users who don't have it (the set endpoint works for both add and update)
          // So we always add to itemsWithRoleChanges if roles are different, regardless of hasOriginalPermissions
          // 
          // CRITICAL: For items NOT in mutual permissions (hasOriginalPermissions = false):
          // - originalRoles will be [] (empty array)
          // - If user has added role tags, currentRoles will have values
          // - So currentRolesStr !== originalRolesStr will be true (e.g., "Browser,Content Manager" !== "")
          // - This ensures items with role tags are always processed and applied to ALL users
          if (currentRolesStr !== originalRolesStr) {
            console.log(`✅ [Apply Permissions] Adding item to itemsWithRoleChanges (roles differ):`, {
              itemName: item.name || item.path,
              currentRoles: roles,
              originalRoles: originalRoles,
              hasOriginalPermissions,
              note: hasOriginalPermissions 
                ? 'Item in mutual permissions - will update all users' 
                : 'Item NOT in mutual permissions - will ADD for users without it, UPDATE for users with it'
            })
            itemsWithRoleChanges.push({
              item,
              roles: roles || [] // Ensure it's an array
            })
          } else {
            // If roles match original, but item is NOT in mutual permissions and has role tags,
            // we should still add it to ensure it's applied to users who don't have it
            if (!hasOriginalPermissions && roles && roles.length > 0) {
              console.log(`✅ [Apply Permissions] Adding item to itemsWithRoleChanges (not in mutual, has role tags):`, {
                itemName: item.name || item.path,
                currentRoles: roles,
                originalRoles: originalRoles,
                note: 'Item NOT in mutual permissions but has role tags - will ADD for users without it'
              })
              itemsWithRoleChanges.push({
                item,
                roles: roles || []
              })
            } else {
              console.log(`ℹ️ [Apply Permissions] Skipping item (roles match original):`, {
                itemName: item.name || item.path,
                roles: roles,
                originalRoles: originalRoles
              })
            }
          }
        }
      } else {
        // Log warning if item with role tags couldn't be found
        console.warn(`⚠ [Apply Permissions] Could not find item for nodeId with roles: ${nodeId}`, {
          roles,
          selectedItemsCount: props.selectedItems.length,
          reportsCount: props.reports.length,
          permissionsDataCount: props.permissionsData ? props.permissionsData.length : 0,
          itemRolesKeys: Array.from(props.itemRoles.keys())
        })
      }
    })
  }

  // IMPORTANT: Also check selectedItems that have role tags but weren't detected as changes
  // This handles cases where items are selected with role tags but might not be in itemRoles
  // or where the comparison logic missed them
  if (props.selectedItems && props.selectedItems.length > 0 && props.itemRoles && props.itemRoles.size > 0) {
    props.selectedItems.forEach(selectedItem => {
      // Skip if already processed
      const nodeId = selectedItem.id ? `report_${selectedItem.id}` : `folder_${selectedItem.path}`
      
      // Skip if already in itemsWithRoleChanges or marked for removal
      const alreadyProcessed = itemsWithRoleChanges.some(({ item }) => 
        (item.id && selectedItem.id && item.id === selectedItem.id) ||
        (item.path && selectedItem.path && item.path === selectedItem.path)
      )
      if (alreadyProcessed || markedForRemovalNodeIds.has(nodeId)) {
        return
      }
      
      // Check if this item has role tags in itemRoles
      if (props.itemRoles.has(nodeId)) {
        const roles = props.itemRoles.get(nodeId)
        const originalRoles = originalPermissionsMap.value.get(nodeId) || []
        
        // Only add if roles are different and not empty
        if (roles && roles.length > 0) {
          const normalizeRoles = (roles) => [...roles].sort().join(',')
          const currentRolesStr = normalizeRoles(roles)
          const originalRolesStr = normalizeRoles(originalRoles)
          
          console.log('🔍 [Apply Permissions] Checking selectedItem with role tags:', {
            nodeId,
            itemName: selectedItem.name || selectedItem.path,
            currentRoles: roles,
            originalRoles: originalRoles,
            currentRolesStr,
            originalRolesStr,
            isDifferent: currentRolesStr !== originalRolesStr,
            alreadyProcessed,
            hasOriginalPermissions: originalPermissionsMap.value.has(nodeId)
          })
          
          // IMPORTANT: Always add if roles are different OR if item is in selectedItems with role tags
          // This ensures that when user modifies role tags on a selected item, it gets applied to all users
          // even if the comparison logic might have missed it
          if (currentRolesStr !== originalRolesStr) {
            // Check if not already in itemsWithRoleChanges
            const exists = itemsWithRoleChanges.some(({ item }) => 
              (item.id && selectedItem.id && item.id === selectedItem.id) ||
              (item.path && selectedItem.path && item.path === selectedItem.path)
            )
            if (!exists) {
              console.log('✅ [Apply Permissions] Adding selectedItem to itemsWithRoleChanges:', {
                itemName: selectedItem.name || selectedItem.path,
                roles,
                reason: 'Roles differ from original'
              })
              itemsWithRoleChanges.push({
                item: selectedItem,
                roles: roles
              })
            } else {
              console.log('⚠️ [Apply Permissions] selectedItem already in itemsWithRoleChanges:', {
                itemName: selectedItem.name || selectedItem.path
              })
            }
          } else {
            console.log('ℹ️ [Apply Permissions] selectedItem roles match original, skipping:', {
              itemName: selectedItem.name || selectedItem.path,
              roles: roles,
              originalRoles: originalRoles
            })
          }
        } else {
          console.log('⚠️ [Apply Permissions] selectedItem has empty roles, skipping:', {
            itemName: selectedItem.name || selectedItem.path,
            nodeId
          })
        }
      } else {
        console.log('ℹ️ [Apply Permissions] selectedItem does not have role tags in itemRoles:', {
          itemName: selectedItem.name || selectedItem.path,
          nodeId,
          itemRolesKeys: Array.from(props.itemRoles.keys())
        })
      }
    })
  }
  
  // Log final state before applying
  console.log('📊 [Apply Permissions] Final state before applying:', {
    itemsWithRoleChangesCount: itemsWithRoleChanges.length,
    newItemsCount: props.newItems.length,
    allRemovalItemsCount: allRemovalItems.length,
    userNames: userNames,
    itemsWithRoleChanges: itemsWithRoleChanges.map(({ item, roles }) => ({
      itemName: item.name || item.path,
      roles
    }))
  })

  // Combine all removal items (marked for removal + items with all roles removed)
  // Remove duplicates by comparing item IDs/paths
  const allRemovalItemsMap = new Map()
  props.markedForRemovalItems.forEach(item => {
    const key = item.id ? `report_${item.id}` : `folder_${item.path}`
    allRemovalItemsMap.set(key, item)
  })
  itemsRemovingAllRoles.forEach(item => {
    const key = item.id ? `report_${item.id}` : `folder_${item.path}`
    allRemovalItemsMap.set(key, item)
  })
  const allRemovalItems = Array.from(allRemovalItemsMap.values())
  
  // Separate reports and folders for better messaging
  const removalReports = allRemovalItems.filter(item => item.type !== 'Folder')
  const removalFolders = allRemovalItems.filter(item => item.type === 'Folder')
  
  // Show single combined confirmation message
  let confirmMsg = ''
  const parts = []
  
  if (itemsWithRoleChanges.length > 0) {
    parts.push(`Update roles for ${itemsWithRoleChanges.length} item(s) (modify existing permissions)`)
  }
  if (props.newItems.length > 0) {
    parts.push(`Add permissions to ${props.newItems.length} new item(s)`)
  }
  if (allRemovalItems.length > 0) {
    // Build removal message with reports and folders separated
    const removalParts = []
    if (removalReports.length > 0) {
      removalParts.push(`Remove access from ${removalReports.length} report(s)`)
    }
    if (removalFolders.length > 0) {
      removalParts.push(`Remove access from ${removalFolders.length} folder(s)`)
    }
    if (removalParts.length > 0) {
      parts.push(removalParts.join(' and '))
    }
  }
  
  if (parts.length === 0) {
    if (props.onError) {
      props.onError('No changes to apply')
    }
    return
  }
  
  // Build detailed confirmation message
  // If only removing permissions, show detailed warning message
  if (allRemovalItems.length > 0 && itemsWithRoleChanges.length === 0 && props.newItems.length === 0) {
    // Only removal - show detailed warning message
    let warningDetails = `⚠️ REMOVING ACCESS\n\n`
    
    if (removalReports.length > 0) {
      const reportsList = removalReports.slice(0, 5).map(item => 
        `📊 ${item.name || item.path.split('/').pop()}`
      ).join('\n')
      const moreReports = removalReports.length > 5 
        ? `\n... and ${removalReports.length - 5} more report(s)` 
        : ''
      warningDetails += `By removing all roles, you will lose access to ${removalReports.length} report(s):\n${reportsList}${moreReports}`
    }
    
    if (removalFolders.length > 0) {
      if (removalReports.length > 0) {
        warningDetails += `\n\n`
      }
      const foldersList = removalFolders.slice(0, 5).map(item => 
        `📁 ${item.name || item.path.split('/').pop()}`
      ).join('\n')
      const moreFolders = removalFolders.length > 5 
        ? `\n... and ${removalFolders.length - 5} more folder(s)` 
        : ''
      warningDetails += `Remove access to ${removalFolders.length} folder(s):\n${foldersList}${moreFolders}`
    }
    
    warningDetails += `\n\nThis action will revoke all access to these items.\n\nFor ${userNames.length} user(s).\n\nContinue?`
    
    confirmMsg = warningDetails
  } else {
    // Mixed operations - show summary with optional warning
    confirmMsg = parts.join('\n') + `\n\nFor ${userNames.length} user(s).\n\nContinue?`
    
    // Show warning if removing permissions (but not as detailed since there are other operations)
    if (allRemovalItems.length > 0) {
      confirmMsg = `⚠️ PERMISSIONS UPDATE\n\n` + confirmMsg + `\n\n⚠️ Note: ${allRemovalItems.length} item(s) will have access removed.`
    }
  }

  if (!window.confirm(confirmMsg)) {
    return
  }

  loading.value = true

  let successCount = 0
  let failCount = 0
  const errors = []

  try {
    // Apply role updates to items with role changes
    if (itemsWithRoleChanges.length > 0) {
      console.log(`🔄 [Apply Permissions] Applying role changes to ${itemsWithRoleChanges.length} item(s) for ${userNames.length} user(s)`)
      for (const user of userNames) {
        console.log(`👤 [Apply Permissions] Processing user: ${user}`)
        for (const { item, roles } of itemsWithRoleChanges) {
          try {
            const itemType = item.type === 'Folder' ? 'Folder' : 'Report'

            const itemPath = item.path || item.fullPath
            const itemName = item.name || itemPath
            
            console.log(`  📝 [Apply Permissions] Applying roles to ${itemName}:`, {
              user,
              itemType,
              roles,
              itemId: item.id,
              itemPath: itemPath,
              itemName: itemName,
              note: 'This will ADD permissions for users without access, or UPDATE for users with access'
            })

            // If roles array is empty, it means remove all roles
            // Otherwise, apply the updated roles
            // NOTE: The /api/permissions/set endpoint handles both:
            // 1. Adding new permissions (if user doesn't have access)
            // 2. Updating existing permissions (if user already has access)
            // So we can use the same call for all users, regardless of whether they have the item or not
            const requestPayload = {
              serverUri: props.connectionInfo.serverUri,
              itemId: item.id,
              itemPath: itemPath,
              userName: user,
              roles: roles.length === 0 ? [] : roles, // Empty array means remove all permissions
              itemType: itemType
            }
            
            console.log(`  📤 [Apply Permissions] Sending API request:`, {
              user,
              itemName: itemName,
              itemId: item.id,
              itemPath: itemPath,
              roles: roles,
              itemType: itemType,
              payload: requestPayload
            })
            
            const response = await axios.post('/api/permissions/set', requestPayload)

            if (response.data.success) {
              successCount++
              console.log(`  ✅ [Apply Permissions] Success: ${user} → ${itemName}`, {
                response: response.data
              })
            } else {
              failCount++
              const errorMsg = response.data.error || response.data.message || 'Unknown error'
              errors.push(`${user} → ${itemName}: ${errorMsg}`)
              console.error(`  ❌ [Apply Permissions] Failed: ${user} → ${itemName}`, {
                error: errorMsg,
                response: response.data
              })
            }
          } catch (err) {
            failCount++
            errors.push(`${user} → ${item.name}: ${err.message}`)
            console.error(`  ❌ [Apply Permissions] Error: ${user} → ${item.name || item.path}:`, err.message)
          }
        }
      }
      console.log(`✅ [Apply Permissions] Completed role changes: ${successCount} success, ${failCount} failed`)
    }

    // ONLY apply permissions to NEW items (not items that already have permissions)
    if (props.newItems && props.newItems.length > 0) {
      for (const user of userNames) {
        for (const item of props.newItems) {
          try {
            const itemType = item.type === 'Folder' ? 'Folder' : 'Report'
            
            // Get roles for this item from itemRoles only
            const nodeId = item.id ? `report_${item.id}` : `folder_${item.path}`
            let rolesToApply = ['Browser'] // Default to Browser if no roles assigned
            
            if (props.itemRoles && props.itemRoles.has(nodeId)) {
              const itemRolesList = props.itemRoles.get(nodeId)
              if (itemRolesList && itemRolesList.length > 0) {
                rolesToApply = itemRolesList
              }
            }

            const response = await axios.post('/api/permissions/set', {
              serverUri: props.connectionInfo.serverUri,
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

    // Remove permissions from marked items and items with all roles removed
    if (allRemovalItems.length > 0) {
      for (const user of userNames) {
        for (const item of allRemovalItems) {
          try {
            const itemType = item.type === 'Folder' ? 'Folder' : 'Report'

            // Remove permissions by setting empty roles array
            const response = await axios.post('/api/permissions/set', {
              serverUri: props.connectionInfo.serverUri,
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

    const totalChanged = itemsWithRoleChanges.length + props.newItems.length + allRemovalItems.length
    
    if (failCount === 0) {
      if (props.onSuccess) {
        const parts = []
        if (itemsWithRoleChanges.length > 0) {
          parts.push(`${itemsWithRoleChanges.length} role update(s)`)
        }
        if (props.newItems.length > 0) {
          parts.push(`${props.newItems.length} permission(s) added`)
        }
        if (allRemovalItems.length > 0) {
          parts.push(`${allRemovalItems.length} permission(s) removed`)
        }
        const message = `Successfully applied ${successCount} change(s): ${parts.join(', ')}`
        props.onSuccess(message)
      }
      
      // AUTO-REFRESH: Re-check permissions after successful changes
      // This updates the "original permissions" state so next operation works correctly
      // Only auto-refresh if exactly one user is selected (check permissions requires single user)
      if (selectedAdUsers.value.length === 1) {
        setTimeout(async () => {
          await handleCheckPermissions()
        }, 1000) // Wait 1 second for server to propagate changes
      } else {
        // For multiple users, manually update permissionsData to reflect newly applied permissions
        // This ensures change detection works for subsequent operations
        if (props.onCheckPermissions) {
          const existingPermissionsMap = new Map()
          
          // Build map of existing permissions
          if (props.permissionsData && props.permissionsData.length > 0) {
            props.permissionsData.forEach(p => {
              const key = p.id || `${p.itemType}_${p.path || p.fullPath || ''}`
              existingPermissionsMap.set(key, p)
            })
          }
          
          // Update permissions for items that were modified
          itemsWithRoleChanges.forEach(({ item, roles }) => {
            const key = item.id || `${item.type}_${item.path || item.fullPath || ''}`
            
            // Create or update permission entry
            const permission = {
              id: item.id || null,
              path: item.path || item.fullPath || item.path,
              folderPath: item.type === 'Folder' ? (item.path || '/') : (item.path || '/'),
              name: item.name,
              itemType: item.type === 'Folder' ? 'Folder' : 'Report',
              type: item.type,
              roles: roles.length > 0 ? roles : [],
              catalogType: item.type
            }
            
            existingPermissionsMap.set(key, permission)
          })
          
          // Add permissions for newly added items
          props.newItems.forEach(item => {
            const nodeId = item.id ? `report_${item.id}` : `folder_${item.path}`
            const key = item.id || `${item.type}_${item.path || item.fullPath || ''}`
            
            // Get roles from itemRoles only
            let roles = ['Browser'] // Default to Browser if no roles assigned
            if (props.itemRoles && props.itemRoles.has(nodeId)) {
              const itemRolesList = props.itemRoles.get(nodeId)
              if (itemRolesList && itemRolesList.length > 0) {
                roles = itemRolesList
              }
            }
            
            // Create or update permission entry
            const permission = {
              id: item.id || null,
              path: item.path || item.fullPath || item.path,
              folderPath: item.type === 'Folder' ? (item.path || '/') : (item.path || '/'),
              name: item.name,
              itemType: item.type === 'Folder' ? 'Folder' : 'Report',
              type: item.type,
              roles: roles,
              catalogType: item.type
            }
            
            existingPermissionsMap.set(key, permission)
          })
          
          // Remove permissions for items that were removed
          allRemovalItems.forEach(item => {
            const key = item.id || `${item.type}_${item.path || item.fullPath || ''}`
            existingPermissionsMap.delete(key)
          })
          
          // Convert map back to array
          const newPermissionsData = Array.from(existingPermissionsMap.values())
          props.onCheckPermissions(newPermissionsData)
        }
      }
      
    } else {
      if (props.onError) {
        props.onError(t('permissionsError', { success: successCount, failed: failCount }))
      }
      if (errors.length > 0) {
        console.error('Errors:', errors)
      }
    }
  } catch (err) {
    if (props.onError) {
      props.onError(t('permissionsFailed', { error: err.message }))
    }
  } finally {
    loading.value = false
  }
}

const handleCheckPermissions = async () => {
  // Validate at least one user is selected
  if (selectedAdUsers.value.length === 0) {
    if (props.onError) {
      props.onError('Please select at least one user to check permissions')
    }
    return
  }

  const userNames = selectedAdUsers.value.map(u => u.name)
  checkLoading.value = true

  try {
    // For multiple users, send userNames array; for single user, send userName
    const requestBody = {
      serverUri: props.connectionInfo.serverUri
    }
    
    if (userNames.length === 1) {
      requestBody.userName = userNames[0]
    } else {
      requestBody.userNames = userNames
    }
    
    const response = await axios.post('/api/permissions/check', requestBody)

    if (response.data.success) {
      // Calculate permissions count by role
      const permissions = response.data.permissions || []
      
      const roleCounts = {}
      const roleObjects = {} // Track which objects have which roles
      
      // Initialize all available roles with 0
      availableRoles.forEach(role => {
        roleCounts[role] = 0
        roleObjects[role] = new Set()
      })
      
      // Count objects per role
      permissions.forEach(permission => {
        if (permission.roles && Array.isArray(permission.roles)) {
          permission.roles.forEach(role => {
            if (roleObjects.hasOwnProperty(role)) {
              roleObjects[role].add(permission.path || permission.name)
            } else {
              roleObjects[role] = new Set([permission.path || permission.name])
            }
          })
        }
      })
      
      // Convert sets to counts
      Object.keys(roleObjects).forEach(role => {
        roleCounts[role] = roleObjects[role].size
      })
      
      permissionsCountByRole.value = roleCounts
      if (userNames.length === 1) {
        checkedUserName.value = userNames[0]
      } else {
        checkedUserName.value = `${userNames.length} users (mutual access)`
      }
      showPermissionsCounts.value = true
      
      // Notify parent component with the permissions data
      if (props.onCheckPermissions) {
        props.onCheckPermissions(response.data.permissions)
      }
      if (props.onSuccess) {
        if (userNames.length === 1) {
          props.onSuccess(`Loaded permissions for ${userNames[0]}`)
        } else {
          props.onSuccess(`Loaded mutual permissions for ${userNames.length} users: ${userNames.join(', ')}`)
        }
      }
    } else {
      if (props.onError) {
        props.onError(response.data.error || 'Failed to check permissions')
      }
    }
  } catch (err) {
    console.error('Error checking permissions:', err)
    if (props.onError) {
      props.onError(err.response?.data?.message || err.message || 'Failed to check permissions')
    }
  } finally {
    checkLoading.value = false
  }
}

// Close dropdowns when clicking outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    const target = e.target
    if (!target.closest('.user-search-container')) {
      showSearchResults.value = false
    }
  })
}
</script>

<style scoped>
.permissions-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 1rem;
}

.permissions-panel h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--text-color);
}

.permissions-panel h2 svg {
  flex-shrink: 0;
}

.form-section {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.form-section.user-input-row {
  margin-bottom: 1rem;
  gap: 0.25rem;
}

.form-section label {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  min-width: 160px;
  max-width: 160px;
  width: 160px;
  padding-inline-end: 4px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.form-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-height: 0;
}

.user-input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  padding-right: 1.5rem;
}

.user-input-container .user-search-container {
  flex: 1 1 auto;
  max-width: 100%;
}

/* Buttons Row */
.buttons-row {
  margin-bottom: 1rem;
  gap: 0.25rem;
}

.buttons-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  padding-right: 1.5rem;
}

.text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  min-height: 40px;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.dark-mode .text-input {
  background: #2c2c2c;
  color: white;
  border-color: #555;
}

.dark-mode .text-input:focus {
  border-color: #64b5f6;
  box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
}

.hint {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.85rem;
}

.divider {
  height: 1px;
  background: #e0e0e0;
  margin: 1rem 0;
}

.dark-mode .divider {
  background: #555;
}


.selected-info {
  color: #666;
  font-size: 0.85rem;
  font-style: italic;
}

.dark-mode .selected-info {
  color: #999;
}

.selected-tags-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 250px;
  overflow: hidden;
}

.summary-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #f2f4f7;
  color: #344054;
}

.badge.success {
  background: #ecfdf3;
  color: #027a48;
  border: 1px solid #abefc6;
}

.dark-mode .badge {
  background: #2c2c2c;
  color: #e0e0e0;
}

.dark-mode .badge.success {
  background: #1a3327;
  color: #4caf50;
  border-color: #2e5940;
}

.selected-items-section {
  width: 70%;
  min-height: 300px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  overflow: hidden;
  margin-bottom: 0;
}

.selected-items-section .form-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  overflow: hidden;
}

.tags-scrollable {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  overflow: hidden;
  min-height: 200px;
  max-height: 24rem; /* Approximately 12 lines */
}

/* Custom Scrollbar - Always visible when needed */
.tags-scrollable::-webkit-scrollbar {
  width: 8px;
}

.tags-scrollable::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
  margin: 2px 0;
}

.tags-scrollable::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.tags-scrollable::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.tags-scrollable::-webkit-scrollbar-thumb:active {
  background: #666;
}

.dark-mode .tags-scrollable::-webkit-scrollbar-track {
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
}

.dark-mode .tags-scrollable::-webkit-scrollbar-thumb {
  background: #555;
  border-color: #3a3a3a;
}

.dark-mode .tags-scrollable::-webkit-scrollbar-thumb:hover {
  background: #666;
}

.dark-mode .tags-scrollable::-webkit-scrollbar-thumb:active {
  background: #888;
}

.tags-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

/* Show More Tag - Clickable tag at end of line */
.item-tag.show-more-tag {
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
  background: transparent;
  color: #6b7280;
  border: 1px solid var(--border-color);
  box-shadow: none;
}

.item-tag.show-more-tag:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
  border-color: rgba(0, 0, 0, 0.2);
  transform: none;
}

.dark-mode .item-tag.show-more-tag {
  color: #9ca3af;
}

.dark-mode .item-tag.show-more-tag:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
  border-color: rgba(255, 255, 255, 0.2);
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

.modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
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

.item-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

/* Tag Remove Button */
.tag-remove-btn {
  background: rgba(0, 0, 0, 0.15);
  border: none;
  color: white;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: 4px;
}

.tag-remove-btn:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: scale(1.1);
}

.dark-mode .tag-remove-btn {
  background: rgba(0, 0, 0, 0.25);
}

.dark-mode .tag-remove-btn:hover {
  background: rgba(0, 0, 0, 0.4);
}

.item-tag svg {
  flex-shrink: 0;
}

.folder-tag {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
}

.folder-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255, 152, 0, 0.3);
}

.pbix-tag {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  color: white;
}

.pbix-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(33, 150, 243, 0.3);
}

.rdl-tag {
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
  color: white;
}

.rdl-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(156, 39, 176, 0.3);
}

.dark-mode .item-tag {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dark-mode .folder-tag {
  background: linear-gradient(135deg, #ef6c00 0%, #d84315 100%);
}

.dark-mode .pbix-tag {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.dark-mode .rdl-tag {
  background: linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%);
}

/* Minimal Apply Button */
.apply-btn-minimal {
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
  min-height: 38px;
  min-width: 155px;
  flex-shrink: 0;
}

.apply-btn-minimal:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
  border-color: rgba(0, 0, 0, 0.2);
}

.dark-mode .apply-btn-minimal {
  color: #9ca3af;
}

.dark-mode .apply-btn-minimal:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
  border-color: rgba(255, 255, 255, 0.2);
}

.apply-btn-minimal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Check Permission Button - Same style as Apply button */
.check-btn-minimal {
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
  min-height: 38px;
  min-width: 155px;
  flex-shrink: 0;
}

.check-btn-minimal:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
  border-color: rgba(0, 0, 0, 0.2);
}

.dark-mode .check-btn-minimal {
  color: #9ca3af;
}

.dark-mode .check-btn-minimal:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
  border-color: rgba(255, 255, 255, 0.2);
}

.check-btn-minimal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-box-floating {
  margin-top: 1rem;
  padding: 12px 16px;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
  color: #1565c0;
  font-size: 0.9rem;
}

.dark-mode .info-box-floating {
  background: #1a2332;
  color: #64b5f6;
  border-left-color: #42a5f5;
}

/* AD User Selection - Live Search Styles */
.user-search-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-search-input {
  padding-right: 40px;
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

/* Default color for user icons */
.search-result-item .user-type-icon {
  color: #2196f3;
}

.dark-mode .search-result-item .user-type-icon {
  color: #64b5f6;
}

/* Orange color for group icons */
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

.user-result-type {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
  flex-shrink: 0;
}

.user-result-type.user {
  background: #e3f2fd;
  color: #1976d2;
}

.user-result-type.group {
  background: #fff3e0;
  color: #f57c00;
}

.dark-mode .user-result-type.user {
  background: #1a2332;
  color: #64b5f6;
}

.dark-mode .user-result-type.group {
  background: #2a1f0f;
  color: #ffb74d;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Selected Users Section */
.selected-users-section {
  margin-left: 164px;
  margin-bottom: 1rem;
  max-height: 150px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
}

.selected-users-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Scrollbar styling for selected users */
.selected-users-section::-webkit-scrollbar {
  width: 8px;
}

.selected-users-section::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
  margin: 2px 0;
}

.selected-users-section::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.selected-users-section::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.selected-users-section::-webkit-scrollbar-thumb:active {
  background: #666;
}

.dark-mode .selected-users-section::-webkit-scrollbar-track {
  background: #1e1e1e;
  border: 1px solid #3a3a3a;
}

.dark-mode .selected-users-section::-webkit-scrollbar-thumb {
  background: #555;
  border-color: #3a3a3a;
}

.dark-mode .selected-users-section::-webkit-scrollbar-thumb:hover {
  background: #666;
}

.dark-mode .selected-users-section::-webkit-scrollbar-thumb:active {
  background: #888;
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

/* Inline Permission Tags */
.permission-inline-tag {
  animation: slideInTag 0.3s ease;
}

@keyframes slideInTag {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}


/* Status Indicator (before user icon) */
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

.status-indicator.inactive svg {
  color: #c62828 !important;
}

.dark-mode .status-indicator.inactive svg {
  color: #ef5350 !important;
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

/* Responsive Design */
@media (max-width: 768px) {
  .form-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-section label {
    min-width: unset;
    padding-top: 0;
    margin-bottom: 0.5rem;
  }
  
  .user-input-and-button {
    flex-direction: column;
  }
  
  .user-input-and-button .user-search-container {
    flex: 1;
    max-width: 100%;
  }
  
  .role-input-wrapper {
    padding-right: 0;
  }
  
  .apply-btn-minimal {
    width: 100%;
  }
  
  .selected-users-section {
    margin-left: 0;
  }
  
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

