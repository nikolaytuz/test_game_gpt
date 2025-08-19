<template>
  <div>
    <div v-if="match.timer" class="hud">
      <div>Time: {{ countdown }}</div>
      <div v-if="match.control">A: {{ match.control.a }}/{{ match.control.total }} | B: {{ match.control.b }}/{{ match.control.total }}</div>
      <div v-if="match.domination?.leader">DOMINATION: {{ match.domination.leader }}</div>
    </div>
    <MapCanvas v-if="state" :map="state.map" :nodes-state="match.nodes" :convoys="match.convoys" :my-team="match.myTeam!" @send-troops="send" />
    <div v-if="state">
      <div v-for="p in state.players" :key="p.userId">
        {{ p.nickname }} ({{ p.team }})
      </div>
    </div>
    <div v-if="match.isFinished" class="modal">
      <p>Winner: {{ match.winner }}</p>
      <p>Reason: {{ match.reason }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSocketStore } from '../store/socket';
import { useAuthStore } from '../store/auth';
import { useMatchStore } from '../store/match';
import MapCanvas from '../components/MapCanvas.vue';
import { MatchState, SendTroopsPayload, BroadcastState, MatchOverPayload } from '../types';

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
    match.timer = res.state.timer;
    match.control = res.state.control;
    match.domination = res.state.domination;
    if (res.finished) {
      match.handleOver({ matchId: res.state.matchId, winner: res.winner, reason: res.reason, endedAt: Date.now() });
    }
    socket.socket.on('match:state', (s: BroadcastState) => match.updateFromBroadcast(s));
    socket.socket.on('match:over', (p: MatchOverPayload) => match.handleOver(p));
  }
});

function send(payload: { fromNodeId: number; toNodeId: number; percent: 25|50|100 }) {
  if (!state.value) return;
  const full: SendTroopsPayload = { matchId: state.value.matchId, ...payload };
  match.sendTroops(full);
}

const countdown = computed(() => {
  if (!match.timer) return '00:00';
  const ms = Math.max(0, match.timer.endsAt - match.lastNow);
  const sec = Math.floor(ms / 1000);
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
});
</script>
