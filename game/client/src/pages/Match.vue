<template>
  <div v-if="match.state.map">
    <h3>Match {{ match.state.matchId }}</h3>
    <MapCanvas
      :map="match.state.map"
      :nodesState="match.state.nodesState"
      :convoys="match.state.convoys"
      :myTeam="match.state.myTeam"
      :now="match.state.now"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSocketStore } from '../store/socket'
import { useAuthStore } from '../store/auth'
import { matchStore as match } from '../store/match'
import MapCanvas from '../components/MapCanvas.vue'

const route = useRoute()
const socket = useSocketStore()
const auth = useAuthStore()

onMounted(async () => {
  if (!socket.socket) socket.init()
  socket.onMatchState((payload) => match.onBroadcast(payload))
  const res = await socket.emitAck('lobby:join', { matchId: route.query.matchId })
  if (res.ok) match.setInitial(res.state, auth.user.id)
})
</script>
