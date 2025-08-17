const cfg=require('./config/balance.json')
module.exports=room=>{
room.log=0
room.mana={top:cfg.mana.max,bottom:cfg.mana.max}
room.units=[]
room.timer=cfg.match.durationSec*1000
room.last=Date.now()
room.phase='playing'
room.interval=setInterval(()=>{
const now=Date.now()
const dt=now-room.last
room.last=now
room.timer-=dt
for(const s of ['top','bottom'])room.mana[s]=Math.min(cfg.mana.max,room.mana[s]+cfg.mana.regenPerSec*dt/1000)
const line=cfg.grid.rows/2
room.units=room.units.filter(u=>{
u.y+=(u.side==='top'?1:-1)*u.speed*dt/1000
if(u.side==='top'&&u.y>=line){room.log+=u.push;return false}
if(u.side==='bottom'&&u.y<=line-1){room.log-=u.push;return false}
return true})
const topWin=room.log>=cfg.grid.rows/2
const bottomWin=room.log<=-cfg.grid.rows/2
if(room.timer<=0||topWin||bottomWin){
clearInterval(room.interval)
room.phase='ended'
const winner=topWin?'top':bottomWin?'bottom':room.log>0?'top':room.log<0?'bottom':'draw'
room.players.forEach(p=>p.emit('end',{winner}))
return}
const snap={serverTime:now,timer:room.timer,mana:{top:room.mana.top,bottom:room.mana.bottom},log:room.log,units:room.units.map(u=>({x:u.x,y:u.y,side:u.side}))}
room.players.forEach(p=>p.emit('snapshot',snap))
},cfg.match.tickMs)
}
