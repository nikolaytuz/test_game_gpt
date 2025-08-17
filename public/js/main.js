import {connect,play} from './net.js'
import state from './state.js'
import {render} from './render.js'
connect()
const loop=()=>{render();requestAnimationFrame(loop)}
loop()
const canvas=document.getElementById('c')
window.addEventListener('click',e=>{const r=canvas.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/32);const y=Math.floor((e.clientY-r.top)/32);play('unit_basic',x,y)})
