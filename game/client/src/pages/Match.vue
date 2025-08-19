<template>
  <div>
    <MapCanvas v-if="state" :map="state.map" :nodes-state="state.nodesState" />
    <div v-if="state">
      <div v-for="p in state.players" :key="p.userId">
        {{ p.nickname }} ({{ p.team }})
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useSocketStore } from '../store/socket';
import MapCanvas from '../components/MapCanvas.vue';
import { MatchState } from '../types';

const route = useRoute();
const socket = useSocketStore();
const state = ref<MatchState | null>(null);

onMounted(async () => {
  if (!socket.socket) socket.connect();
  const id = route.params.id as string;
  const res: any = await socket.emitAck('lobby:join', { matchId: id });
  if (res.ok) state.value = res.state;
});
</script>
