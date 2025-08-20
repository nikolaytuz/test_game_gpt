<template>
  <svg viewBox="0 0 800 600" style="border:1px solid #ccc" @click="cancel">
    <g v-if="map">
      <line
        v-for="e in map.edges"
        :key="e.from+'-'+e.to"
        :x1="nodeById(e.from).x"
        :y1="nodeById(e.from).y"
        :x2="nodeById(e.to).x"
        :y2="nodeById(e.to).y"
        stroke="#999"
      />
      <g v-for="n in map.nodes" :key="n.id">
        <circle
          :cx="n.x"
          :cy="n.y"
          r="20"
          :fill="color(n.id)"
          stroke="#000"
          :stroke-width="selectedFrom === n.id ? 4 : 1"
          @click.stop="onNode(n.id)"
        />
        <text :x="n.x" :y="n.y - 25" font-size="12" text-anchor="middle">{{ n.kind }}</text>
        <text :x="n.x" :y="n.y + 5" font-size="12" text-anchor="middle">{{ garrison(n.id) }}</text>
      </g>
      <g v-for="c in convoys" :key="c.id">
        <circle :cx="convoyPos(c).x" :cy="convoyPos(c).y" r="8" :fill="c.team==='A' ? 'blue' : 'red'" />
        <text :x="convoyPos(c).x" :y="convoyPos(c).y - 10" font-size="10" text-anchor="middle">{{ c.total }}</text>
      </g>
      <g v-if="pendingTo">
        <g :transform="`translate(${panelPos.x - 30}, ${panelPos.y - 60})`">
          <rect width="60" height="40" fill="#fff" stroke="#000" />
          <text x="5" y="15" font-size="12" @click.stop="send(25)">25%</text>
          <text x="25" y="15" font-size="12" @click.stop="send(50)">50%</text>
          <text x="45" y="15" font-size="12" @click.stop="send(100)">100%</text>
        </g>
      </g>
    </g>
  </svg>
</template>

<script setup>
import { ref, computed } from 'vue'
import { matchStore } from '../store/match'

const props = defineProps({
  map: Object,
  nodesState: Array,
  convoys: Array,
  myTeam: String,
  now: Number
})

const selectedFrom = ref(null)
const pendingTo = ref(null)

function nodeById(id) {
  return props.map.nodes.find(n => n.id === id)
}

function stateById(id) {
  return props.nodesState.find(n => n.nodeId === id)
}

function color(nodeId) {
  const state = stateById(nodeId)
  if (!state || !state.owner) return '#ccc'
  return state.owner === 'A' ? 'blue' : 'red'
}

function garrison(nodeId) {
  const st = stateById(nodeId)
  return st ? Math.floor(st.garrison) : 0
}

function isAdj(a, b) {
  return props.map.edges.some(e => (e.from === a && e.to === b) || (e.from === b && e.to === a))
}

function onNode(id) {
  const st = stateById(id)
  if (!selectedFrom.value) {
    if (st && st.owner === props.myTeam) selectedFrom.value = id
  } else {
    if (id === selectedFrom.value) {
      selectedFrom.value = null
    } else if (isAdj(selectedFrom.value, id)) {
      pendingTo.value = id
    } else {
      selectedFrom.value = null
    }
  }
}

function send(percent) {
  matchStore.sendTroops({ fromNodeId: selectedFrom.value, toNodeId: pendingTo.value, percent })
  pendingTo.value = null
  selectedFrom.value = null
}

function cancel() {
  selectedFrom.value = null
  pendingTo.value = null
}

const panelPos = computed(() => {
  if (!pendingTo.value) return { x: 0, y: 0 }
  const n = nodeById(pendingTo.value)
  return { x: n.x, y: n.y }
})

function convoyPos(c) {
  const from = nodeById(c.from)
  const to = nodeById(c.to)
  const p = Math.min(1, Math.max(0, (props.now - c.departAt) / (c.arriveAt - c.departAt)))
  return { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p }
}

</script>
