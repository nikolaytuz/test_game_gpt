import { defineStore } from 'pinia';
import {
  BroadcastState,
  NodeState,
  SendTroopsPayload,
  Team,
  TimerInfo,
  ControlInfo,
  DominationInfo,
  MatchOverPayload,
} from '../types';
import { useSocketStore } from './socket';

export const useMatchStore = defineStore('match', {
  state: () => ({
    myTeam: null as Team | null,
    nodes: [] as NodeState[],
    convoys: [] as BroadcastState['convoys'],
    lastNow: 0,
    timer: null as TimerInfo | null,
    control: null as ControlInfo | null,
    domination: null as DominationInfo | null,
    isFinished: false,
    winner: null as Team | null,
    reason: null as string | null,
  }),
  actions: {
    init(team: Team, nodes: NodeState[]) {
      this.myTeam = team;
      this.nodes = nodes;
      this.convoys = [];
      this.lastNow = Date.now();
      this.timer = null;
      this.control = null;
      this.domination = null;
      this.isFinished = false;
      this.winner = null;
      this.reason = null;
    },
    updateFromBroadcast(state: BroadcastState) {
      this.nodes = state.nodesState;
      this.convoys = state.convoys;
      this.lastNow = state.now;
      this.timer = state.timer;
      this.control = state.control;
      this.domination = state.domination;
    },
    async sendTroops(payload: SendTroopsPayload) {
      const socket = useSocketStore();
      return await socket.emitAck('match:sendTroops', payload);
    },
    handleOver(payload: MatchOverPayload) {
      this.isFinished = true;
      this.winner = payload.winner;
      this.reason = payload.reason;
    },
  }
});
