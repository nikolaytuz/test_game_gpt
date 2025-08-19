<template>
  <div class="login">
    <button @click="login">Войти гостем</button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../store/auth';
import { http } from '../api/http';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

async function login() {
  const { data } = await http.post('/auth/guest');
  auth.setAuth(data.token, data.user);
  router.push('/lobby');
}
</script>
