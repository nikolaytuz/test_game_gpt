import { createRouter, createWebHistory } from 'vue-router';
import LoginGuest from './pages/LoginGuest.vue';
import Lobby from './pages/Lobby.vue';
import Match from './pages/Match.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: LoginGuest },
    { path: '/lobby', component: Lobby },
    { path: '/match/:id', component: Match }
  ]
});
