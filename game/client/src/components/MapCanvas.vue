<template>
  <svg :viewBox="'0 0 800 600'" style="border:1px solid #ccc">
    <g v-if="map">
      <line v-for="e in map.edges" :key="e.from+'-'+e.to" :x1="nodeById(e.from).x" :y1="nodeById(e.from).y" :x2="nodeById(e.to).x" :y2="nodeById(e.to).y" stroke="#999" />
      <g v-for="n in map.nodes" :key="n.id">
        <circle :cx="n.x" :cy="n.y" r="20" :fill="color(n.id)" stroke="#000" />
        <text :x="n.x" :y="n.y - 25" font-size="12" text-anchor="middle">{{ n.kind }}</text>
      </g>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ map: Object, nodesState: Array })

function nodeById(id) {
  return props.map.nodes.find(n => n.id === id)
}

function color(nodeId) {
  const state = props.nodesState.find(n => n.nodeId === nodeId)
  if (!state || !state.owner) return '#ccc'
  return state.owner === 'A' ? 'blue' : 'red'
}
</script>
