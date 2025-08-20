<template>
  <div class="login">
    <button @click="login">Войти гостем</button>
  </div>
</template>

<script setup>
import { useAuthStore } from '../store/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

async function login() {
  await auth.loginGuest()
  router.push('/lobby')
}
</script>
