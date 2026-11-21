const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const cors=require('cors');
const app=express();app.use(cors());app.use(express.json({limit:'16kb'}));
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:'*',methods:['GET','POST']}});
const PORT=process.env.PORT||3000;
const queue=[];const rooms=new Map();const profiles=new Map();
const CARDS=[
 {id:'guard',name:'Muhafız',icon:'🛡️',cost:3,hp:150,speed:35,damage:18,range:35},
 {id:'mage',name:'Alev Büyücüsü',icon:'🔥',cost:4,hp:85,speed:25,damage:34,range:115},
 {id:'shadow',name:'Gölge',icon:'🗡️',cost:2,hp:65,speed:75,damage:25,range:30},
 {id:'siege',name:'Kuşatma',icon:'💣',cost:5,hp:110,speed:18,damage:48,range:150}
];
function profile(id,name){if(!profiles.has(id))profiles.set(id,{id,name:String(name||'Oyuncu').slice(0,18),wins:0,losses:0,trophies:0});return profiles.get(id)}
function snapshot(room){return {id:room.id,players:room.players.map(p=>({id:p.id,name:p.name,team:p.team})),units:room.units.map(u=>({...u})),towers:{blue:room.towers.blue,red:room.towers.red},energy:{blue:Math.floor(room.energy.blue),red:Math.floor(room.energy.red)},time:Math.max(0,Math.ceil(room.time)),status:room.status}}
function emitState(room){io.to(room.id).emit('match:state',snapshot(room))}
function finish(room,winner){if(room.status!=='playing')return;room.status='finished';room.winner=winner;for(const p of room.players){const data=profile(p.id,p.name);if(p.team===winner){data.wins++;data.trophies+=25}else{data.losses++;data.trophies=Math.max(0,data.trophies-15)}}io.to(room.id).emit('match:finished',{winner,profiles:room.players.map(p=>profile(p.id,p.name))});for(const p of room.players){const s=io.sockets.sockets.get(p.id);if(s){s.data.roomId=null;s.data.queued=false;s.leave(room.id)}}clearInterval(room.timer);rooms.delete(room.id)}
function socketsMatchFound(a,b,room){a.emit('match:found',{roomId:room.id,players:room.players,team:'blue'});b.emit('match:found',{roomId:room.id,players:room.players,team:'red'})}
function makeRoom(a,b){const id='arena-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);const room={id,players:[{id:a.id,name:a.name,team:'blue'},{id:b.id,name:b.name,team:'red'}],units:[],towers:{blue:500,red:500},energy:{blue:5,red:5},time:180,status:'playing',last:Date.now()};rooms.set(id,room);for(const s of [a,b]){s.join(id);s.data.roomId=id}socketsMatchFound(a,b,room);emitState(room);room.timer=setInterval(()=>{if(room.status!=='playing')return;const now=Date.now(),dt=Math.min((now-room.last)/1000,.1);room.last=now;room.time-=dt;for(const t of ['blue','red'])room.energy[t]=Math.min(10,room.energy[t]+dt*.4);for(const u of room.units){u.cooldown=Math.max(0,(u.cooldown||0)-dt);const target=room.units.filter(v=>v.team!==u.team).map(v=>({v,d:Math.hypot(v.x-u.x,v.y-u.y)})).filter(v=>v.d<=u.range+13).sort((x,y)=>x.d-y.d)[0]?.v;if(target){if(u.cooldown<=0){target.hp-=u.damage;u.cooldown=.85}}else{u.x+=(u.team==='blue'?1:-1)*u.speed*dt;if(u.team==='blue'&&u.x>=930)room.towers.red-=u.damage*dt*.2;if(u.team==='red'&&u.x<=170)room.towers.blue-=u.damage*dt*.2}}room.units=room.units.filter(u=>u.hp>0&&u.x>15&&u.x<1085);if(room.towers.blue<=0)finish(room,'red');else if(room.towers.red<=0)finish(room,'blue');else if(room.time<=0)finish(room,room.towers.blue>=room.towers.red?'blue':'red');emitState(room)},100)}
app.get('/health',(_req,res)=>res.json({ok:true,service:'ARENA CLASH',players:io.engine.clientsCount,queued:queue.length,rooms:rooms.size}));
app.get('/leaderboard',(_req,res)=>res.json([...profiles.values()].sort((a,b)=>b.trophies-a.trophies).slice(0,50)));
io.on('connection',socket=>{
 socket.on('profile:load',({name}={})=>{const p=profile(socket.id,name);socket.emit('profile:data',p)});
 socket.on('match:join',({name}={})=>{if(socket.data.roomId||socket.data.queued)return;socket.data.name=String(name||'Oyuncu').slice(0,18);socket.data.queued=true;const old=queue.findIndex(s=>s.connected&&s.id!==socket.id);if(old>=0){const opponent=queue.splice(old,1)[0];opponent.data.queued=false;socket.data.queued=false;makeRoom(opponent,socket)}else{queue.push(socket);socket.emit('match:queued',{position:queue.length})}});
 socket.on('match:leave',()=>{const i=queue.findIndex(s=>s.id===socket.id);if(i>=0)queue.splice(i,1);socket.data.queued=false;const room=rooms.get(socket.data.roomId);if(room){finish(room,room.players.find(p=>p.id!==socket.id)?.team||'blue');socket.leave(room.id);socket.data.roomId=null}socket.emit('match:left')});
 socket.on('card:play',({cardId,x,y}={})=>{const room=rooms.get(socket.data.roomId);if(!room||room.status!=='playing')return;const player=room.players.find(p=>p.id===socket.id);const card=CARDS.find(c=>c.id===cardId);if(!player||!card||!Number.isFinite(x)||!Number.isFinite(y)||room.units.filter(u=>u.team===player.team).length>=40)return;const blue=player.team==='blue';if(room.energy[player.team]<card.cost||x<20||x>1080||y<85||y>535||(blue&&x>545)||(!blue&&x<555))return;room.energy[player.team]-=card.cost;room.units.push({id:socket.id+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,5),team:player.team,x,y,hp:card.hp,maxHp:card.hp,speed:card.speed,damage:card.damage,range:card.range,icon:card.icon,cooldown:0});emitState(room)});
 socket.on('disconnect',()=>{let i=queue.findIndex(s=>s.id===socket.id);while(i>=0){queue.splice(i,1);i=queue.findIndex(s=>s.id===socket.id)}socket.data.queued=false;const room=rooms.get(socket.data.roomId);if(room){const other=room.players.find(p=>p.id!==socket.id);if(other)finish(room,other.team)}});
});
server.listen(PORT,'0.0.0.0',()=>console.log('ARENA CLASH server listening on '+PORT));
