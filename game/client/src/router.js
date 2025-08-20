import { createRouter, createWebHistory } from 'vue-router'
import LoginGuest from './pages/LoginGuest.vue'
import Lobby from './pages/Lobby.vue'
import Match from './pages/Match.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginGuest },
  { path: '/lobby', component: Lobby },
  { path: '/match', component: Match }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
