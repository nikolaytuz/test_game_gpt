import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as { id: string; nickname: string } | null
  }),
  actions: {
    setAuth(token: string, user: { id: string; nickname: string }) {
      this.token = token;
      this.user = user;
    }
  }
});
