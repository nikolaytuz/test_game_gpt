const express=require('express')
const http=require('http')
const {Server}=require('socket.io')
const path=require('path')
const dotenv=require('dotenv')
require('./db')
const crypto=require('crypto')
const users=require('./repositories/usersRepo')
const profiles=require('./repositories/profilesRepo')
const mm=require('./matchmaking')
const cfg=require('./config/balance.json')
const loop=require('./gameLoop')
dotenv.config()
const app=express()
const server=http.createServer(app)
const io=new Server(server)
app.use(express.static(path.join(__dirname,'..','public')))
io.on('connection',socket=>{
 socket.on('auth',data=>{
const t=data&&data.token?data.token:crypto.randomBytes(8).toString('hex')
let u=users.findByToken(t)
if(!u){u=users.create(t);profiles.create(u.id)}
socket.data.user=u
socket.emit('auth',{token:t,playerId:u.id})
})
 const start=room=>{
 room.phase='countdown'
 room.count=3
 const send=()=>room.players.forEach(p=>p.emit('roomState',{phase:'countdown',countdownLeft:room.count,roomId:room.id,you:{side:p.data.side,playerId:p.data.user.id}}))
 send()
 const iv=setInterval(()=>{
 room.count--
 if(room.count>0)send()
 else{clearInterval(iv);loop(room)}
 },1000)
 }
 socket.on('queueQuick',()=>{
 if(!socket.data.user)return
 if(mm.queue.includes(socket))return
 mm.queue.push(socket)
 socket.emit('queueStatus',{position:mm.queue.indexOf(socket)+1})
 if(mm.queue.length>=2){
 const [a,b]=mm.queue.splice(0,2)
 const id=crypto.randomBytes(3).toString('hex')
 const room={id,players:[a,b],phase:'waiting'}
 mm.rooms.set(id,room)
 a.data.roomId=id
 b.data.roomId=id
 a.data.side='top'
 b.data.side='bottom'
 a.emit('roomState',{phase:'waiting',roomId:id,you:{side:'top',playerId:a.data.user.id}})
 b.emit('roomState',{phase:'waiting',roomId:id,you:{side:'bottom',playerId:b.data.user.id}})
 start(room)
 }
 })
socket.on('createPrivate',()=>{
if(!socket.data.user)return
const code=crypto.randomBytes(3).toString('hex')
mm.rooms.set(code,{id:code,players:[socket],phase:'waiting'})
socket.data.roomId=code
socket.data.side='top'
socket.emit('roomState',{phase:'waiting',roomId:code,you:{side:'top',playerId:socket.data.user.id}})
})
 socket.on('joinPrivate',data=>{
 const code=data&&data.code
 const room=mm.rooms.get(code)
 if(room&&room.players.length==1){
 room.players.push(socket)
 socket.data.roomId=code
 socket.data.side='bottom'
 const a=room.players[0]
 a.data.side='top'
 a.emit('roomState',{phase:'waiting',roomId:code,you:{side:'top',playerId:a.data.user.id}})
 socket.emit('roomState',{phase:'waiting',roomId:code,you:{side:'bottom',playerId:socket.data.user.id}})
 start(room)
 }else socket.emit('error',{code:'room_not_found',message:'room not found'})
 })
 socket.on('playCard',d=>{
 const room=mm.rooms.get(socket.data.roomId)
 if(!room||room.phase!=='playing')return
 const side=socket.data.side
 const card=cfg.cards[d.cardId]
 if(!card||card.type!=='unit')return
 const mana=room.mana[side]
 if(mana<card.cost){socket.emit('error',{code:'nomana'});return}
 const gx=d.gx|0,gy=d.gy|0
 if(gx<0||gx>=cfg.grid.cols||gy<0||gy>=cfg.grid.rows){socket.emit('error',{code:'pos'});return}
 const mid=cfg.grid.rows/2
 if(side==='top'&&gy>=mid){socket.emit('error',{code:'half'});return}
 if(side==='bottom'&&gy<mid){socket.emit('error',{code:'half'});return}
 if(gy===mid){socket.emit('error',{code:'log'});return}
 if(room.units.some(u=>Math.floor(u.x)===gx&&Math.floor(u.y)===gy)){socket.emit('error',{code:'occ'});return}
 room.mana[side]-=card.cost
 room.units.push({x:gx+0.5,y:gy+0.5,side,speed:card.speedCellsPerSec,push:card.push})
 })
 const leave=()=>{
 const q=mm.queue.indexOf(socket)
 if(q>=0)mm.queue.splice(q,1)
 const id=socket.data.roomId
 if(id){
 const room=mm.rooms.get(id)
 if(room){
 room.players=room.players.filter(p=>p!==socket)
if(room.interval)clearInterval(room.interval)
if(room.players.length==0)mm.rooms.delete(id)
else room.phase='ended'
 }
 socket.data.roomId=null
 }
 }
socket.on('leaveRoom',leave)
socket.on('disconnect',leave)
})
const port=process.env.PORT||3000
server.listen(port)
