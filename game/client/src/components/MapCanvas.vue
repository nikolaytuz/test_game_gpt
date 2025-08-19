<template>
  <svg :viewBox="'0 0 800 600'" width="800" height="600">
    <g>
      <line v-for="edge in map.edges" :key="edge.from + '-' + edge.to"
        :x1="nodeById(edge.from).x" :y1="nodeById(edge.from).y"
        :x2="nodeById(edge.to).x" :y2="nodeById(edge.to).y"
        stroke="#999" />
      <g v-for="node in map.nodes" :key="node.id">
        <circle :cx="node.x" :cy="node.y" r="20" :fill="color(node)" />
        <text :x="node.x" :y="node.y - 25" font-size="12" text-anchor="middle">{{ node.kind }}</text>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { MapNode, MatchState, NodeState } from '../types';

const props = defineProps<{ map: MatchState['map']; nodesState: NodeState[] }>();

function nodeById(id: number): MapNode {
  return props.map.nodes.find(n => n.id === id)!;
}

function color(node: MapNode) {
  const state = props.nodesState.find(s => s.nodeId === node.id);
  if (state?.owner === 'A') return 'blue';
  if (state?.owner === 'B') return 'red';
  return 'gray';
}
</script>
