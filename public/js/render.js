import state from './state.js'
const cols=10,rows=16,cell=32
const c=document.getElementById('c')
const ctx=c.getContext('2d')
c.width=cols*cell
c.height=rows*cell
export const render=()=>{
ctx.fillStyle='#000'
ctx.fillRect(0,0,c.width,c.height)
ctx.fillStyle='#855'
const y=(rows/2+state.log)*cell-cell/2
ctx.fillRect(0,y,c.width,cell)
for(const u of state.units){
ctx.fillStyle=u.side==='top'?'#09f':'#f90'
ctx.fillRect(u.x*cell-8,u.y*cell-8,16,16)
}
}
