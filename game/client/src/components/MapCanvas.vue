<template>
  <svg :viewBox="'0 0 800 600'" width="800" height="600">
    <g>
      <line v-for="edge in map.edges" :key="edge.from + '-' + edge.to"
        :x1="nodeById(edge.from).x" :y1="nodeById(edge.from).y"
        :x2="nodeById(edge.to).x" :y2="nodeById(edge.to).y"
        stroke="#999" />
      <g v-for="node in map.nodes" :key="node.id">
        <circle :cx="node.x" :cy="node.y" r="20" :fill="color(node)"
          :stroke="selectedFrom===node.id ? 'yellow' : 'black'" :stroke-width="selectedFrom===node.id ? 3 : 1"
          @click="handleNodeClick(node.id)" />
        <text :x="node.x" :y="node.y - 25" font-size="12" text-anchor="middle">{{ node.kind }}</text>
        <text :x="node.x" :y="node.y + 4" font-size="12" text-anchor="middle" fill="white">{{ garrison(node.id) }}</text>
      </g>
      <g v-for="c in convoys" :key="c.id">
        <circle :cx="convoyPos(c).x" :cy="convoyPos(c).y" r="5" :fill="c.team==='A' ? 'blue' : 'red'" />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { MapNode, MatchState, NodeState, Team } from '../types';
import { ref } from 'vue';

const props = defineProps<{ map: MatchState['map']; nodesState: NodeState[]; convoys: any[]; myTeam: Team }>();
const emit = defineEmits<{ (e: 'sendTroops', payload: { fromNodeId: number; toNodeId: number; percent: 25|50|100 }): void }>();
const selectedFrom = ref<number | null>(null);

function nodeById(id: number): MapNode {
  return props.map.nodes.find(n => n.id === id)!;
}

function color(node: MapNode) {
  const state = props.nodesState.find(s => s.nodeId === node.id);
  if (state?.owner === 'A') return 'blue';
  if (state?.owner === 'B') return 'red';
  return 'gray';
}

function garrison(nodeId: number) {
  const state = props.nodesState.find(s => s.nodeId === nodeId);
  return state ? state.garrison : 0;
}

function handleNodeClick(id: number) {
  const state = props.nodesState.find(s => s.nodeId === id);
  if (selectedFrom.value === null) {
    if (state?.owner === props.myTeam) selectedFrom.value = id;
  } else {
    if (selectedFrom.value === id) {
      selectedFrom.value = null;
    } else {
      const percent = Number(prompt('Send percent (25,50,100)', '50')) as 25|50|100;
      if (percent === 25 || percent === 50 || percent === 100) {
        emit('sendTroops', { fromNodeId: selectedFrom.value, toNodeId: id, percent });
      }
      selectedFrom.value = null;
    }
  }
}

function convoyPos(c: { from: number; to: number; departAt: number; arriveAt: number }) {
  const from = nodeById(c.from);
  const to = nodeById(c.to);
  const progress = Math.min(Math.max((Date.now() - c.departAt) / (c.arriveAt - c.departAt), 0), 1);
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress };
}
</script>
