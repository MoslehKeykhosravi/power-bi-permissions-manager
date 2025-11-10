<template>
  <div class="permissions-panel">
    <h2>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2C8.34315 2 7 3.34315 7 5V8H6C5.44772 8 5 8.44772 5 9V17C5 17.5523 5.44772 18 6 18H14C14.5523 18 15 17.5523 15 17V9C15 8.44772 14.5523 8 14 8H13V5C13 3.34315 11.6569 2 10 2ZM11 8V5C11 4.44772 10.5523 4 10 4C9.44772 4 9 4.44772 9 5V8H11Z" fill="currentColor"/>
      </svg>
      {{ t('setUserAccess') }}
    </h2>

    <!-- User Input and Apply Button Row -->
    <div class="form-section user-input-row">
      <label>{{ t('userNameOrGroup') }}</label>
      <div class="user-input-and-button">
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
        
        <!-- Apply Button -->
        <button
          class="apply-btn-minimal"
          @click="handleApplyPermissions"
          :disabled="loading || selectedItems.length === 0 || selectedAdUsers.length === 0 || selectedRoles.length === 0"
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

    <div class="divider"></div>

    <!-- Roles Section -->
    <div class="form-section role-input-row">
      <label>{{ t('accessLevel') }}</label>
      <div class="role-input-wrapper">
        <!-- Multi-select Dropdown -->
        <div class="multi-select" :class="{ open: dropdownOpen }" @click="toggleDropdown">
          <div class="selected-items">
            <span v-if="selectedRoles.length === 0" class="placeholder">{{ t('selectRoles') }}</span>
            <div v-else class="chips">
              <span v-for="role in selectedRoles" :key="role" class="chip">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2C8.34315 2 7 3.34315 7 5V8H6C5.44772 8 5 8.44772 5 9V17C5 17.5523 5.44772 18 6 18H14C14.5523 18 15 17.5523 15 17V9C15 8.44772 14.5523 8 14 8H13V5C13 3.34315 11.6569 2 10 2ZM11 8V5C11 4.44772 10.5523 4 10 4C9.44772 4 9 4.44772 9 5V8H11Z" fill="currentColor"/>
                </svg>
                {{ t('role' + role.replace(/\s+/g, '')) }}
                <button @click.stop="removeRole(role)" class="chip-remove">×</button>
              </span>
            </div>
            <svg class="dropdown-arrow" :class="{ rotated: dropdownOpen }" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          
          <div v-if="dropdownOpen" class="dropdown-menu">
            <div class="dropdown-item select-all" @click.stop="toggleSelectAll">
              <input type="checkbox" :checked="isAllSelected" @click.stop="toggleSelectAll" />
              <span><strong>{{ t('selectAll') }}</strong></span>
            </div>
            <div class="dropdown-divider"></div>
            <div
              v-for="role in availableRoles"
              :key="role"
              class="dropdown-item"
              @click.stop="toggleRole(role)"
            >
              <input type="checkbox" :checked="selectedRoles.includes(role)" @click.stop="toggleRole(role)" />
              <span>{{ t('role' + role.replace(/\s+/g, '')) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

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
const selectedRoles = ref(['Browser'])
const loading = ref(false)
const checkLoading = ref(false)
const dropdownOpen = ref(false)

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

const isAllSelected = computed(() => {
  return selectedRoles.value.length === availableRoles.length
})

const reportCount = computed(() => {
  const count = props.selectedItems.filter(i => {
    // Debug: log item types
    if (i.type) {
      console.log('Item type:', i.type, 'Name:', i.name)
    }
    return i.type && (i.type.includes('Report') || i.type.includes('PBIX') || i.type.includes('RDL'))
  }).length
  console.log('Report count:', count)
  return count
})

const folderCount = computed(() => {
  const count = props.selectedItems.filter(i => i.type === 'Folder').length
  console.log('Folder count:', count)
  return count
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

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const toggleRole = (role) => {
  const index = selectedRoles.value.indexOf(role)
  if (index > -1) {
    selectedRoles.value.splice(index, 1)
  } else {
    selectedRoles.value.push(role)
  }
}

const removeRole = (role) => {
  const index = selectedRoles.value.indexOf(role)
  if (index > -1) {
    selectedRoles.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRoles.value = []
  } else {
    selectedRoles.value = [...availableRoles]
  }
}

const selectAllRoles = () => {
  selectedRoles.value = [...availableRoles]
  dropdownOpen.value = false
}

const clearAllRoles = () => {
  selectedRoles.value = []
  dropdownOpen.value = false
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
  // Validate: must have either new items or marked for removal items
  const hasChanges = props.newItems.length > 0 || props.markedForRemovalItems.length > 0
  
  if (!hasChanges) {
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

  if (selectedRoles.value.length === 0) {
    if (props.onError) {
      props.onError(t('selectAtLeastOneRole'))
    }
    return
  }

  // Show confirmation for marked items (items to remove permissions)
  if (props.markedForRemovalItems && props.markedForRemovalItems.length > 0) {
    const itemsList = props.markedForRemovalItems.slice(0, 5).map(item => {
      const icon = item.type === 'Folder' ? '📁' : '📊'
      return `${icon} ${item.name || item.path.split('/').pop()}`
    }).join('\n')
    
    const moreText = props.markedForRemovalItems.length > 5 
      ? `\n... and ${props.markedForRemovalItems.length - 5} more items` 
      : ''
    
    const removeConfirmMsg = `⚠️ REMOVE PERMISSIONS WARNING\n\n` +
      `You are about to REMOVE permissions for user(s) from ${props.markedForRemovalItems.length} item(s):\n\n` +
      `${itemsList}${moreText}\n\n` +
      `This action will revoke access to these items.\n\n` +
      `Do you want to continue?`

    if (!window.confirm(removeConfirmMsg)) {
      return
    }
  }

  // Show confirmation for new items
  let confirmMsg = ''
  if (props.newItems.length > 0 && props.markedForRemovalItems.length > 0) {
    confirmMsg = `Apply ${selectedRoles.value.length} role(s) to:\n` +
      `- ${props.newItems.length} new item(s) (add permissions)\n` +
      `- ${props.markedForRemovalItems.length} item(s) (remove permissions)\n\n` +
      `For ${userNames.length} user(s).\n\n` +
      `Existing permissions will NOT be changed.\n\n` +
      `Continue?`
  } else if (props.newItems.length > 0) {
    confirmMsg = `Add ${selectedRoles.value.length} role(s) to ${props.newItems.length} new item(s)\n` +
      `for ${userNames.length} user(s).\n\n` +
      `Existing permissions will NOT be changed.\n\n` +
      `Continue?`
  } else {
    confirmMsg = `Remove permissions from ${props.markedForRemovalItems.length} item(s)\n` +
      `for ${userNames.length} user(s).\n\n` +
      `Continue?`
  }

  if (!window.confirm(confirmMsg)) {
    return
  }

  loading.value = true

  let successCount = 0
  let failCount = 0
  const errors = []

  try {
    // ONLY apply permissions to NEW items (not items that already have permissions)
    if (props.newItems && props.newItems.length > 0) {
      for (const user of userNames) {
        for (const item of props.newItems) {
          try {
            const itemType = item.type === 'Folder' ? 'Folder' : 'Report'

            const response = await axios.post('/api/permissions/set', {
              serverUri: props.connectionInfo.serverUri,
              itemId: item.id,
              itemPath: item.path || item.fullPath,
              userName: user,
              roles: selectedRoles.value,
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
    if (props.markedForRemovalItems && props.markedForRemovalItems.length > 0) {
      for (const user of userNames) {
        for (const item of props.markedForRemovalItems) {
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

    const totalChanged = props.newItems.length + props.markedForRemovalItems.length
    
    if (failCount === 0) {
      if (props.onSuccess) {
        const message = props.newItems.length > 0 && props.markedForRemovalItems.length > 0
          ? `Successfully updated ${successCount} permissions (${props.newItems.length} added, ${props.markedForRemovalItems.length} removed)`
          : props.newItems.length > 0
            ? `Successfully added ${successCount} permissions`
            : `Successfully removed ${successCount} permissions`
        props.onSuccess(message)
      }
      
      // AUTO-REFRESH: Re-check permissions after successful changes
      // This updates the "original permissions" state so next operation works correctly
      console.log('🔄 Auto-refreshing permissions after successful update...')
      setTimeout(async () => {
        await handleCheckPermissions()
        console.log('✓ Permissions refreshed')
      }, 1000) // Wait 1 second for server to propagate changes
      
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
  // Validate only one user is selected
  if (selectedAdUsers.value.length === 0) {
    if (props.onError) {
      props.onError('Please select at least one user to check permissions')
    }
    return
  }

  if (selectedAdUsers.value.length > 1) {
    if (props.onError) {
      props.onError('Please select only ONE user to check permissions. Multiple users are not supported for permission checking.')
    }
    return
  }

  const userName = selectedAdUsers.value[0].name
  checkLoading.value = true

  try {
    const response = await axios.post('/api/permissions/check', {
      serverUri: props.connectionInfo.serverUri,
      userName: userName
    })

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
      checkedUserName.value = userName
      showPermissionsCounts.value = true
      
      // Notify parent component with the permissions data
      if (props.onCheckPermissions) {
        props.onCheckPermissions(response.data.permissions)
      }
      if (props.onSuccess) {
        props.onSuccess(`Loaded permissions for ${userName}`)
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
    if (!target.closest('.multi-select')) {
      dropdownOpen.value = false
    }
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

.user-input-and-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  padding-right: 1.5rem;
}

.user-input-and-button .user-search-container {
  flex: 1 1 auto;
  max-width: 100%;
}

/* Role Input Wrapper - Match user input layout */
.role-input-wrapper {
  display: flex;
  flex: 1;
  min-width: 0;
  padding-right: 1.5rem;
}

.role-input-wrapper .multi-select {
  flex: 1;
  min-width: 0;
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

.multi-select {
  position: relative;
  cursor: pointer;
  user-select: none;
}

.selected-items {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  min-height: 40px;
  max-height: 40px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  overflow: hidden;
}

.selected-items:hover {
  border-color: #999;
}

.dark-mode .selected-items {
  background: #2c2c2c;
  border-color: #555;
  color: white;
}

.dark-mode .selected-items:hover {
  border-color: #777;
}

.multi-select.open .selected-items {
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.dark-mode .multi-select.open .selected-items {
  border-color: #64b5f6;
  box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
}

.placeholder {
  color: #999;
  flex: 1;
}

.chips {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chips::-webkit-scrollbar {
  display: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 4px 10px;
  background: linear-gradient(135deg, #757575 0%, #616161 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.chip svg {
  flex-shrink: 0;
  opacity: 0.9;
}

.chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(117, 117, 117, 0.3);
}

.chip-remove {
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

.chip-remove:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dark-mode .chip {
  background: linear-gradient(135deg, #616161 0%, #424242 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.dropdown-arrow {
  margin-left: 0.5rem;
  flex-shrink: 0;
  color: #666;
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dark-mode .dropdown-arrow {
  color: #999;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  max-height: 280px;
  overflow-y: auto;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dark-mode .dropdown-menu {
  background: #2c2c2c;
  border-color: #444;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.dropdown-item:hover {
  background: linear-gradient(90deg, #f5f8ff 0%, #f0f4ff 100%);
}

.dark-mode .dropdown-item:hover {
  background: linear-gradient(90deg, #2a3540 0%, #2d3844 100%);
}

.dropdown-item.select-all {
  font-weight: 600;
  color: #2196f3;
  background: #f5f8ff;
}

.dark-mode .dropdown-item.select-all {
  color: #64b5f6;
  background: #1a2332;
}

.dropdown-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
  margin: 4px 0;
}

.dark-mode .dropdown-divider {
  background: linear-gradient(90deg, transparent 0%, #444 50%, transparent 100%);
}

.dropdown-item input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: #2196f3;
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
  flex: 1;
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

