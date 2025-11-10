<template>
  <div class="report-tree">
    <div class="tree-header">
      <h2>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4C3 3.44772 3.44772 3 4 3H8.58579C8.851 3 9.10536 3.10536 9.29289 3.29289L11 5H16C16.5523 5 17 5.44772 17 6V15C17 15.5523 16.5523 16 16 16H4C3.44772 16 3 15.5523 3 15V4Z" fill="currentColor"/>
        </svg>
        {{ t('reportsAndFolders') }}
      </h2>
    </div>

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

    <!-- Tree View -->
    <div class="tree-container">
      <div v-if="Object.keys(treeData.children).length === 0" class="empty-state">
        {{ searchText ? t('noMatch') : t('noReports') }}
      </div>
      <div v-else class="tree-view">
        <TreeNode
          :node="treeData"
          :node-id="'server-root'"
          :expanded="expandedSet"
          :checked="checkedSet"
          :marked-for-removal="markedForRemovalSet"
          :server-name="serverAddress"
          :editing-node-id="editingNodeId"
          :editing-value="editingValue"
          @toggle="handleToggle"
          @check="handleCheck"
          @toggle-expand="handleToggleExpand"
          @start-editing="startEditing"
          @update-editing="setEditingValue"
          @save-editing="saveEditing"
          @cancel-editing="cancelEditing"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import TreeNode from './TreeNode.vue'
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
  }
})

const searchText = ref('')
const expanded = ref(['server-root'])
const checked = ref([])
const markedForRemoval = ref([]) // Items marked with red X for removal
const originalPermissions = ref([]) // Items user originally had access to (from Check Permissions)
const autoSelectParents = ref(false)
const editingNodeId = ref(null)
const editingValue = ref('')
const lastAction = ref('') // Track last clicked action: 'expand', 'collapse', 'select', 'deselect'

const serverAddress = computed(() => {
  return props.connectionInfo?.serverUri || 'Report Server'
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
  expanded.value = ['server-root']
}, { deep: false })

// Auto-expand when searching
watch(searchText, () => {
  if (searchText.value.trim()) {
    expanded.value = [...allNodeIds.value]
  } else {
    expanded.value = ['server-root']
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

    checked.value = Array.from(checkedSet)
  }
})

// Clean up stale checked items that don't exist in current tree
watch(allNodeIds, () => {
  const validIds = new Set(allNodeIds.value)
  checked.value = checked.value.filter(id => validIds.has(id))
}, { immediate: true })

// Watch for external permissions data to update checked items
watch(() => props.permissionsData, (newPermissions) => {
  if (!newPermissions || newPermissions.length === 0) {
    return
  }
  
  // Clear current selection and marked items
  checked.value = []
  markedForRemoval.value = []
  
  // Map permissions to node IDs and check them
  const newCheckedIds = []
  
  newPermissions.forEach(permission => {
    if (permission.itemType === 'Folder') {
      // Add folder ID
      const folderId = `folder_${permission.path}`
      newCheckedIds.push(folderId)
    } else if (permission.itemType === 'Report') {
      // Find the report by path and get its ID
      const report = props.reports.find(r => r.path === permission.path || r.fullPath === permission.path)
      if (report) {
        const reportId = `report_${report.id}`
        newCheckedIds.push(reportId)
      }
    }
  })
  
  checked.value = newCheckedIds
  // Store as original permissions (what user currently has)
  originalPermissions.value = [...newCheckedIds]
}, { deep: true })

// Notify parent of selected items (excluding marked for removal)
watch([checked, markedForRemoval, originalPermissions], () => {
  const markedSet = new Set(markedForRemoval.value)
  const originalSet = new Set(originalPermissions.value)
  
  // Items to keep/add (checked but not marked, excluding unchanged original permissions)
  const selectedItems = checked.value
    .filter(id => {
      if (id === 'server-root') return false
      if (markedSet.has(id)) return false // Exclude marked
      // Only include if it's NEW (not in original) or if we want to keep all checked
      // For optimization, we could filter out unchanged items here
      return true
    })
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

  // Items marked for removal
  const markedItems = markedForRemoval.value
    .filter(id => id !== 'server-root')
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
      
      // Also unmark descendants if they were originally checked
      const descendantIds = getDescendantIds(node)
      descendantIds.forEach(id => {
        if (originalSet.has(id)) {
          markedSet.delete(id)
        }
      })
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
    }
  } else {
    // FOR ITEMS USER DOESN'T HAVE ACCESS TO:
    // Can be checked (add) or unchecked (don't add)
    // Cannot be marked with X (can't remove what they don't have)
    
    if (isChecked) {
      // State: Checked -> Unchecked (don't add new permission)
      checkedSet.delete(nodeId)
      
      // Uncheck descendants that aren't in original permissions
      const descendantIds = getDescendantIds(node)
      descendantIds.forEach(id => {
        if (!originalSet.has(id)) {
          checkedSet.delete(id)
        }
      })
    } else {
      // State: Unchecked -> Checked (add new permission)
      checkedSet.add(nodeId)
      
      // Check descendants that aren't in original permissions
      const descendantIds = getDescendantIds(node)
      descendantIds.forEach(id => {
        if (!originalSet.has(id)) {
          checkedSet.add(id)
        }
      })
      
      // Auto-select parents if enabled
      if (autoSelectParents.value && isReport) {
        const parentIds = folderMap.value.get(nodeId) || []
        parentIds.forEach(id => {
          if (!originalSet.has(id)) {
            checkedSet.add(id)
          }
        })
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
  expanded.value = ['server-root']
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
  overflow-y: auto;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  padding: 0;
  background: white;
  min-height: 0;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.1), 0 1px 2px rgba(16, 24, 40, 0.06);
}

.dark-mode .tree-container {
  background: #1e1e1e;
  border-color: #3a3a3a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
}

.empty-state {
  padding: 2rem;
  text-align: center;
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
