<template>
  <div>
    <div>
      <input v-model="matchId" placeholder="match id" />
      <button @click="create">Создать матч</button>
      <button @click="join">Войти</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSocketStore } from '../store/socket'

const router = useRouter()
const socket = useSocketStore()
const matchId = ref('')

if (!socket.socket) socket.init()

async function create() {
  const res = await socket.emitAck('lobby:create', { mapBlueprintId: 1 })
  matchId.value = res.matchId
  router.push({ path: '/match', query: { matchId: res.matchId } })
}

async function join() {
  router.push({ path: '/match', query: { matchId: matchId.value } })
}
</script>
