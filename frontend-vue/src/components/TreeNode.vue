<template>
  <div class="tree-node">
    <div class="node-content" :class="{ 'is-folder': hasChildren }">
      <div class="node-label" :class="{ editing: isEditing }">
        <span 
          v-if="hasChildren" 
          class="expand-icon"
          @click.stop="toggleExpand"
        >
          <!-- Show downward chevron when expanded (click to collapse) -->
          <svg v-if="isExpanded" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5L6 8L9 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- Show upward chevron when collapsed (click to expand) -->
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7L6 4L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span v-else class="expand-spacer"></span>

        <!-- Custom Checkbox -->
        <label class="custom-checkbox" @click.stop>
          <input
            type="checkbox"
            :checked="isChecked"
            @change="handleCheckChange"
            class="checkbox-input"
          />
          <span class="checkbox-box">
            <svg v-if="isChecked" class="checkbox-checkmark" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6L5 9L10 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </label>

        <span class="node-icon">
          <component v-if="getIconComponent()" :is="getIconComponent()" :size="20" />
          <span v-else>💻</span>
        </span>

        <!-- Editable name field -->
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
        <span
          v-else
          class="node-name"
          @dblclick="handleDoubleClick"
        >
          {{ getDisplayName() }}
        </span>

        <!-- Rename button (appears on hover) -->
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
    </div>

    <div v-if="hasChildren && isExpanded" class="node-children">
      <TreeNode
        v-for="(childNode, key) in node.children"
        :key="getChildNodeId(childNode, key)"
        :node="childNode"
        :node-id="getChildNodeId(childNode, key)"
        :expanded="expanded"
        :checked="checked"
        :editing-node-id="editingNodeId"
        :editing-value="editingValue"
        @toggle="$emit('toggle', $event)"
        @check="$emit('check', $event)"
        @toggle-expand="$emit('toggle-expand', $event)"
        @start-editing="$emit('start-editing', $event)"
        @update-editing="$emit('update-editing', $event)"
        @save-editing="$emit('save-editing', $event)"
        @cancel-editing="$emit('cancel-editing')"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, watch, nextTick, ref } from 'vue'
import PowerBIIcon from '../assets/PowerBIIcon.vue'
import RDLIcon from '../assets/RDLIcon.vue'
import FolderIcon from '../assets/FolderIcon.vue'

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
  serverName: {
    type: String,
    default: 'Report Server'
  },
  editingNodeId: {
    type: String,
    default: null
  },
  editingValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['toggle', 'check', 'toggle-expand', 'start-editing', 'update-editing', 'save-editing', 'cancel-editing'])

const nameInput = ref(null)

const hasChildren = computed(() => {
  return props.node.children && Object.keys(props.node.children).length > 0
})

const isExpanded = computed(() => {
  return props.expanded.has(props.nodeId)
})

const isChecked = computed(() => {
  return props.checked.has(props.nodeId)
})

const isEditing = computed(() => {
  return props.editingNodeId === props.nodeId
})

// Watch for editing state and focus input
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
    return null // Will use emoji for server
  } else if (props.node.type === 'folder') {
    return FolderIcon
  } else if (props.node.nodeType === 'report' && props.node.type.includes('PBIX')) {
    return PowerBIIcon
  } else {
    return RDLIcon
  }
}

const getDisplayName = () => {
  if (props.node.type === 'server') {
    return props.serverName
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

const toggleExpand = () => {
  emit('toggle-expand', props.nodeId)
}

const handleCheckChange = (event) => {
  event.stopPropagation()
  emit('check', {
    nodeId: props.nodeId,
    node: props.node,
    isChecked: isChecked.value
  })
}

const handleDoubleClick = () => {
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
  // Save on blur
  emit('save-editing', props.nodeId)
}
</script>

<style scoped>
.tree-node {
  margin-left: 0;
}

.node-content {
  padding: 4px 0;
}

.node-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.node-label:hover {
  background: rgba(25, 118, 210, 0.1);
}

.dark-mode .node-label:hover {
  background: rgba(100, 181, 246, 0.1);
}

.node-label.editing {
  background: rgba(25, 118, 210, 0.15);
}

.expand-icon {
  cursor: pointer;
  user-select: none;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.expand-icon:hover {
  opacity: 1;
}

.expand-icon svg {
  display: block;
}

.expand-spacer {
  width: 16px;
  display: inline-block;
}

/* Custom Checkbox Styles */
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
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid #d1d5db;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  background: white;
}

.dark-mode .checkbox-box {
  background: #2c2c2c;
  border-color: #555;
}

.checkbox-input:checked + .checkbox-box {
  background: var(--text-color);
  border-color: var(--text-color);
}

.checkbox-checkmark {
  color: white;
  animation: checkmarkPop 0.2s ease;
}

.dark-mode .checkbox-checkmark {
  color: #1e1e1e;
}

.checkbox-input:hover + .checkbox-box {
  border-color: #9ca3af;
}

.dark-mode .checkbox-input:hover + .checkbox-box {
  border-color: #888;
}

@keyframes checkmarkPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.node-name {
  flex: 1;
  font-size: 0.9rem;
  user-select: none;
}

.node-name-input {
  flex: 1;
  font-size: 0.9rem;
  padding: 2px 6px;
  border: 1px solid var(--primary-color);
  border-radius: 3px;
  background: white;
  color: var(--text-color);
}

.dark-mode .node-name-input {
  background: #1e1e1e;
}

.node-name-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.rename-btn {
  opacity: 0;
  padding: 4px 6px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.node-label:hover .rename-btn {
  opacity: 1;
}

.rename-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #111827;
}

.dark-mode .rename-btn {
  color: #9ca3af;
}

.dark-mode .rename-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f9fafb;
}

.rename-btn svg {
  display: block;
}

.node-children {
  margin-left: 24px;
  border-left: 1px dotted #ddd;
  padding-left: 8px;
}

.dark-mode .node-children {
  border-left-color: #555;
}
</style>
