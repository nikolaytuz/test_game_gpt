<template>
  <div>
    <MapCanvas v-if="state" :map="state.map" :nodes-state="match.nodes" :convoys="match.convoys" :my-team="match.myTeam!" @send-troops="send" />
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
import { useAuthStore } from '../store/auth';
import { useMatchStore } from '../store/match';
import MapCanvas from '../components/MapCanvas.vue';
import { MatchState, SendTroopsPayload } from '../types';

const route = useRoute();
const socket = useSocketStore();
const auth = useAuthStore();
const match = useMatchStore();
const state = ref<MatchState | null>(null);

onMounted(async () => {
  if (!socket.socket) socket.connect();
  const id = route.params.id as string;
  const res: any = await socket.emitAck('lobby:join', { matchId: id });
  if (res.ok) {
    state.value = res.state;
    const me = res.state.players.find((p: any) => p.userId === auth.user.id);
    match.init(me.team, res.state.nodesState);
    socket.socket.on('match:state', (s: any) => match.updateFromBroadcast(s));
  }
});

function send(payload: { fromNodeId: number; toNodeId: number; percent: 25|50|100 }) {
  if (!state.value) return;
  const full: SendTroopsPayload = { matchId: state.value.matchId, ...payload };
  match.sendTroops(full);
}
</script>
