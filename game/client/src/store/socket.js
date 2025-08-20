import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { useAuthStore } from './auth'

export const useSocketStore = defineStore('socket', {
  state: () => ({ socket: null }),
  actions: {
    init() {
      const auth = useAuthStore()
      this.socket = io('http://localhost:3000', {
        path: '/ws',
        query: { 'auth.token': auth.token }
      })
    },
    emitAck(event, payload) {
      return new Promise((resolve) => {
        this.socket.emit(event, payload, (res) => resolve(res))
      })
    }
  }
})
