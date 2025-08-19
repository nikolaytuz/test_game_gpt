<template>
  <div>
    <div>
      <input v-model="matchId" placeholder="match id" />
      <button @click="create">Создать матч</button>
      <button @click="join">Войти</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSocketStore } from '../store/socket';
import { useRouter } from 'vue-router';

const matchId = ref('');
const socket = useSocketStore();
const router = useRouter();

socket.connect();

async function create() {
  const res: any = await socket.emitAck('lobby:create', { mapBlueprintId: 1 });
  if (res.ok) {
    router.push(`/match/${res.matchId}`);
  }
}

async function join() {
  if (!matchId.value) return;
  const res: any = await socket.emitAck('lobby:join', { matchId: matchId.value });
  if (res.ok) {
    router.push(`/match/${matchId.value}`);
  }
}
</script>
