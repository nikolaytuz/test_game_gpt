import { io, Socket } from 'socket.io-client';
import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

export const useSocketStore = defineStore('socket', {
  state: () => ({ socket: null as Socket | null }),
  actions: {
    connect() {
      const auth = useAuthStore();
      this.socket = io('http://localhost:3000', { path: '/ws', query: { 'auth.token': auth.token } });
    },
    async emitAck(event: string, payload: any) {
      if (!this.socket) throw new Error('No socket');
      return await new Promise((resolve) => {
        this.socket.emit(event, payload, resolve);
      });
    }
  }
});
