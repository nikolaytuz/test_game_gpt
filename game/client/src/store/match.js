import { reactive } from 'vue'
import { useSocketStore } from './socket'

export const matchStore = {
  state: reactive({
    myTeam: null,
    map: null,
    nodesState: [],
    convoys: [],
    now: Date.now(),
    matchId: null
  }),
  setInitial(state, userId) {
    this.state.matchId = state.matchId
    this.state.map = state.map
    this.state.nodesState = state.nodesState
    this.state.convoys = state.convoys || []
    const me = state.players.find(p => p.userId === userId)
    this.state.myTeam = me ? me.team : null
    this.state.now = Date.now()
  },
  onBroadcast(payload) {
    this.state.nodesState = payload.nodesState
    this.state.convoys = payload.convoys
    this.state.now = payload.now
  },
  async sendTroops({ fromNodeId, toNodeId, percent }) {
    const socket = useSocketStore()
    return await socket.emitAck('match:sendTroops', {
      matchId: this.state.matchId,
      fromNodeId,
      toNodeId,
      percent
    })
  }
}
