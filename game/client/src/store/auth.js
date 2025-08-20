import { defineStore } from 'pinia'
import http from '../api/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: '', user: null }),
  actions: {
    async loginGuest() {
      const res = await http.post('/auth/guest')
      this.token = res.data.token
      this.user = res.data.user
    }
  }
})
