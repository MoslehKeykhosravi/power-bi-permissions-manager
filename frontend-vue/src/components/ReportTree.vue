<template>
  <div class="report-tree">
    <!-- Search and Quick Actions Row -->
    <div class="search-and-actions-row">
      <!-- Search Box -->
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchText"
          type="text"
          :placeholder="t('searchPlaceholder')"
          class="search-input"
        />
        <button v-if="searchText" @click="searchText = ''" class="clear-search">✕</button>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <!-- Expand/Collapse Toggle Button -->
        <div class="button-group">
          <!-- Show Collapse action when expanded: Arrows pointing away from each other -->
          <button v-if="isAnyExpanded" @click="collapseAll" class="action-btn icon-btn" :class="{ active: lastAction === 'collapse' }" :title="t('collapseAll')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Top arrow pointing down -->
              <path d="M4 2L8 6L12 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Bottom arrow pointing up -->
              <path d="M4 14L8 10L12 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <!-- Show Expand action when collapsed: Arrows pointing toward each other -->
          <button v-else @click="expandAll" class="action-btn icon-btn" :class="{ active: lastAction === 'expand' }" :title="t('expandAll')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Top arrow pointing up -->
              <path d="M4 6L8 2L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <!-- Bottom arrow pointing down -->
              <path d="M4 10L8 14L12 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <!-- Select/Deselect Toggle Button -->
        <div class="button-group">
          <!-- Show Deselect icon when items are selected -->
          <button v-if="isAnySelected" @click="deselectAll" class="action-btn icon-btn" :class="{ active: lastAction === 'deselect' }" :title="t('deselectAll')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.2"/>
              <path d="M5.5 8L7.5 10L10.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <!-- Show Select icon when items are not selected -->
          <button v-else @click="selectAll" class="action-btn icon-btn" :class="{ active: lastAction === 'select' }" :title="t('selectAll')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Type Filters with Icons Only -->
      <div class="type-filters">
        <label class="filter-checkbox-icon" :title="t('folders')">
          <input type="checkbox" :checked="hasFoldersSelected" @change="toggleAllType('folder', $event.target.checked)" />
          <span class="checkbox-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4C3 3.44772 3.44772 3 4 3H8.58579C8.851 3 9.10536 3.10536 9.29289 3.29289L11 5H16C16.5523 5 17 5.44772 17 6V15C17 15.5523 16.5523 16 16 16H4C3.44772 16 3 15.5523 3 15V4Z" fill="currentColor"/>
            </svg>
          </span>
        </label>
        <label class="filter-checkbox-icon" title="PBIX Reports">
          <input type="checkbox" :checked="hasPbixSelected" @change="toggleAllType('pbix', $event.target.checked)" />
          <span class="checkbox-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="3" height="12" rx="1" fill="currentColor"/>
              <rect x="8" y="2" width="3" height="14" rx="1" fill="currentColor"/>
              <rect x="13" y="6" width="3" height="10" rx="1" fill="currentColor"/>
            </svg>
          </span>
        </label>
        <label class="filter-checkbox-icon" title="RDL Reports">
          <input type="checkbox" :checked="hasRdlSelected" @change="toggleAllType('rdl', $event.target.checked)" />
          <span class="checkbox-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3C4.44772 3 4 3.44772 4 4V16C4 16.5523 4.44772 17 5 17H15C15.5523 17 16 16.5523 16 16V7L12 3H5Z" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M12 3V7H16" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" stroke-width="1.5"/>
              <line x1="7" y1="13" x2="13" y2="13" stroke="currentColor" stroke-width="1.5"/>
            </svg>
          </span>
        </label>
        <label class="filter-checkbox-icon auto-select-icon" :title="t('autoSelectParents')">
          <input type="checkbox" v-model="autoSelectParents" />
          <span class="checkbox-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3V8M10 8L13 5M10 8L7 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 10C3 9.44772 3.44772 9 4 9H7.58579C7.851 9 8.10536 9.10536 8.29289 9.29289L9 10H15C15.5523 10 16 10.4477 16 11V15C16 15.5523 15.5523 16 15 16H4C3.44772 16 3 15.5523 3 15V10Z" fill="currentColor"/>
            </svg>
          </span>
        </label>
      </div>
    </div>

    <!-- Table View -->
    <div class="tree-container">
      <div class="table-view-wrapper">
        <table class="report-table">
          <thead>
            <tr>
              <th class="object-name-header">{{ t('objectName') || 'Object Name' }}</th>
              <th class="role-access-header">{{ t('roleAccess') || 'Role Access' }}</th>
            </tr>
          </thead>
          <tbody>
            <!-- Server Root Node (renders children recursively when expanded) -->
            <TableTreeNode
              :key="'server-root'"
              :node="treeData"
              node-id="server-root"
              :expanded="expandedSet"
              :checked="checkedSet"
              :marked-for-removal="markedForRemovalSet"
              :original-permissions="originalPermissionsSet"
              :editing-node-id="editingNodeId"
              :editing-value="editingValue"
              :permissions-map="permissionsMap"
              :item-roles="itemRoles"
              :role-picker-open="rolePickerOpen"
              :level="0"
              :server-list="serverList"
              :current-server-uri="connectionInfo?.serverUri"
              @toggle-expand="handleToggleExpand"
              @check="handleCheck"
              @start-editing="startEditing"
              @update-editing="setEditingValue"
              @save-editing="saveEditing"
              @cancel-editing="cancelEditing"
              @add-role="handleAddRole"
              @add-all-roles="handleAddAllRoles"
              @remove-role="handleRemoveRole"
              @toggle-role-picker="handleToggleRolePicker"
              @switch-server="handleServerSwitch"
            />
            <!-- Empty state message when no reports and not searching -->
            <tr v-if="Object.keys(treeData.children).length === 0 && !searchText" class="empty-state-row">
              <td colspan="2" class="empty-state-cell">
                <div class="empty-state">
                  {{ t('noReports') || 'No reports found' }}
                </div>
              </td>
            </tr>
            <!-- No match message when searching -->
            <tr v-if="Object.keys(treeData.children).length === 0 && searchText" class="empty-state-row">
              <td colspan="2" class="empty-state-cell">
                <div class="empty-state">
                  {{ t('noMatch') || 'No matches found' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import TableTreeNode from './TableTreeNode.vue'
import PowerBIIcon from '../assets/PowerBIIcon.vue'
import RDLIcon from '../assets/RDLIcon.vue'
import FolderIcon from '../assets/FolderIcon.vue'
import { useI18n } from '../composables/useI18n'
import axios from 'axios'

const { t } = useI18n()

const props = defineProps({
  reports: {
    type: Array,
    default: () => []
  },
  connectionInfo: {
    type: Object,
    default: () => ({})
  },
  onItemsSelected: {
    type: Function,
    default: () => {}
  },
  onReloadReports: {
    type: Function,
    default: null
  },
  permissionsData: {
    type: Array,
    default: null
  },
  onRoleChanges: {
    type: Function,
    default: null
  },
  serverList: {
    type: Array,
    default: () => []
  },
  onServerSwitch: {
    type: Function,
    default: null
  }
})

const searchText = ref('')
const expanded = ref(['server-root']) // Default to expanded (server-root expanded)
const checked = ref([])
const markedForRemoval = ref([]) // Items marked with red X for removal
const originalPermissions = ref([]) // Items user originally had access to (from Check Permissions)
const autoSelectParents = ref(false)
const editingNodeId = ref(null)
const editingValue = ref('')
const lastAction = ref('') // Track last clicked action: 'expand', 'collapse', 'select', 'deselect'
const itemRoles = ref(new Map()) // Track role changes per item
const rolePickerOpen = ref(null) // Track which node has role picker open
const permissionsMap = ref(new Map()) // Map of path -> roles from permissions data

const serverAddress = computed(() => {
  return props.connectionInfo?.serverUri || (props.serverList.length > 0 ? 'Select server' : 'Report Server')
})

const expandedSet = computed(() => new Set(expanded.value))
const checkedSet = computed(() => new Set(checked.value))
const markedForRemovalSet = computed(() => new Set(markedForRemoval.value))
const originalPermissionsSet = computed(() => new Set(originalPermissions.value))

// Build tree structure - EXACT IMPLEMENTATION FROM REACT
const treeComputed = computed(() => {
  const tree = {
    type: 'server',
    name: serverAddress.value,
    children: {}
  }

  const reportParentMap = new Map()
  const searchLower = searchText.value.trim().toLowerCase()
  const isSearching = searchText.value.trim() !== ''

  // First pass: identify which reports and folders match the search
  const matchingReports = new Set()
  const matchingFolders = new Set()

  if (isSearching) {
    props.reports.forEach((report) => {
      const reportNameMatches = report.name.toLowerCase().includes(searchLower)
      const pathParts = report.path.split('/').filter(p => p)

      // Check if report name matches
      if (reportNameMatches) {
        matchingReports.add(report.id)
      }

      // Check if any folder in the path matches
      pathParts.forEach((part, index) => {
        if (part.toLowerCase().includes(searchLower)) {
          const folderPath = '/' + pathParts.slice(0, index + 1).join('/')
          matchingFolders.add(folderPath)
        }
      })
    })
  }

  // Build tree with filtered items
  let filtered = []

  props.reports.forEach((report) => {
    const pathParts = report.path.split('/').filter(p => p)
    const reportNameWithoutExt = report.name.replace(/\.(pbix|rdl)$/i, '')

    const cleanedParts = []
    let previousPart = null

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]

      if (previousPart && part.toLowerCase() === previousPart.toLowerCase()) {
        continue
      }

      const isLastPart = (i === pathParts.length - 1)
      if (isLastPart && part.toLowerCase() === reportNameWithoutExt.toLowerCase()) {
        continue
      }

      cleanedParts.push(part)
      previousPart = part
    }

    const parentFolderIds = []
    cleanedParts.forEach((part, index) => {
      const folderPath = '/' + cleanedParts.slice(0, index + 1).join('/')
      parentFolderIds.push(`folder_${folderPath}`)
    })

    reportParentMap.set(`report_${report.id}`, parentFolderIds)

    // Determine if this report should be included
    let shouldIncludeReport = !isSearching

    if (isSearching) {
      // Include report ONLY if it matches the search
      if (matchingReports.has(report.id)) {
        shouldIncludeReport = true
      } else {
        // Don't include report even if its parent folder matches
        shouldIncludeReport = false
      }
    }

    // Build folder structure ONLY for reports that should be included
    let currentLevel = tree.children
    let shouldBuildPath = !isSearching

    if (isSearching) {
      // Only build the path if the report itself should be included
      // Don't build paths just because a folder name matches
      if (shouldIncludeReport) {
        shouldBuildPath = true
      }
    }

    if (shouldBuildPath) {
      cleanedParts.forEach((part, index) => {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            type: 'folder',
            path: '/' + cleanedParts.slice(0, index + 1).join('/'),
            children: {}
          }
        }
        currentLevel = currentLevel[part].children
      })
    }

    // Only add report if it should be included
    if (shouldIncludeReport && shouldBuildPath) {
      const reportKey = `report_${report.id}`
      currentLevel[reportKey] = {
        nodeType: 'report',
        ...report
      }
      filtered.push(report)
    }
  })

  const getAllIds = (nodes) => {
    let ids = []
    Object.keys(nodes).forEach(key => {
      const node = nodes[key]
      const nodeId = node.type === 'folder' || node.nodeType === 'report'
        ? (node.type === 'folder' ? `folder_${node.path}` : `report_${node.id}`)
        : node.type === 'server' ? 'server-root' : key
      ids.push(nodeId)
      if (node.children && Object.keys(node.children).length > 0) {
        ids = ids.concat(getAllIds(node.children))
      }
    })
    return ids
  }

  const allIds = getAllIds({ serverRoot: tree })

  return {
    treeData: tree,
    filteredReports: filtered,
    allNodeIds: allIds,
    folderMap: reportParentMap
  }
})

// Destructure reactive computed values
const treeData = computed(() => treeComputed.value.treeData)
const filteredReports = computed(() => treeComputed.value.filteredReports)
const allNodeIds = computed(() => treeComputed.value.allNodeIds)
const folderMap = computed(() => treeComputed.value.folderMap)

// Clear selections when reports change (new server connection)
watch(() => props.reports, () => {
  // Clear all selections when reports are reloaded
  checked.value = []
  markedForRemoval.value = []
  originalPermissions.value = []
  itemRoles.value = new Map()
  expanded.value = ['server-root'] // Default to expanded (server-root expanded)
}, { deep: false })

// Clear itemRoles and permissionsMap when no items are selected
// Also ensure all selected items have Browser role
watch(() => checked.value, (newChecked) => {
  // Check if server-root is checked
  const isServerRootChecked = newChecked.includes('server-root')
  const checkedItems = newChecked.filter(id => id !== 'server-root')
  
  if (checkedItems.length === 0 && !isServerRootChecked) {
    // No items checked at all
    itemRoles.value = new Map()
    // Also clear permissionsMap so no roles are displayed in the role access column
    permissionsMap.value = new Map()
    if (props.onRoleChanges) {
      props.onRoleChanges(new Map())
    }
  } else {
    // Ensure server-root has at least Browser role if checked
    if (isServerRootChecked && !itemRoles.value.has('server-root')) {
      // Check if server-root has roles in permissionsMap (from checked permissions)
      // Server-root represents the home page "/"
      const serverRoles = permissionsMap.value.get('/') || ['Browser']
      itemRoles.value.set('server-root', serverRoles)
    }
    
    // Ensure all checked items have at least Browser role in itemRoles
    checkedItems.forEach(nodeId => {
      if (!itemRoles.value.has(nodeId)) {
        // Check if item has roles in permissionsMap (from checked permissions)
        const node = findNodeById(nodeId)
        let roles = []
        if (node) {
          const path = node.type === 'folder' 
            ? node.path 
            : node.path || node.fullPath || ''
          // Normalize path: handle Unicode properly, don't use toLowerCase on Persian chars
          const normalizePath = (p) => {
            return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
          }
          const normalizedPath = normalizePath(path)
          // Try exact match first
          roles = permissionsMap.value.get(normalizedPath)
          // If not found, try case-insensitive match (but preserve Unicode)
          if (!roles) {
            for (const [mapPath, mapRoles] of permissionsMap.value.entries()) {
              if (normalizePath(mapPath) === normalizedPath) {
                roles = mapRoles
                break
              }
            }
          }
          roles = roles || ['Browser']
        } else {
          roles = ['Browser']
        }
        itemRoles.value.set(nodeId, roles)
      }
    })
    
    // Notify parent of role changes
    if (props.onRoleChanges) {
      props.onRoleChanges(new Map(itemRoles.value))
    }
  }
}, { deep: true })

// Auto-expand when searching
watch(searchText, () => {
  if (searchText.value.trim()) {
    expanded.value = [...allNodeIds.value]
  } else {
    expanded.value = ['server-root'] // Default to expanded (server-root expanded)
  }
})

// Auto-select parent folders
watch(autoSelectParents, () => {
  if (autoSelectParents.value) {
    const checkedSet = new Set(checked.value)
    const reportIds = checked.value.filter(id => id.startsWith('report_'))

    reportIds.forEach(reportId => {
      const parentIds = folderMap.value.get(reportId) || []
      parentIds.forEach(id => checkedSet.add(id))
    })

    // Always check server-root when auto-select is enabled
    checkedSet.add('server-root')

    checked.value = Array.from(checkedSet)
  }
})

// Ensure server-root is checked when auto-select is enabled and any item is checked
watch([checked, autoSelectParents], () => {
  if (autoSelectParents.value && checked.value.length > 0) {
    const checkedSet = new Set(checked.value)
    const hasServerRoot = checkedSet.has('server-root')
    
    if (!hasServerRoot) {
      checkedSet.add('server-root')
      checked.value = Array.from(checkedSet)
      
      // Auto-add Browser role for server-root if not already set
      if (!itemRoles.value.has('server-root')) {
        const serverRoles = permissionsMap.value.get('/') || ['Browser']
        itemRoles.value.set('server-root', serverRoles)
        if (props.onRoleChanges) {
          props.onRoleChanges(new Map(itemRoles.value))
        }
      }
    }
  }
}, { deep: true })

// Clean up stale checked items that don't exist in current tree
watch(allNodeIds, () => {
  const validIds = new Set(allNodeIds.value)
  checked.value = checked.value.filter(id => validIds.has(id))
}, { immediate: true })

// Watch for external permissions data to update checked items
watch(() => props.permissionsData, (newPermissions) => {
  if (!newPermissions || newPermissions.length === 0) {
    permissionsMap.value = new Map()
    // Clear original permissions when no permissions data (e.g., new user selected)
    originalPermissions.value = []
    checked.value = []
    markedForRemoval.value = []
    itemRoles.value = new Map()
    return
  }
  
  // Clear current selection and marked items
  checked.value = []
  markedForRemoval.value = []
  itemRoles.value = new Map()
  
  // Build permissions map: path -> roles
  const newPermissionsMap = new Map()
  const newCheckedIds = []
  
  newPermissions.forEach((permission, idx) => {
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
    const normalizedPath = normalizePath(path)
    const roles = permission.roles || []
    
    if (roles.length > 0) {
      newPermissionsMap.set(normalizedPath, roles)
    }
    
    if (permission.itemType === 'Folder') {
      // Handle server root (path '/') specially - it uses 'server-root' as nodeId
      if (normalizedPath === '/') {
        newCheckedIds.push('server-root')
        // Also store in permissionsMap with '/' key
        if (roles.length > 0) {
          newPermissionsMap.set('/', roles)
        }
      } else {
        // Add folder ID for regular folders
        const folderId = `folder_${permission.path}`
        newCheckedIds.push(folderId)
      }
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
          
          // Strategy 2: Match by ID (check again here in case ID wasn't available earlier)
          if (permission.id && r.id === permission.id) {
            return true
          }
          
          // Strategy 3: Match folder path + name separately (CatalogItems returns folder path separately)
          if (normalizedPermissionFolderPath === normalizedReportPath && normalizedPermissionName === normalizedReportName) {
            return true
          }
          
          // Strategy 4: Match just by name with compatible paths (for Persian characters in root folder)
          if (normalizedPermissionName && normalizedReportName && 
              normalizedPermissionName === normalizedReportName &&
              (normalizedPermissionFolderPath === '/' || normalizedPermissionFolderPath === normalizedReportPath || normalizedReportPath === '/')) {
            return true
          }
          
          // Strategy 5: Match by extracting name from permission path
          const pathParts = normalizedPermissionPath.split('/').filter(p => p)
          const lastPathPart = pathParts[pathParts.length - 1] || ''
          if (lastPathPart && normalizedReportName === normalizePath(lastPathPart)) {
            if (normalizedReportPath === normalizedPermissionFolderPath || 
                (normalizedPermissionFolderPath === '/' && normalizedReportPath === '/') ||
                (normalizedPermissionPath === normalizedReportFullPath)) {
              return true
            }
          }
          
          // Strategy 6: Exact name match with compatible paths (fallback)
          if (permissionName === reportName && 
              (normalizedPermissionFolderPath === '/' || normalizedReportPath === '/') &&
              (normalizedPermissionPath.includes(reportName) || normalizedReportFullPath.includes(permissionName))) {
            return true
          }
          
          return false
        })
      }
      
      if (report) {
        const reportId = `report_${report.id}`
        newCheckedIds.push(reportId)
        // Also update permissionsMap with the report's fullPath for consistency
        const reportFullPath = report.fullPath || (report.path === '/' ? `/${report.name}` : `${report.path}/${report.name}`)
        const normalizedReportFullPath = normalizePath(reportFullPath)
        if (roles.length > 0) {
          newPermissionsMap.set(normalizedReportFullPath, roles)
        }
      } else {
        console.warn(`⚠ Could not find report for permission:`, {
          permissionPath: path,
          permissionFolderPath: permission.folderPath || 'N/A',
          permissionName: permissionName,
          permissionId: permission.id || 'N/A',
          permissionType: permission.type || permission.catalogType || 'N/A',
          availableReportsCount: props.reports.length,
          sampleReports: props.reports.slice(0, 3).map(r => ({ 
            id: r.id, 
            name: r.name, 
            path: r.path, 
            fullPath: r.fullPath 
          }))
        })
      }
    }
  })
  
  permissionsMap.value = newPermissionsMap
  checked.value = newCheckedIds
  // Store as original permissions (what user currently has)
  originalPermissions.value = [...newCheckedIds]
  
  // Also set itemRoles for checked items (especially server-root)
  const newItemRoles = new Map()
  newCheckedIds.forEach(nodeId => {
    if (nodeId === 'server-root') {
      // Get roles from permissionsMap using '/' key
      const roles = newPermissionsMap.get('/') || []
      if (roles.length > 0) {
        newItemRoles.set('server-root', roles)
      }
    } else {
      // For other items, get roles from permissionsMap
      const node = findNodeById(nodeId)
      if (node) {
        const path = node.type === 'folder' 
          ? node.path 
          : node.path || node.fullPath || ''
        const normalizePath = (p) => {
          return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
        }
        const normalizedPath = normalizePath(path)
        const roles = newPermissionsMap.get(normalizedPath) || []
        if (roles.length > 0) {
          newItemRoles.set(nodeId, roles)
        }
      }
    }
  })
  itemRoles.value = newItemRoles
  
  // Notify parent of role changes
  if (props.onRoleChanges) {
    props.onRoleChanges(new Map(itemRoles.value))
  }
}, { deep: true })

// Notify parent of selected items (excluding marked for removal)
watch([checked, markedForRemoval, originalPermissions, itemRoles], () => {
  const markedSet = new Set(markedForRemoval.value)
  const originalSet = new Set(originalPermissions.value)
  
  // Items to keep/add (checked but not marked, excluding unchanged original permissions)
  const selectedItems = checked.value
    .filter(id => {
      if (markedSet.has(id)) return false // Exclude marked
      // Include server-root if it's checked (represents home page "/")
      if (id === 'server-root') return true
      // Only include if it's NEW (not in original) or if we want to keep all checked
      // For optimization, we could filter out unchanged items here
      return true
    })
    .map(id => {
      // Handle server-root as home page "/"
      if (id === 'server-root') {
        return {
          type: 'Folder',
          path: '/',
          name: '/'
        }
      } else if (id.startsWith('report_')) {
        const reportId = id.replace('report_', '')
        return props.reports.find(r => r.id === reportId)
      } else if (id.startsWith('folder_')) {
        const folderPath = id.replace('folder_', '')
        return {
          type: 'Folder',
          path: folderPath,
          name: folderPath.split('/').pop()
        }
      }
      return null
    })
    .filter(item => item !== null)

  // Items marked for removal
  const markedItems = markedForRemoval.value
    .map(id => {
      // Handle server-root specially - it represents the home page "/"
      if (id === 'server-root') {
        return {
          type: 'Folder',
          path: '/',
          name: '/'
        }
      } else if (id.startsWith('report_')) {
        const reportId = id.replace('report_', '')
        return props.reports.find(r => r.id === reportId)
      } else if (id.startsWith('folder_')) {
        const folderPath = id.replace('folder_', '')
        return {
          type: 'Folder',
          path: folderPath,
          name: folderPath.split('/').pop()
        }
      }
      return null
    })
    .filter(item => item !== null)

  // New items (checked but not in original and not marked)
  const newItems = checked.value
    .filter(id => id !== 'server-root' && !markedSet.has(id) && !originalSet.has(id))
    .map(id => {
      if (id.startsWith('report_')) {
        const reportId = id.replace('report_', '')
        return props.reports.find(r => r.id === reportId)
      } else if (id.startsWith('folder_')) {
        const folderPath = id.replace('folder_', '')
        return {
          type: 'Folder',
          path: folderPath,
          name: folderPath.split('/').pop()
        }
      }
      return null
    })
    .filter(item => item !== null)

  props.onItemsSelected(selectedItems, markedItems, newItems, originalPermissions.value)
}, { deep: true })

const selectedItems = computed(() => {
  return checked.value.filter(id => id !== 'server-root')
})

const reportCount = computed(() => {
  return selectedItems.value.filter(id => id.startsWith('report_')).length
})

const folderCount = computed(() => {
  return selectedItems.value.filter(id => id.startsWith('folder_')).length
})

const hasFoldersSelected = computed(() => {
  return checked.value.some(id => id.startsWith('folder_'))
})

const hasPbixSelected = computed(() => {
  return checked.value.some(id => {
    const report = props.reports.find(r => `report_${r.id}` === id)
    return report && report.type.includes('PBIX')
  })
})

const hasRdlSelected = computed(() => {
  return checked.value.some(id => {
    const report = props.reports.find(r => `report_${r.id}` === id)
    return report && report.type.includes('RDL')
  })
})

const isAnyExpanded = computed(() => {
  return expanded.value.length > 1 // More than just 'server-root'
})

const isAnySelected = computed(() => {
  return checked.value.length > 0
})

const handleToggleExpand = (nodeId) => {
  const index = expanded.value.indexOf(nodeId)
  if (index > -1) {
    expanded.value.splice(index, 1)
  } else {
    expanded.value.push(nodeId)
  }
}

const getDescendantIds = (node) => {
  let ids = []
  if (node.children && Object.keys(node.children).length > 0) {
    Object.keys(node.children).forEach(key => {
      const childNode = node.children[key]
      const childId = childNode.type === 'folder' ? `folder_${childNode.path}`
        : childNode.nodeType === 'report' ? `report_${childNode.id}` : key
      ids.push(childId)
      ids = ids.concat(getDescendantIds(childNode))
    })
  }
  return ids
}

const handleCheck = ({ nodeId, node, isChecked, isMarkedForRemoval }) => {
  const checkedSet = new Set(checked.value)
  const markedSet = new Set(markedForRemoval.value)
  const originalSet = new Set(originalPermissions.value)
  const isReport = node.nodeType === 'report' || nodeId.startsWith('report_')

  // Check if this item is in the original permissions (user already had access)
  const wasOriginallyChecked = originalSet.has(nodeId)

  if (wasOriginallyChecked) {
    // FOR ITEMS USER ALREADY HAS ACCESS TO:
    // Toggle between Checked (keep) and Marked (remove)
    // Cannot be completely unchecked
    
    if (isMarkedForRemoval) {
      // State: Marked -> Checked (keep existing permission)
      markedSet.delete(nodeId)
      // Stay checked (don't remove from checkedSet)
      
      // Automatically add Browser role if not already in itemRoles
      // This ensures Browser role shows even for items with existing permissions
      if (!itemRoles.value.has(nodeId)) {
        // Get existing roles from permissionsMap or default to Browser
        const node = findNodeById(nodeId)
        let existingRoles = []
        if (node) {
          const path = node.type === 'folder' 
            ? node.path 
            : node.path || node.fullPath || ''
          // Normalize path: handle Unicode properly, don't use toLowerCase on Persian chars
          const normalizePath = (p) => {
            return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
          }
          const normalizedPath = normalizePath(path)
          // Try exact match first
          existingRoles = permissionsMap.value.get(normalizedPath)
          // If not found, try case-insensitive match (but preserve Unicode)
          if (!existingRoles) {
            for (const [mapPath, mapRoles] of permissionsMap.value.entries()) {
              if (normalizePath(mapPath) === normalizedPath) {
                existingRoles = mapRoles
                break
              }
            }
          }
          existingRoles = existingRoles || ['Browser']
        } else {
          existingRoles = ['Browser']
        }
        itemRoles.value.set(nodeId, existingRoles)
      }
      
      // Also unmark descendants if they were originally checked
      const descendantIds = getDescendantIds(node)
      descendantIds.forEach(id => {
        if (originalSet.has(id)) {
          markedSet.delete(id)
          // Auto-add Browser role for unmarked descendants
          if (!itemRoles.value.has(id)) {
            const descNode = findNodeById(id)
            let descRoles = []
            if (descNode) {
              const path = descNode.type === 'folder' 
                ? descNode.path 
                : descNode.path || descNode.fullPath || ''
              const normalizedPath = path.toLowerCase().replace(/\\/g, '/').replace(/\/+/g, '/')
              descRoles = permissionsMap.value.get(normalizedPath) || ['Browser']
            } else {
              descRoles = ['Browser']
            }
            itemRoles.value.set(id, descRoles)
          }
        }
      })
      
      // Notify parent of role changes
      if (props.onRoleChanges) {
        props.onRoleChanges(new Map(itemRoles.value))
      }
    } else if (isChecked) {
      // State: Checked -> Marked (remove existing permission)
      markedSet.add(nodeId)
      
      // Mark descendants for removal too if they were originally checked
      const descendantIds = getDescendantIds(node)
      descendantIds.forEach(id => {
        if (originalSet.has(id)) {
          markedSet.add(id)
        }
      })
    } else {
      // State: Unchecked -> Checked (for items with original permissions)
      // Add to checkedSet so the checkbox shows as checked
      checkedSet.add(nodeId)
      
      // Automatically add Browser role if not already in itemRoles
      if (!itemRoles.value.has(nodeId)) {
        // Get existing roles from permissionsMap or default to Browser
        const node = findNodeById(nodeId)
        let existingRoles = []
        if (node) {
          const path = node.type === 'folder' 
            ? node.path 
            : node.path || node.fullPath || ''
          // Normalize path: handle Unicode properly, don't use toLowerCase on Persian chars
          const normalizePath = (p) => {
            return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
          }
          const normalizedPath = normalizePath(path)
          // Try exact match first
          existingRoles = permissionsMap.value.get(normalizedPath)
          // If not found, try case-insensitive match (but preserve Unicode)
          if (!existingRoles) {
            for (const [mapPath, mapRoles] of permissionsMap.value.entries()) {
              if (normalizePath(mapPath) === normalizedPath) {
                existingRoles = mapRoles
                break
              }
            }
          }
          existingRoles = existingRoles || ['Browser']
        } else {
          existingRoles = ['Browser']
        }
        itemRoles.value.set(nodeId, existingRoles)
        if (props.onRoleChanges) {
          props.onRoleChanges(new Map(itemRoles.value))
        }
      }
    }
  } else {
    // FOR ITEMS USER DOESN'T HAVE ACCESS TO:
    // Can be checked (add) or unchecked (don't add)
    // Cannot be marked with X (can't remove what they don't have)
    
    if (isChecked) {
      // State: Checked -> Unchecked (don't add new permission)
      checkedSet.delete(nodeId)
      // Remove from itemRoles if it was there
      itemRoles.value.delete(nodeId)
      
      // Uncheck descendants that aren't in original permissions
      const descendantIds = getDescendantIds(node)
      descendantIds.forEach(id => {
        if (!originalSet.has(id)) {
          checkedSet.delete(id)
          itemRoles.value.delete(id)
        }
      })
    } else {
      // State: Unchecked -> Checked (add new permission)
      checkedSet.add(nodeId)
      
      // Automatically add Browser role for ALL selected items (if not already in itemRoles)
      if (!itemRoles.value.has(nodeId)) {
        itemRoles.value.set(nodeId, ['Browser'])
        if (props.onRoleChanges) {
          props.onRoleChanges(new Map(itemRoles.value))
        }
      }
      
      // Check descendants that aren't in original permissions
      const descendantIds = getDescendantIds(node)
      descendantIds.forEach(id => {
        if (!originalSet.has(id)) {
          checkedSet.add(id)
          // Auto-add Browser role for new descendant items
          if (!itemRoles.value.has(id)) {
            itemRoles.value.set(id, ['Browser'])
          }
        }
      })
      
      // Auto-select parents if enabled
      if (autoSelectParents.value && isReport) {
        const parentIds = folderMap.value.get(nodeId) || []
        parentIds.forEach(id => {
          if (!originalSet.has(id)) {
            checkedSet.add(id)
            // Auto-add Browser role for new parent folders
            if (!itemRoles.value.has(id)) {
              itemRoles.value.set(id, ['Browser'])
            }
          }
        })
        // Always check server-root when auto-select is enabled
        if (!originalSet.has('server-root')) {
          checkedSet.add('server-root')
          // Auto-add Browser role for server-root if not already set
          if (!itemRoles.value.has('server-root')) {
            const serverRoles = permissionsMap.value.get('/') || ['Browser']
            itemRoles.value.set('server-root', serverRoles)
          }
        }
      }
      
      // Notify parent of role changes
      if (props.onRoleChanges) {
        props.onRoleChanges(new Map(itemRoles.value))
      }
    }
  }

  checked.value = Array.from(checkedSet)
  markedForRemoval.value = Array.from(markedSet)
}

const handleToggle = (nodeId) => {
  // For future use
}

const expandAll = () => {
  expanded.value = [...allNodeIds.value]
  lastAction.value = 'expand'
}

const collapseAll = () => {
  expanded.value = ['server-root'] // Collapse all except server-root (keep it expanded)
  lastAction.value = 'collapse'
}

const selectAll = () => {
  checked.value = [...allNodeIds.value]
  lastAction.value = 'select'
}

const deselectAll = () => {
  checked.value = []
  markedForRemoval.value = []
  lastAction.value = 'deselect'
}

const toggleAllType = (type, shouldSelect) => {
  const typeIds = []

  if (type === 'folder') {
    allNodeIds.value.forEach(id => {
      if (id.startsWith('folder_')) {
        typeIds.push(id)
      }
    })
  } else if (type === 'pbix' || type === 'rdl') {
    props.reports.forEach(report => {
      const matchesType = type === 'pbix'
        ? report.type.includes('PBIX')
        : report.type.includes('RDL')

      if (matchesType) {
        const reportId = `report_${report.id}`
        typeIds.push(reportId)

        if (autoSelectParents.value && shouldSelect) {
          const parentIds = folderMap.value.get(reportId) || []
          parentIds.forEach(id => {
            if (!typeIds.includes(id)) {
              typeIds.push(id)
            }
          })
          // Always include server-root when auto-select is enabled
          if (!typeIds.includes('server-root')) {
            typeIds.push('server-root')
          }
        }
      }
    })
  }

  if (shouldSelect) {
    const newSet = new Set([...checked.value, ...typeIds])
    checked.value = Array.from(newSet)
  } else {
    checked.value = checked.value.filter(id => !typeIds.includes(id))
  }
}

// Rename functionality
const startEditing = (nodeId) => {
  // Find the node to get its current name
  const findNode = (nodes, targetId) => {
    for (const key in nodes) {
      const node = nodes[key]
      const id = node.type === 'folder' ? `folder_${node.path}` :
                node.nodeType === 'report' ? `report_${node.id}` :
                node.type === 'server' ? 'server-root' : key

      if (id === targetId) {
        return { node, key }
      }

      if (node.children) {
        const found = findNode(node.children, targetId)
        if (found) return found
      }
    }
    return null
  }

  const result = findNode({ 'server-root': treeData.value }, nodeId)

  if (result) {
    const { node, key } = result
    const displayName = node.type === 'folder' ? key :
                       node.nodeType === 'report' ? node.name.replace(/\.(pbix|rdl)$/i, '') :
                       node.name

    editingNodeId.value = nodeId
    editingValue.value = displayName
  }
}

const setEditingValue = (value) => {
  editingValue.value = value
}

const cancelEditing = () => {
  editingNodeId.value = null
  editingValue.value = ''
}

const saveEditing = async (nodeId) => {
  const newName = editingValue.value.trim()

  if (!newName) {
    alert(t('enterValidUsername'))
    return
  }

  try {
    // Find the node
    const findNode = (nodes, targetId) => {
      for (const key in nodes) {
        const node = nodes[key]
        const id = node.type === 'folder' ? `folder_${node.path}` :
                  node.nodeType === 'report' ? `report_${node.id}` :
                  node.type === 'server' ? 'server-root' : key

        if (id === targetId) {
          return { node, key }
        }

        if (node.children) {
          const found = findNode(node.children, targetId)
          if (found) return found
        }
      }
      return null
    }

    const result = findNode({ 'server-root': treeData.value }, nodeId)

    if (!result) {
      alert('Node not found')
      cancelEditing()
      return
    }

    const { node } = result
    const isFolder = node.type === 'folder'
    const itemId = isFolder ? node.path : node.id
    const itemType = isFolder ? 'Folder' : node.type

    if (!props.connectionInfo || !props.connectionInfo.serverUri) {
      alert('Connection information is missing. Please reconnect to the server.')
      cancelEditing()
      return
    }

    // Call the rename API
    const response = await axios.post('/api/reports/rename', {
      serverUri: props.connectionInfo.serverUri,
      itemId: itemId,
      itemType: itemType,
      newName: newName
    })

    if (response.data.success) {
      alert(`Successfully renamed to: ${newName}`)
      cancelEditing()
      // Reload reports
      if (props.onReloadReports) {
        setTimeout(() => {
          props.onReloadReports()
        }, 500)
      }
    } else {
      const errorMsg = response.data.error || response.data.message || 'Unknown error'
      alert(`Failed to rename: ${errorMsg}`)
    }
  } catch (error) {
    alert(`Error renaming: ${error.message}`)
    console.error('Rename error:', error)
  }
}

const getChildNodeId = (childNode, key) => {
  if (childNode.type === 'folder') {
    return `folder_${childNode.path}`
  } else if (childNode.nodeType === 'report') {
    return `report_${childNode.id}`
  }
  return key
}

const handleAddRole = (nodeId, role) => {
  // Get current roles from itemRoles (user edits) or permissionsMap (original)
  // Check if nodeId exists in itemRoles first (even if value is empty array)
  let currentRoles = null
  if (itemRoles.value.has(nodeId)) {
    currentRoles = itemRoles.value.get(nodeId)
  }
  
  // If not in itemRoles, get from permissionsMap based on node path
  if (currentRoles === null || currentRoles === undefined) {
    // Handle server-root specially - it represents the home page "/"
    if (nodeId === 'server-root') {
      currentRoles = permissionsMap.value.get('/') || []
    } else {
      const node = findNodeById(nodeId)
      if (node) {
        const path = node.type === 'folder' 
          ? node.path 
          : node.path || node.fullPath || ''
        // Normalize path: handle Unicode properly, don't use toLowerCase on Persian chars
        const normalizePath = (p) => {
          return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
        }
        const normalizedPath = normalizePath(path)
        // Try exact match first
        currentRoles = permissionsMap.value.get(normalizedPath)
        // If not found, try case-insensitive match (but preserve Unicode)
        if (!currentRoles) {
          for (const [mapPath, mapRoles] of permissionsMap.value.entries()) {
            if (normalizePath(mapPath) === normalizedPath) {
              currentRoles = mapRoles
              break
            }
          }
        }
        currentRoles = currentRoles || []
      } else {
        currentRoles = []
      }
    }
  }
  
  // Ensure currentRoles is an array
  if (!Array.isArray(currentRoles)) {
    currentRoles = []
  }
  
  // Add role if not already present
  if (!currentRoles.includes(role)) {
    const newRoles = [...currentRoles, role]
    itemRoles.value.set(nodeId, newRoles)
    // If item was marked for removal, unmark it since we're adding a role back
    const markedSet = new Set(markedForRemoval.value)
    if (markedSet.has(nodeId)) {
      markedSet.delete(nodeId)
      markedForRemoval.value = Array.from(markedSet)
    }
    // Automatically select the object when a role is added
    const checkedSet = new Set(checked.value)
    if (!checkedSet.has(nodeId)) {
      checkedSet.add(nodeId)
      checked.value = Array.from(checkedSet)
    }
    // Notify parent of role changes immediately
    if (props.onRoleChanges) {
      props.onRoleChanges(new Map(itemRoles.value))
    }
  }
  rolePickerOpen.value = null
}

const handleAddAllRoles = (nodeId, rolesToAdd) => {
  // Get current roles from itemRoles (user edits) or permissionsMap (original)
  // Check if nodeId exists in itemRoles first (even if value is empty array)
  let currentRoles = null
  if (itemRoles.value.has(nodeId)) {
    currentRoles = itemRoles.value.get(nodeId)
  }
  
  // If not in itemRoles, get from permissionsMap based on node path
  if (currentRoles === null || currentRoles === undefined) {
    const node = findNodeById(nodeId)
    if (node) {
      const path = node.type === 'folder' 
        ? node.path 
        : node.path || node.fullPath || ''
      // Normalize path: handle Unicode properly, don't use toLowerCase on Persian chars
      const normalizePath = (p) => {
        return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
      }
      const normalizedPath = normalizePath(path)
      // Try exact match first
      currentRoles = permissionsMap.value.get(normalizedPath)
      // If not found, try case-insensitive match (but preserve Unicode)
      if (!currentRoles) {
        for (const [mapPath, mapRoles] of permissionsMap.value.entries()) {
          if (normalizePath(mapPath) === normalizedPath) {
            currentRoles = mapRoles
            break
          }
        }
      }
      currentRoles = currentRoles || []
    } else {
      currentRoles = []
    }
  }
  
  // Ensure currentRoles is an array
  if (!Array.isArray(currentRoles)) {
    currentRoles = []
  }
  
  // Add all roles that are not already present
  const newRoles = [...currentRoles]
  rolesToAdd.forEach(role => {
    if (!newRoles.includes(role)) {
      newRoles.push(role)
    }
  })
  
  itemRoles.value.set(nodeId, newRoles)
  // If item was marked for removal, unmark it since we're adding roles back
  const markedSet = new Set(markedForRemoval.value)
  if (markedSet.has(nodeId)) {
    markedSet.delete(nodeId)
    markedForRemoval.value = Array.from(markedSet)
  }
  // Automatically select the object when roles are added
  const checkedSet = new Set(checked.value)
  if (!checkedSet.has(nodeId)) {
    checkedSet.add(nodeId)
    checked.value = Array.from(checkedSet)
  }
  // Notify parent of role changes
  if (props.onRoleChanges) {
    props.onRoleChanges(new Map(itemRoles.value))
  }
  rolePickerOpen.value = null
}

// Helper function to find node by ID
const findNodeById = (targetId) => {
  const findInNodes = (nodes) => {
    for (const key in nodes) {
      const node = nodes[key]
      const id = node.type === 'folder' ? `folder_${node.path}` :
                node.nodeType === 'report' ? `report_${node.id}` :
                node.type === 'server' ? 'server-root' : key

      if (id === targetId) {
        return node
      }

      if (node.children) {
        const found = findInNodes(node.children)
        if (found) return found
      }
    }
    return null
  }
  
  return findInNodes({ 'server-root': treeData.value })
}

const handleRemoveRole = (nodeId, role) => {
  // Get current roles from itemRoles (user edits) or permissionsMap (original)
  // Check if nodeId exists in itemRoles first (even if value is empty array)
  let currentRoles = null
  if (itemRoles.value.has(nodeId)) {
    currentRoles = itemRoles.value.get(nodeId)
  }
  
  // If not in itemRoles, get from permissionsMap based on node path
  if (currentRoles === null || currentRoles === undefined) {
    // Handle server-root specially - it represents the home page "/"
    if (nodeId === 'server-root') {
      currentRoles = permissionsMap.value.get('/') || []
    } else {
      const node = findNodeById(nodeId)
      if (node) {
        const path = node.type === 'folder' 
          ? node.path 
          : node.path || node.fullPath || ''
        // Normalize path: handle Unicode properly, don't use toLowerCase on Persian chars
        const normalizePath = (p) => {
          return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
        }
        const normalizedPath = normalizePath(path)
        // Try exact match first
        currentRoles = permissionsMap.value.get(normalizedPath)
        // If not found, try case-insensitive match (but preserve Unicode)
        if (!currentRoles) {
          for (const [mapPath, mapRoles] of permissionsMap.value.entries()) {
            if (normalizePath(mapPath) === normalizedPath) {
              currentRoles = mapRoles
              break
            }
          }
        }
        currentRoles = currentRoles || []
      } else {
        currentRoles = []
      }
    }
  }
  
  // Ensure currentRoles is an array
  if (!Array.isArray(currentRoles)) {
    currentRoles = []
  }
  
  const updatedRoles = currentRoles.filter(r => r !== role)
  
  // If all roles are removed, handle based on whether item was originally in user's permissions
  if (updatedRoles.length === 0) {
    itemRoles.value.set(nodeId, []) // Set empty array to track that all roles should be removed
    
    const checkedSet = new Set(checked.value)
    const markedSet = new Set(markedForRemoval.value)
    const originalSet = new Set(originalPermissions.value)
    const wasOriginallyChecked = originalSet.has(nodeId)
    
    if (wasOriginallyChecked) {
      // Item was originally in user's permissions: mark for removal (*) instead of unchecking
      // This keeps the same context as manually unchecking the item
      if (!checkedSet.has(nodeId)) {
        checkedSet.add(nodeId) // Ensure it's checked
      }
      markedSet.add(nodeId) // Mark for removal (*)
      checked.value = Array.from(checkedSet)
      markedForRemoval.value = Array.from(markedSet)
    } else {
      // Item is new (not in original permissions): uncheck it
      if (checkedSet.has(nodeId)) {
        checkedSet.delete(nodeId)
        markedSet.delete(nodeId) // Also remove from markedForRemoval if it was there
        checked.value = Array.from(checkedSet)
        markedForRemoval.value = Array.from(markedSet)
      }
    }
  } else {
    itemRoles.value.set(nodeId, updatedRoles)
  }
  
  // Notify parent of role changes
  if (props.onRoleChanges) {
    props.onRoleChanges(new Map(itemRoles.value))
  }
}

const handleToggleRolePicker = (nodeId) => {
  rolePickerOpen.value = rolePickerOpen.value === nodeId ? null : nodeId
}

const handleServerSwitch = (serverUri) => {
  if (props.onServerSwitch) {
    props.onServerSwitch(serverUri)
  }
}
</script>

<style scoped>
.report-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.tree-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.tree-header h2 svg {
  flex-shrink: 0;
}

.search-and-actions-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 0 1 300px;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 40px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  color: #344054;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}

.search-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.1);
}

.search-input::placeholder {
  color: #98a2b3;
}

.dark-mode .search-input {
  background: #2c2c2c;
  color: white;
  border-color: #444;
}

.dark-mode .search-input:focus {
  border-color: #64b5f6;
  box-shadow: 0 0 0 4px rgba(100, 181, 246, 0.1);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 1.2rem;
  color: #999;
}

.clear-search:hover {
  color: #666;
}

.quick-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  border: none;
  border-radius: 6px;
  padding: 8px;
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s ease;
}

.action-btn.icon-btn {
  width: 36px;
}

.dark-mode .action-btn {
  color: #9ca3af;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
}

.dark-mode .action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
}

/* Active state for action buttons */
.action-btn.active {
  background: rgba(0, 0, 0, 0.08);
  color: #111827;
}

.dark-mode .action-btn.active {
  background: rgba(255, 255, 255, 0.12);
  color: #f9fafb;
}

.type-filters {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

/* RTL Support for type filters */
[dir="rtl"] .type-filters {
  margin-left: 0;
  margin-right: auto;
}

.filter-checkbox-icon {
  position: relative;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.filter-checkbox-icon input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.filter-checkbox-icon .checkbox-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  transition: all 0.15s ease;
}

.filter-checkbox-icon:hover .checkbox-icon {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
}

.filter-checkbox-icon input[type="checkbox"]:checked + .checkbox-icon {
  background: rgba(0, 0, 0, 0.08);
  color: #111827;
}

.dark-mode .filter-checkbox-icon .checkbox-icon {
  color: #9ca3af;
}

.dark-mode .filter-checkbox-icon:hover .checkbox-icon {
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
}

.dark-mode .filter-checkbox-icon input[type="checkbox"]:checked + .checkbox-icon {
  background: rgba(255, 255, 255, 0.12);
  color: #f9fafb;
}

.tree-container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  padding: 0;
  background: white;
  min-height: 0;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.1), 0 1px 2px rgba(16, 24, 40, 0.06);
  display: flex;
  flex-direction: column;
}

.dark-mode .tree-container {
  background: #1e1e1e;
  border-color: #3a3a3a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
}

.table-view-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.dark-mode .report-table {
  background: #1e1e1e;
}

.report-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #eaecf0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.dark-mode .report-table thead {
  background: #2c2c2c;
  border-bottom-color: #3a3a3a;
}

.report-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 400;
  font-size: 0.875rem;
  font-family: sans-serif;
  color: #6b7280;
  text-transform: capitalize;
  letter-spacing: 0;
}

.dark-mode .report-table th {
  color: #9ca3af;
}

.object-name-header {
  width: 50%;
}

.role-access-header {
  width: 50%;
}

.report-table tbody {
  background: white;
}

.dark-mode .report-table tbody {
  background: #1e1e1e;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #999;
}

.empty-state-row {
  border: none;
}

.empty-state-cell {
  padding: 2rem;
  text-align: center;
  color: #999;
}

.dark-mode .empty-state-cell {
  color: #999;
}

/* Responsive Design */
@media (max-width: 992px) {
  .search-and-actions-row {
    flex-wrap: wrap;
  }
  
  .type-filters {
    margin-left: 0;
    order: 3;
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .search-and-actions-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    flex: 1 1 auto;
    width: 100%;
  }
  
  .quick-actions {
    justify-content: center;
  }
  
  .type-filters {
    width: 100%;
    justify-content: center;
  }
}
</style>
