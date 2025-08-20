<template>
  <div v-if="state">
    <h3>Match {{ state.matchId }}</h3>
    <MapCanvas :map="state.map" :nodesState="state.nodesState" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSocketStore } from '../store/socket'
import MapCanvas from '../components/MapCanvas.vue'

const route = useRoute()
const socket = useSocketStore()
const state = ref(null)

onMounted(async () => {
  if (!socket.socket) socket.init()
  const res = await socket.emitAck('lobby:join', { matchId: route.query.matchId })
  if (res.ok) state.value = res.state
})
</script>
