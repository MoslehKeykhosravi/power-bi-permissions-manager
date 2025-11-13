<template>
  <tr class="table-tree-row" :class="{ 'row-marked-removal': isMarkedForRemoval }">
    <td class="object-cell">
      <div class="tree-node-content" :style="{ paddingLeft: `${level * 20}px` }">
        <!-- Expand/Collapse Icon -->
        <span 
          v-if="hasChildren" 
          class="expand-icon"
          :class="{ 'expanded': isExpanded }"
          @click.stop="$emit('toggle-expand', nodeId)"
        >
          <!-- Up arrow when expanded (blue circle and arrow) -->
          <svg v-if="isExpanded" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7" fill="none" stroke="#2196f3" stroke-width="1"/>
            <path d="M5 9L8 6L11 9" stroke="#2196f3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
          <!-- Down arrow when collapsed (gray circle and arrow) -->
          <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7" fill="none" stroke="#6b7280" stroke-width="1"/>
            <path d="M5 7L8 10L11 7" stroke="#6b7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </span>
        <span v-else class="expand-spacer"></span>

        <!-- Checkbox -->
        <label class="custom-checkbox" @click.stop>
          <input
            type="checkbox"
            :checked="isChecked"
            @change="handleCheckChange"
            class="checkbox-input"
          />
          <span class="checkbox-box" :class="{ 'marked-removal': isMarkedForRemoval, 'checked': isChecked && !isMarkedForRemoval }">
            <svg v-if="isChecked && !isMarkedForRemoval" class="checkbox-checkmark" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span v-if="isMarkedForRemoval" class="removal-mark">×</span>
          </span>
        </label>

        <!-- Icon -->
        <span class="node-icon">
          <component v-if="getIconComponent()" :is="getIconComponent()" :size="18" />
        </span>

        <!-- Name (editable) -->
        <input
          v-if="isEditing"
          :value="editingValue"
          @input="$emit('update-editing', $event.target.value)"
          @keydown="handleKeyDown"
          @blur="handleBlur"
          @click.stop
          class="node-name-input"
          ref="nameInput"
        />
        <div v-else class="node-name-wrapper" @click.stop>
          <span
            class="node-name"
            :class="{ 'clickable-server': nodeId === 'server-root' && serverList.length > 0 }"
            @click="handleServerNameClick"
            @dblclick="handleDoubleClick"
          >
            {{ getDisplayName() }}
          </span>
          <!-- Server Picker Dropdown (only for server-root) -->
          <div
            v-if="nodeId === 'server-root' && serverList.length > 0 && serverPickerOpen"
            class="server-picker-dropdown"
            @click.stop
          >
            <div
              v-for="server in serverList"
              :key="server"
              @click="handleServerSelect(server)"
              class="server-picker-item"
              :class="{ 'active': server === currentServerUri }"
              :title="server"
            >
              <svg v-if="server === currentServerUri" width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="check-icon">
                <path d="M2 8L6 12L14 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="server-url-text">{{ server }}</span>
            </div>
          </div>
        </div>

        <!-- Rename button -->
        <button
          v-if="!isEditing && nodeId !== 'server-root'"
          class="rename-btn"
          @click.stop="handleStartEditing"
          title="Rename (F2)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </td>
    <td class="role-cell">
      <div class="roles-container">
        <span
          v-for="role in currentRoles"
          :key="role"
          class="role-tag"
        >
          {{ getRoleText(role) }}
          <button
            @click.stop="$emit('remove-role', nodeId, role)"
            class="role-tag-remove"
            :title="t('removeRole')"
          >
            ×
          </button>
        </span>
        <div v-if="!hasAllRoles" class="role-add-wrapper">
          <button
            @click.stop="$emit('toggle-role-picker', nodeId)"
            class="role-add-btn"
            :title="t('addRole')"
          >
            + {{ t('addRole') }}
          </button>
          <div
            v-if="rolePickerOpen === nodeId"
            class="role-picker-dropdown"
            @click.stop
          >
            <!-- Select All option - only show if there are unassigned roles -->
            <div
              v-if="unassignedRoles.length > 0"
              @click="handleSelectAllRoles"
              class="role-picker-item select-all-item"
            >
              <strong>{{ t('selectAll') || 'Select All' }}</strong>
            </div>
            <div
              v-if="unassignedRoles.length > 0 && unassignedRoles.length < availableRoles.length"
              class="role-picker-divider"
            ></div>
            <!-- Only show roles that are NOT already assigned -->
            <div
              v-for="role in unassignedRoles"
              :key="role"
              @click="$emit('add-role', nodeId, role)"
              class="role-picker-item"
            >
              {{ getRoleText(role) }}
            </div>
            <!-- Show message if all roles are assigned -->
            <div
              v-if="unassignedRoles.length === 0"
              class="role-picker-item disabled empty-message"
            >
              {{ t('allRolesAssigned') || 'All roles assigned' }}
            </div>
          </div>
        </div>
      </div>
    </td>
  </tr>
  <!-- Child rows (recursive) -->
  <template v-if="hasChildren && isExpanded">
    <TableTreeNode
      v-for="(childNode, key) in node.children"
      :key="getChildNodeId(childNode, key)"
      :node="childNode"
      :node-id="getChildNodeId(childNode, key)"
      :expanded="expanded"
      :checked="checked"
      :marked-for-removal="markedForRemoval"
      :original-permissions="originalPermissions"
      :editing-node-id="editingNodeId"
      :editing-value="editingValue"
      :permissions-map="permissionsMap"
      :item-roles="itemRoles"
      :role-picker-open="rolePickerOpen"
      :level="level + 1"
      :server-list="serverList"
      :current-server-uri="currentServerUri"
      @toggle-expand="$emit('toggle-expand', $event)"
      @check="$emit('check', $event)"
      @start-editing="$emit('start-editing', $event)"
      @update-editing="$emit('update-editing', $event)"
      @save-editing="$emit('save-editing', $event)"
      @cancel-editing="$emit('cancel-editing')"
      @add-role="(nodeId, role) => $emit('add-role', nodeId, role)"
      @add-all-roles="(nodeId, roles) => $emit('add-all-roles', nodeId, roles)"
      @remove-role="(nodeId, role) => $emit('remove-role', nodeId, role)"
      @toggle-role-picker="$emit('toggle-role-picker', $event)"
      @switch-server="$emit('switch-server', $event)"
    />
  </template>
</template>

<script setup>
import { computed, watch, nextTick, ref, onMounted, onUnmounted } from 'vue'
import PowerBIIcon from '../assets/PowerBIIcon.vue'
import RDLIcon from '../assets/RDLIcon.vue'
import FolderIcon from '../assets/FolderIcon.vue'
import ServerIcon from '../assets/ServerIcon.vue'
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  nodeId: {
    type: String,
    required: true
  },
  expanded: {
    type: Set,
    default: () => new Set()
  },
  checked: {
    type: Set,
    default: () => new Set()
  },
  markedForRemoval: {
    type: Set,
    default: () => new Set()
  },
  originalPermissions: {
    type: Set,
    default: () => new Set()
  },
  editingNodeId: {
    type: String,
    default: null
  },
  editingValue: {
    type: String,
    default: ''
  },
  permissionsMap: {
    type: Map,
    default: () => new Map()
  },
  itemRoles: {
    type: Map,
    default: () => new Map()
  },
  rolePickerOpen: {
    type: String,
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  serverList: {
    type: Array,
    default: () => []
  },
  currentServerUri: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['toggle-expand', 'check', 'start-editing', 'update-editing', 'save-editing', 'cancel-editing', 'add-role', 'add-all-roles', 'remove-role', 'toggle-role-picker', 'switch-server'])

const nameInput = ref(null)
const serverPickerOpen = ref(false)

const availableRoles = [
  'Browser',
  'Content Manager',
  'My Reports',
  'Publisher',
  'Report Builder'
]

const hasChildren = computed(() => {
  return props.node.children && Object.keys(props.node.children).length > 0
})

const isExpanded = computed(() => {
  return props.expanded.has(props.nodeId)
})

const isChecked = computed(() => {
  return props.checked.has(props.nodeId)
})

const isMarkedForRemoval = computed(() => {
  return props.markedForRemoval.has(props.nodeId)
})

const isEditing = computed(() => {
  return props.editingNodeId === props.nodeId
})

// Get current roles for this item
const currentRoles = computed(() => {
  // First check itemRoles (user-edited roles) - these override permissions data
  if (props.itemRoles && props.itemRoles.has(props.nodeId)) {
    const roles = props.itemRoles.get(props.nodeId)
    // Return roles if they exist (even if empty array)
    if (roles !== null && roles !== undefined) {
      return Array.isArray(roles) ? roles : []
    }
  }
  
  // Then check permissionsMap (from checked permissions)
  if (props.permissionsMap && props.permissionsMap.size > 0) {
    // Handle server-root specially - it represents the home page "/"
    if (props.nodeId === 'server-root') {
      const roles = props.permissionsMap.get('/')
      if (roles && roles.length > 0) {
        return roles
      }
    } else {
      const path = props.node.type === 'folder' 
        ? props.node.path 
        : props.node.path || props.node.fullPath || ''
      // Normalize path: handle Unicode properly, don't use toLowerCase on Persian chars
      const normalizePath = (p) => {
        return p.replace(/\\/g, '/').replace(/\/+/g, '/').trim()
      }
      const normalizedPath = normalizePath(path)
      // Try exact match first
      let roles = props.permissionsMap.get(normalizedPath)
      // If not found, try case-insensitive match (but preserve Unicode)
      if (!roles) {
        for (const [mapPath, mapRoles] of props.permissionsMap.entries()) {
          if (normalizePath(mapPath) === normalizedPath) {
            roles = mapRoles
            break
          }
        }
      }
      if (roles && roles.length > 0) {
        return roles
      }
    }
  }
  
  return []
})

// Check if all available roles are selected
const hasAllRoles = computed(() => {
  const roles = currentRoles.value
  return roles.length === availableRoles.length && 
         availableRoles.every(role => roles.includes(role))
})

// Get roles that are NOT assigned to this item
const unassignedRoles = computed(() => {
  return availableRoles.filter(role => !currentRoles.value.includes(role))
})

// Handle select all roles for this item
const handleSelectAllRoles = () => {
  // Emit a special event to add all unassigned roles at once
  // This will be handled by the parent to add all roles in one operation
  emit('add-all-roles', props.nodeId, unassignedRoles.value)
}

watch(isEditing, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (nameInput.value) {
        nameInput.value.focus()
        nameInput.value.select()
      }
    })
  }
})

const getIconComponent = () => {
  if (props.node.type === 'server') {
    return ServerIcon
  } else if (props.node.type === 'folder') {
    return FolderIcon
  } else if (props.node.nodeType === 'report' && props.node.type && props.node.type.includes('PBIX')) {
    return PowerBIIcon
  } else {
    return RDLIcon
  }
}

const getDisplayName = () => {
  if (props.node.type === 'server') {
    return props.node.name || 'Server'
  } else if (props.node.type === 'folder') {
    return props.nodeId.split('_')[1].split('/').pop()
  } else if (props.node.nodeType === 'report') {
    return props.node.name.replace(/\.(pbix|rdl)$/i, '')
  }
  return props.node.name || ''
}

const getChildNodeId = (childNode, key) => {
  if (childNode.type === 'folder') {
    return `folder_${childNode.path}`
  } else if (childNode.nodeType === 'report') {
    return `report_${childNode.id}`
  }
  return key
}

const handleCheckChange = (event) => {
  event.stopPropagation()
  emit('check', {
    nodeId: props.nodeId,
    node: props.node,
    isChecked: isChecked.value,
    isMarkedForRemoval: isMarkedForRemoval.value
  })
}

const handleDoubleClick = (event) => {
  // Prevent double-click from opening server picker
  if (props.nodeId === 'server-root' && props.serverList.length > 0) {
    event.stopPropagation()
    return
  }
  if (props.nodeId !== 'server-root') {
    emit('start-editing', props.nodeId)
  }
}

const handleStartEditing = () => {
  emit('start-editing', props.nodeId)
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    event.stopPropagation()
    emit('save-editing', props.nodeId)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    emit('cancel-editing')
  }
}

const handleBlur = () => {
  emit('save-editing', props.nodeId)
}

const getRoleText = (role) => {
  const roleKey = 'role' + role.replace(/\s+/g, '')
  return t(roleKey) || role
}

const handleServerNameClick = () => {
  if (props.nodeId === 'server-root' && props.serverList.length > 0) {
    serverPickerOpen.value = !serverPickerOpen.value
  }
}

const handleServerSelect = (serverUri) => {
  serverPickerOpen.value = false
  emit('switch-server', serverUri)
}

// Close server picker when clicking outside
const handleClickOutside = (event) => {
  if (serverPickerOpen.value && !event.target.closest('.node-name-wrapper')) {
    serverPickerOpen.value = false
  }
}

// Add click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.table-tree-row {
  border-bottom: 1px solid var(--border-color);
  min-height: 48px;
  background: transparent;
}

.table-tree-row td {
  padding: 12px 16px;
  vertical-align: middle;
}

/* No background for checked items - keep transparent */
.table-tree-row:not(.row-marked-removal) {
  background: transparent;
}

.table-tree-row.row-marked-removal {
  background: rgba(244, 67, 54, 0.05);
}

.dark-mode .table-tree-row.row-marked-removal {
  background: rgba(244, 67, 54, 0.1);
}

.object-cell {
  padding: 8px 16px;
  vertical-align: middle;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-icon {
  cursor: pointer;
  user-select: none;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: transparent;
}

.expand-icon:not(.expanded):hover svg circle {
  stroke: #4b5563;
}

.expand-icon:not(.expanded):hover svg path {
  stroke: #4b5563;
}

.dark-mode .expand-icon:not(.expanded) svg circle {
  stroke: #9ca3af;
}

.dark-mode .expand-icon:not(.expanded) svg path {
  stroke: #9ca3af;
}

.dark-mode .expand-icon:not(.expanded):hover svg circle {
  stroke: #d1d5db;
}

.dark-mode .expand-icon:not(.expanded):hover svg path {
  stroke: #d1d5db;
}

.dark-mode .expand-icon.expanded svg circle {
  stroke: #64b5f6;
}

.dark-mode .expand-icon.expanded svg path {
  stroke: #64b5f6;
}

.expand-spacer {
  width: 16px;
  display: inline-block;
}

.custom-checkbox {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-box {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
}

.dark-mode .checkbox-box {
  border-color: #555;
  background: #2c2c2c;
}

/* When checkbox is checked but not marked for removal - green border to match checkmark */
.checkbox-input:checked + .checkbox-box:not(.marked-removal),
.checkbox-box.checked:not(.marked-removal) {
  background: white;
  border-color: #4caf50;
}

.dark-mode .checkbox-input:checked + .checkbox-box:not(.marked-removal),
.dark-mode .checkbox-box.checked:not(.marked-removal) {
  background: #2c2c2c;
  border-color: #66bb6a;
}

/* Marked for removal - same styling whether from unchecking or removing all roles */
.checkbox-box.marked-removal {
  border-color: #f44336;
  background: #ffebee;
}

.dark-mode .checkbox-box.marked-removal {
  border-color: #ef5350;
  background: rgba(244, 67, 54, 0.2);
}

/* Ensure marked-removal styling applies even when checkbox input is checked */
.checkbox-input:checked + .checkbox-box.marked-removal {
  border-color: #f44336;
  background: #ffebee;
}

.dark-mode .checkbox-input:checked + .checkbox-box.marked-removal {
  border-color: #ef5350;
  background: rgba(244, 67, 54, 0.2);
}

.checkbox-checkmark {
  color: #4caf50;
}

.dark-mode .checkbox-checkmark {
  color: #66bb6a;
}

.removal-mark {
  color: #f44336;
  font-size: 1.2rem;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

.dark-mode .removal-mark {
  color: #ef5350;
}

.node-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-name-wrapper {
  flex: 1;
  position: relative;
}

.node-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  cursor: default;
}

.node-name.clickable-server {
  cursor: pointer;
  color: #2196f3;
  text-decoration: underline;
  text-decoration-style: dotted;
  transition: color 0.2s;
}

.node-name.clickable-server:hover {
  color: #1976d2;
}

.dark-mode .node-name.clickable-server {
  color: #64b5f6;
}

.dark-mode .node-name.clickable-server:hover {
  color: #90caf9;
}

.node-name-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #2196f3;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
  color: var(--text-color);
}

.dark-mode .node-name-input {
  background: #2c2c2c;
  border-color: #64b5f6;
}

.rename-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-node-content:hover .rename-btn {
  opacity: 1;
}

.rename-btn:hover {
  color: #2196f3;
}

.dark-mode .rename-btn {
  color: #999;
}

.dark-mode .rename-btn:hover {
  color: #64b5f6;
}

.role-cell {
  padding: 8px 16px;
  vertical-align: middle;
}

.roles-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.dark-mode .role-tag {
  background: #1a2332;
  color: #64b5f6;
}

.role-tag-remove {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: 1.1rem;
  line-height: 1;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
}

.role-tag-remove:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dark-mode .role-tag-remove:hover {
  background: rgba(255, 255, 255, 0.1);
}

.role-add-wrapper {
  position: relative;
}

.role-add-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1px dashed var(--border-color);
  color: #666;
  border-radius: 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.role-add-btn:hover {
  border-color: #2196f3;
  color: #2196f3;
  background: rgba(33, 150, 243, 0.05);
}

.dark-mode .role-add-btn {
  color: #999;
}

.dark-mode .role-add-btn:hover {
  border-color: #64b5f6;
  color: #64b5f6;
  background: rgba(100, 181, 246, 0.1);
}

.role-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  max-height: 200px;
  overflow-y: auto;
}

.dark-mode .role-picker-dropdown {
  background: #2c2c2c;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.role-picker-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-color);
  transition: background 0.2s;
}

.role-picker-item:hover:not(.disabled) {
  background: #f5f5f5;
}

.dark-mode .role-picker-item:hover:not(.disabled) {
  background: #3a3a3a;
}

.role-picker-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  color: #999;
}

.role-picker-item.select-all-item {
  font-weight: 600;
  color: #2196f3;
  background: #f5f8ff;
  border-bottom: 1px solid #e0e0e0;
}

.dark-mode .role-picker-item.select-all-item {
  color: #64b5f6;
  background: #1a2332;
  border-bottom-color: #444;
}

.role-picker-item.select-all-item:hover {
  background: #e3f2fd;
}

.dark-mode .role-picker-item.select-all-item:hover {
  background: #2c3e50;
}

.role-picker-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

.dark-mode .role-picker-divider {
  background: #444;
}

.role-picker-item.empty-message {
  font-style: italic;
  text-align: center;
  padding: 12px;
  color: #999;
}

.server-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  min-width: 400px;
  max-width: 800px;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}

.dark-mode .server-picker-dropdown {
  background: #2c2c2c;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.server-picker-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text-color);
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-picker-item:hover {
  background: #f5f5f5;
}

.dark-mode .server-picker-item:hover {
  background: #3a3a3a;
}

.server-picker-item.active {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.dark-mode .server-picker-item.active {
  background: #1a2332;
  color: #64b5f6;
}

.server-picker-item .check-icon {
  flex-shrink: 0;
  color: #4caf50;
}

.dark-mode .server-picker-item .check-icon {
  color: #66bb6a;
}

.server-picker-item .server-url-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

