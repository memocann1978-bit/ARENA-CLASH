const $=id=>document.getElementById(id);
const units=[
 {id:'guard',name:'Muhafız',icon:'🛡️',cost:3,hp:150,speed:35,damage:18,range:35},
 {id:'mage',name:'Alev Büyücüsü',icon:'🔥',cost:4,hp:85,speed:25,damage:34,range:115},
 {id:'shadow',name:'Gölge',icon:'🗡️',cost:2,hp:65,speed:75,damage:25,range:30},
 {id:'siege',name:'Kuşatma',icon:'💣',cost:5,hp:110,speed:18,damage:48,range:150},
 {id:'archer',name:'Okçu',icon:'🏹',cost:3,hp:75,speed:42,damage:24,range:125},
 {id:'knight',name:'Şövalye',icon:'⚔️',cost:4,hp:230,speed:28,damage:30,range:38},
 {id:'golem',name:'Taş Dev',icon:'🪨',cost:6,hp:390,speed:13,damage:42,range:42},
 {id:'healer',name:'Şifacı',icon:'✨',cost:4,hp:95,speed:30,damage:10,range:90}
];
let selected=-1,energy=5,seconds=120,active=false,entities=[],last=0,raf=0,enemySpawn=4,enemyEnergy=5;
let blueTower=500,redTower=500,onlineMode=false,onlineTeam='blue',onlineConnected=false,onlineQueued=false;
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2300)}
function page(p){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$(p+'Page').classList.add('active');document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===p));$('pageTitle').textContent=({battle:'SAVAŞ ARENASI',deck:'KART DESTEN',online:'ÇEVRİMİÇİ 1v1',profile:'OYUNCU PROFİLİ',settings:'AYARLAR'})[p]}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>page(b.dataset.page));
$('onlinePageBtn').onclick=()=>page('online');
$('deckGrid').innerHTML=units.map(u=>'<div class="unit-card"><div class="symbol">'+u.icon+'</div><b>'+u.name+'</b><small>◆ '+u.cost+' enerji</small></div>').join('');
function drawArena(){
 const c=$('arena'),ctx=c.getContext('2d'),w=620,h=1100;
 ctx.clearRect(0,0,w,h);
 const grass=ctx.createLinearGradient(0,0,620,1100);grass.addColorStop(0,'#70b957');grass.addColorStop(.5,'#5ca64c');grass.addColorStop(1,'#78bd5b');ctx.fillStyle=grass;ctx.fillRect(0,0,w,h);
 for(let y=0;y<h;y+=44)for(let x=0;x<w;x+=44){ctx.fillStyle=((x/44+y/44)%2?'#ffffff08':'#174b2810');ctx.fillRect(x,y,44,44)}
 ctx.fillStyle='#397c43';ctx.fillRect(0,0,620,14);ctx.fillRect(0,1086,620,14);
 // River and two wooden bridges
 ctx.fillStyle='#348db0';ctx.fillRect(0,510,620,80);
 ctx.fillStyle='#65c5df';ctx.fillRect(0,516,620,5);ctx.fillRect(0,580,620,5);
 for(const bx of [112,438]){
  ctx.fillStyle='#735239';ctx.fillRect(bx,493,70,115);
  ctx.fillStyle='#c69a62';ctx.fillRect(bx+5,493,60,115);
  ctx.strokeStyle='#805a39';ctx.lineWidth=4;for(let yy=500;yy<605;yy+=17){ctx.beginPath();ctx.moveTo(bx+5,yy);ctx.lineTo(bx+65,yy);ctx.stroke()}
  ctx.fillStyle='#e0b87d';ctx.fillRect(bx+1,493,5,115);ctx.fillRect(bx+64,493,5,115);
 }
 // Stone paths and arena markings
 ctx.fillStyle='#ffffff0c';ctx.fillRect(100,70,420,420);ctx.fillRect(100,610,420,420);
 ctx.strokeStyle='#ffffff25';ctx.lineWidth=3;ctx.setLineDash([9,10]);ctx.beginPath();ctx.moveTo(20,550);ctx.lineTo(600,550);ctx.stroke();ctx.setLineDash([]);
 function tower(x,y,color,hp,king=false){
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle='#243c42';ctx.fillRect(-35,12,70,45);
  ctx.fillStyle=color;ctx.fillRect(-31,-27,62,65);
  ctx.fillStyle=king?'#e8c66d':'#d9e0d9';ctx.fillRect(-38,-36,76,15);
  ctx.fillStyle='#34404a';ctx.fillRect(-7,-55,14,22);
  ctx.fillStyle=king?'#e8c66d':'#c4d0d5';ctx.beginPath();ctx.moveTo(-13,-55);ctx.lineTo(0,-73);ctx.lineTo(13,-55);ctx.fill();
  ctx.fillStyle='#182638';ctx.fillRect(-35,-83,70,17);
  ctx.fillStyle='#f3f6f8';ctx.font='bold 12px Segoe UI';ctx.textAlign='center';ctx.fillText(Math.max(0,Math.ceil(hp))+'',0,-70);
  ctx.fillStyle='#ffffff';ctx.font='bold 9px Segoe UI';ctx.fillText(king?'KRAL':'KULE',0,2);
  ctx.restore();
 }
 const flip=onlineMode&&onlineTeam==='red';
 const topColor=flip?'#3778d2':'#d34e61',bottomColor=flip?'#d34e61':'#3778d2';
 // Three towers per side, king towers centered behind princess towers
 tower(310,115,topColor,redTower,true);tower(145,245,topColor,redTower,false);tower(475,245,topColor,redTower,false);
 tower(310,985,bottomColor,blueTower,true);tower(145,855,bottomColor,blueTower,false);tower(475,855,bottomColor,blueTower,false);
 ctx.textAlign='center';ctx.font='900 12px Segoe UI';ctx.fillStyle='#f4f7e8';ctx.fillText('RAKİP ALANI',310,35);ctx.fillText('SENİN ALANIN',310,1065);
 // Decorative river rocks
 for(const [rx,ry] of [[25,500],[590,600],[34,620],[580,485],[90,482],[520,610]]){ctx.fillStyle='#9a9d83';ctx.beginPath();ctx.ellipse(rx,ry,12,8,.3,0,Math.PI*2);ctx.fill()}
 entities.forEach(e=>{
  const px=onlineMode?e.y:(e.x),py=onlineMode?1100-e.x:e.y;
  const own=e.team===(flip?'red':'blue'),fill=own?'#3888ee':'#df5365';
  ctx.beginPath();ctx.fillStyle='#17212a66';ctx.ellipse(px,py+13,17,7,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.fillStyle=fill;ctx.arc(px,py,15,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#152238';ctx.fillRect(px-17,py-26,34,5);ctx.fillStyle='#70e0a2';ctx.fillRect(px-17,py-26,34*Math.max(0,e.hp/e.maxHp),5);
  ctx.fillStyle='#fff';ctx.font='17px Arial';ctx.fillText(e.icon,px,py+6);
 });
 ctx.textAlign='center';ctx.font='bold 11px Segoe UI';ctx.fillStyle='#fff';ctx.fillText('◆',310,550);
}
function renderHand(){
 $('nextCard').textContent=units[(selected+1+units.length)%units.length].icon;
 $('hand').innerHTML=units.map((u,i)=>'<button class="hand-card '+(selected===i?'selected':'')+'" data-i="'+i+'"><span>'+u.icon+'</span><b>'+u.name+'</b><small>◆ '+u.cost+'</small></button>').join('');
 document.querySelectorAll('.hand-card').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.i);renderHand()});
}
function spawn(team,index,x,y){const u=units[index];entities.push({id:'local-'+Date.now()+'-'+Math.random(),x,y,team,hp:u.hp,maxHp:u.hp,speed:u.speed,damage:u.damage,range:u.range,icon:u.icon,cooldown:0})}
function enemyAI(dt){
 enemyEnergy=Math.min(10,enemyEnergy+dt*.38);enemySpawn-=dt;
 if(enemySpawn<=0){const affordable=units.map((u,i)=>({u,i})).filter(v=>v.u.cost<=enemyEnergy);if(affordable.length){const pick=affordable[Math.floor(Math.random()*affordable.length)];enemyEnergy-=pick.u.cost;spawn('red',pick.i,Math.random()<.5?145:475,245+Math.random()*45)}enemySpawn=5.2+Math.random()*3.2}
}
function start(online=false){
 onlineMode=online;active=true;energy=5;enemyEnergy=5;enemySpawn=3.5;seconds=online?180:120;blueTower=500;redTower=500;entities=[];selected=-1;
 $('match').classList.remove('hidden');renderHand();drawArena();last=performance.now();cancelAnimationFrame(raf);if(!online)raf=requestAnimationFrame(loop);
}
function loop(now){
 if(!active||onlineMode)return;let dt=Math.min((now-last)/1000,.05);last=now;energy=Math.min(10,energy+dt*.42);$('energy').textContent=Math.floor(energy);$('elixirFill').style.width=(energy*10)+'%';seconds-=dt;
 $('timer').textContent='0'+Math.floor(Math.max(0,seconds)/60)+':'+String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0');enemyAI(dt);
 entities.forEach(e=>{e.cooldown=Math.max(0,e.cooldown-dt);const enemy=entities.filter(z=>z.team!==e.team).map(z=>({z,d:Math.hypot(z.x-e.x,z.y-e.y)})).filter(v=>v.d<=e.range+13).sort((a,b)=>a.d-b.d)[0]?.z;if(enemy){if(e.cooldown<=0){enemy.hp-=e.damage;e.cooldown=.85}}else{e.y+=(e.team==='blue'?-1:1)*e.speed*dt;if(e.team==='blue'&&e.y<155)redTower-=e.damage*dt*.22;if(e.team==='red'&&e.y>945)blueTower-=e.damage*dt*.22}});
 entities=entities.filter(e=>e.hp>0&&e.y>20&&e.y<1080);drawArena();
 if(seconds<=0||blueTower<=0||redTower<=0){active=false;toast(redTower<=0||(seconds<=0&&blueTower>redTower)?'ZAFER!':'MAÇ SONA ERDİ');return}raf=requestAnimationFrame(loop);
}
$('arena').onclick=e=>{
 if(!active||selected<0)return;const r=e.target.getBoundingClientRect();let x=(e.clientX-r.left)/r.width*620,y=(e.clientY-r.top)/r.height*1100;const u=units[selected];
 if(onlineMode){
  const serverX=1100-y,serverY=x;
  if((onlineTeam==='blue'&&y<555)||(onlineTeam==='red'&&y>545)||x<35||x>585){toast('Birliklerini kendi alanına yerleştir.');return}
  window.arenaAPI.playOnline({cardId:u.id,x:serverX,y:serverY});selected=-1;renderHand();return;
 }
 if(y<555||x<35||x>585){toast('Birliklerini kendi alanına yerleştir.');return}
 if(energy<u.cost){toast('Yeterli iksirin yok.');return}energy-=u.cost;$('energy').textContent=Math.floor(energy);$('elixirFill').style.width=(energy*10)+'%';spawn('blue',selected,x,y);selected=-1;renderHand();
};
$('playBtn').onclick=()=>start(false);
$('exitMatch').onclick=()=>{active=false;onlineMode=false;cancelAnimationFrame(raf);$('match').classList.add('hidden');if(onlineQueued)window.arenaAPI.leaveOnline();onlineQueued=false};
$('connectOnline').onclick=async()=>{const r=await window.arenaAPI.connectOnline($('serverUrl').value.trim());if(r?.error){$('onlineMessage').textContent=r.error;return}$('onlineMessage').textContent='Sunucuya bağlanılıyor…'};
$('findMatch').onclick=async()=>{if(!onlineConnected){toast('Önce sunucuya bağlan.');return}const r=await window.arenaAPI.joinOnline($('playerName').value.trim()||'Oyuncu');if(r?.error){$('onlineMessage').textContent=r.error;return}onlineQueued=true;$('onlineMessage').textContent='Rakip aranıyor…';toast('Rakip aranıyor…')};
window.arenaAPI.on('online:connected',()=>{onlineConnected=true;$('onlineStatus').textContent='BAĞLI';$('onlineStatus').style.color='#68e5ad';$('onlineMessage').textContent='Sunucuya bağlandın. Rakip arayabilirsin.'});
window.arenaAPI.on('online:error',e=>{$('onlineMessage').textContent='Bağlantı hatası: '+e;onlineConnected=false;$('onlineStatus').textContent='HATA'});
window.arenaAPI.on('online:disconnected',()=>{onlineConnected=false;$('onlineStatus').textContent='BAĞLANTI KESİLDİ';if(onlineMode){active=false;toast('Sunucu bağlantısı kesildi.')}}); 
function updateProfile(data){
 if(!data)return;
 $('profileName').textContent=data.name||'Oyuncu';
 $('profileWins').textContent=Number(data.wins)||0;
 $('profileMatches').textContent=(Number(data.wins)||0)+(Number(data.losses)||0);
 $('profileTrophies').textContent=Number(data.trophies)||0;
 $('profileLeague').textContent='Acemi I · '+(Number(data.trophies)||0)+' Kupa';
}
window.arenaAPI.on('online:event',(event,data)=>{
 if(event==='server:error'){toast(data?.message||'Sunucu isteği reddetti.');return}
 if(event==='profile:data')updateProfile(data);
 if(event==='match:queued'){$('onlineMessage').textContent='Rakip aranıyor… sıradasın.'}
 if(event==='match:found'){onlineTeam=data.team;onlineQueued=false;$('onlineMessage').textContent='Rakip bulundu! Maç başlıyor.';start(true);toast('Rakip bulundu!')}
 if(event==='match:state'&&onlineMode){entities=data.units||[];blueTower=data.towers.blue;redTower=data.towers.red;seconds=data.time;energy=data.energy[onlineTeam]||0;$('energy').textContent=energy;$('elixirFill').style.width=(energy*10)+'%';$('timer').textContent='0'+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');drawArena()}
 if(event==='match:finished'){active=false;onlineMode=false;$('match').classList.add('hidden');const won=data.winner===onlineTeam;toast(won?'ÇEVRİMİÇİ ZAFER!':'MAĞLUBİYET · Tekrar dene');$('onlineMessage').textContent=won?'Maçı kazandın!':'Maçı kaybettin.';onlineQueued=false}
 if(event==='match:left'){$('onlineMessage').textContent='Eşleştirmeden ayrıldın.'}
});
$('checkUpdate').onclick=async()=>{toast('Güncellemeler kontrol ediliyor…');const r=await window.arenaAPI.checkUpdate();if(r?.error)toast('Güncelleme kontrol edilemedi.');else if(!r.available)toast('Oyunun güncel.')};
let updateVersion='',updateDownloaded=false;
window.arenaAPI.on('update-available',v=>{updateVersion=v;$('updateText').textContent='Yeni sürüm '+v+' indirilmeye hazır.';$('updateModal').classList.remove('hidden')});
window.arenaAPI.on('update-none',()=>toast('Oyunun güncel.'));
window.arenaAPI.on('update-progress',p=>{$('progressBar').style.width=p+'%';$('updateText').textContent='İndiriliyor: %'+p});
window.arenaAPI.on('update-downloaded',()=>{updateDownloaded=true;$('updateText').textContent='Güncelleme hazır. Oyunu yeniden başlat.';$('updateAction').textContent='YENİDEN BAŞLAT'});
window.arenaAPI.on('update-error',e=>{$('updateText').textContent='Güncelleme hatası: '+e});
$('updateAction').onclick=()=>{if(updateDownloaded)window.arenaAPI.installUpdate();else window.arenaAPI.downloadUpdate()};
$('laterBtn').onclick=()=>$('updateModal').classList.add('hidden');
