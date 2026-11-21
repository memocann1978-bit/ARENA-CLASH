const test=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const net=require('node:net');
const os=require('node:os');
const path=require('node:path');
const fs=require('node:fs');
const {io}=require('socket.io-client');

async function freePort(){
 const probe=net.createServer();
 await new Promise((resolve,reject)=>probe.once('error',reject).listen(0,'127.0.0.1',resolve));
 const port=probe.address().port;
 await new Promise(resolve=>probe.close(resolve));
 return port;
}
function eventWhere(socket,event,predicate,timeout=5000){
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{socket.off(event,onEvent);reject(new Error('Timed out waiting for '+event))},timeout);
  function onEvent(data){if(!predicate(data))return;clearTimeout(timer);socket.off(event,onEvent);resolve(data)}
  socket.on(event,onEvent);
 });
}
async function waitForHealth(url,child){
 for(let i=0;i<60;i++){
  if(child.exitCode!==null)throw new Error('Server exited before becoming ready');
  try{const response=await fetch(url+'/health');if(response.ok)return}catch{}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 throw new Error('Server did not become ready');
}

test('two clients can match, deploy a card and finish after disconnect',async()=>{
 const port=await freePort();
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'arena-online-'));
 const base='http://127.0.0.1:'+port;
 const child=spawn(process.execPath,[path.join(__dirname,'index.js')],{
  cwd:__dirname,
  env:{...process.env,PORT:String(port),ARENA_DATA_FILE:path.join(directory,'profiles.json')},
  stdio:'ignore'
 });
 let blue,red;
 try{
  await waitForHealth(base,child);
  blue=io(base,{transports:['websocket'],reconnection:false});
  red=io(base,{transports:['websocket'],reconnection:false});
  await Promise.all([new Promise((resolve,reject)=>{blue.once('connect',resolve);blue.once('connect_error',reject)}),new Promise((resolve,reject)=>{red.once('connect',resolve);red.once('connect_error',reject)})]);
  const blueFound=eventWhere(blue,'match:found',()=>true);
  const redFound=eventWhere(red,'match:found',()=>true);
  const nullProfile=eventWhere(blue,'profile:data',data=>data.name==='Oyuncu');
  blue.emit('profile:load',null);
  await nullProfile;
  blue.emit('card:play',null);
  assert.equal((await fetch(base+'/health').then(r=>r.json())).ok,true);
  const blueId='11111111-1111-4111-8111-111111111111';
  const redId='22222222-2222-4222-8222-222222222222';
  blue.emit('match:join',{name:'BlueTest',playerId:blueId});
  red.emit('match:join',{name:'RedTest',playerId:redId});
  const [blueMatch,redMatch]=await Promise.all([blueFound,redFound]);
  assert.equal(blueMatch.team,'blue');
  assert.equal(redMatch.team,'red');
  const state=eventWhere(blue,'match:state',data=>data.units?.length===1);
  blue.emit('card:play',{cardId:'guard',x:300,y:300});
  const firstState=await state;
  assert.equal(firstState.units.length,1);
  assert.equal(firstState.units[0].team,'blue');
  const finished=eventWhere(blue,'match:finished',()=>true);
  red.disconnect();
  const result=await finished;
  assert.equal(result.winner,'blue');
  const leaderboard=await fetch(base+'/leaderboard').then(r=>r.json());
  assert.equal(leaderboard.find(p=>p.id===blueId).wins,1);
  assert.equal(leaderboard.find(p=>p.id===redId).losses,1);
 }finally{
  if(blue)blue.disconnect();
  if(red)red.disconnect();
  child.kill();
  fs.rmSync(directory,{recursive:true,force:true});
 }
});
