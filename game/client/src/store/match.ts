import { defineStore } from 'pinia';
import { BroadcastState, NodeState, SendTroopsPayload, Team } from '../types';
import { useSocketStore } from './socket';

export const useMatchStore = defineStore('match', {
  state: () => ({
    myTeam: null as Team | null,
    nodes: [] as NodeState[],
    convoys: [] as BroadcastState['convoys'],
    lastNow: 0,
  }),
  actions: {
    init(team: Team, nodes: NodeState[]) {
      this.myTeam = team;
      this.nodes = nodes;
      this.convoys = [];
      this.lastNow = Date.now();
    },
    updateFromBroadcast(state: BroadcastState) {
      this.nodes = state.nodesState;
      this.convoys = state.convoys;
      this.lastNow = state.now;
    },
    async sendTroops(payload: SendTroopsPayload) {
      const socket = useSocketStore();
      return await socket.emitAck('match:sendTroops', payload);
    }
  }
});
