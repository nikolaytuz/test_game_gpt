import state from './state.js'
export let socket
export const connect=()=>{
socket=io()
socket.emit('auth',{})
socket.on('auth',()=>socket.emit('queueQuick'))
socket.on('snapshot',s=>{state.timer=s.timer;state.mana=s.mana;state.log=s.log;state.units=s.units})
}
export const play=(id,x,y)=>socket.emit('playCard',{cardId:id,gx:x,gy:y})
