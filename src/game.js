const $=id=>document.getElementById(id);
const units=[
{name:'Muhafız',icon:'🛡️',cost:3,hp:150,speed:35,damage:18,range:35,color:'#68a8ff'},
{name:'Alev Büyücüsü',icon:'🔥',cost:4,hp:85,speed:25,damage:34,range:115,color:'#ff875e'},
{name:'Gölge',icon:'🗡️',cost:2,hp:65,speed:75,damage:25,range:30,color:'#bd91ff'},
{name:'Kuşatma',icon:'💣',cost:5,hp:110,speed:18,damage:48,range:150,color:'#e7c36b'}
];
let selected=-1,energy=5,seconds=120,active=false,entities=[],last=0,raf=0,enemySpawn=4,enemyEnergy=5;
let blueTower=500,redTower=500;
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200)}
function page(p){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));$(p+'Page').classList.add('active');document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===p));$('pageTitle').textContent=({battle:'SAVAŞ ARENASI',deck:'KART DESTEN',profile:'OYUNCU PROFİLİ',settings:'AYARLAR'})[p]}
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>page(b.dataset.page));
$('deckGrid').innerHTML=units.map(u=>'<div class="unit-card"><div class="symbol">'+u.icon+'</div><b>'+u.name+'</b><small>◆ '+u.cost+' enerji</small></div>').join('');
function drawArena(){
 const c=$('arena'),x=c.getContext('2d'),w=c.width,h=c.height;x.clearRect(0,0,w,h);
 x.fillStyle='#244b43';x.fillRect(0,0,w,h);
 for(let i=0;i<22;i++)for(let j=0;j<12;j++){x.fillStyle=(i+j)%2?'#ffffff06':'#00000008';x.fillRect(i*50,j*52,50,52)}
 x.fillStyle='#315c78';x.fillRect(0,270,w,80);
 x.fillStyle='#bd9a69';x.fillRect(260,260,95,100);x.fillRect(745,260,95,100);
 x.fillStyle='#8b795f';x.fillRect(0,0,w,8);x.fillRect(0,h-8,w,8);
 function tower(px,py,blue,hp){x.fillStyle=blue?'#347de0':'#d34e61';x.fillRect(px-35,py-43,70,86);x.fillStyle='#e5e9ef';x.fillRect(px-22,py-57,44,20);x.fillStyle='#111827';x.fillRect(px-34,py-52,68,5);x.fillStyle='#e7eefb';x.font='bold 12px Segoe UI';x.textAlign='center';x.fillText(Math.max(0,Math.ceil(hp))+' HP',px,py+6)}
 tower(115,155,true,blueTower);tower(115,465,true,blueTower);tower(985,155,false,redTower);tower(985,465,false,redTower);
 x.textAlign='center';x.font='bold 13px Segoe UI';x.fillStyle='#d6e4ef';x.fillText('ARENA CLASH',550,35);
 entities.forEach(e=>{x.beginPath();x.fillStyle=e.team==='blue'?'#62a6ff':'#ff7184';x.arc(e.x,e.y,13,0,Math.PI*2);x.fill();x.strokeStyle='#fff';x.stroke();x.fillStyle='#152238';x.fillRect(e.x-15,e.y-23,30,4);x.fillStyle='#70e0a2';x.fillRect(e.x-15,e.y-23,30*Math.max(0,e.hp/e.maxHp),4);x.fillStyle='#fff';x.font='16px Arial';x.fillText(e.icon,e.x,e.y+5)});
 x.fillStyle='#dce7f8';x.font='bold 11px Segoe UI';x.fillText('SEN',75,75);x.fillText('RAKİP',1020,75);
}
function renderHand(){
 $('hand').innerHTML=units.map((u,i)=>'<button class="hand-card '+(selected===i?'selected':'')+'" data-i="'+i+'"><span>'+u.icon+'</span><b>'+u.name+'</b><small>◆ '+u.cost+'</small></button>').join('');
 document.querySelectorAll('.hand-card').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.i);renderHand()});
}
function spawn(team,index,x,y){
 const u=units[index];entities.push({x,y,team,hp:u.hp,maxHp:u.hp,speed:u.speed,damage:u.damage,range:u.range,icon:u.icon,attackCooldown:0});
}
function enemyAI(dt){
 enemyEnergy=Math.min(10,enemyEnergy+dt*.38);enemySpawn-=dt;
 if(enemySpawn<=0){
  const affordable=units.map((u,i)=>({u,i})).filter(v=>v.u.cost<=enemyEnergy);
  if(affordable.length){const pick=affordable[Math.floor(Math.random()*affordable.length)];enemyEnergy-=pick.u.cost;spawn('red',pick.i,850+Math.random()*45,Math.random()<.5?155:465);}
  enemySpawn=5.2+Math.random()*3.2;
 }
}
function start(){
 active=true;energy=5;enemyEnergy=5;enemySpawn=3.5;seconds=120;blueTower=500;redTower=500;entities=[];selected=-1;
 $('match').classList.remove('hidden');renderHand();drawArena();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
}
function loop(now){
 if(!active)return;let dt=Math.min((now-last)/1000,.05);last=now;
 energy=Math.min(10,energy+dt*.42);$('energy').textContent=Math.floor(energy);seconds-=dt;
 $('timer').textContent='0'+Math.floor(Math.max(0,seconds)/60)+':'+String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0');
 enemyAI(dt);
 entities.forEach(e=>{
  e.attackCooldown=Math.max(0,e.attackCooldown-dt);
  const targets=entities.filter(z=>z.team!==e.team);
  let enemy=null,best=Infinity;
  for(const z of targets){const d=Math.hypot(z.x-e.x,z.y-e.y);if(d<=e.range+13&&d<best){best=d;enemy=z}}
  if(enemy){if(e.attackCooldown<=0){enemy.hp-=e.damage;e.attackCooldown=.85}}
  else{
   e.x+=(e.team==='blue'?1:-1)*e.speed*dt;
   if(e.team==='blue'&&e.x>925){if(e.y<310)redTower-=e.damage*dt*.22;else redTower-=e.damage*dt*.22}
   if(e.team==='red'&&e.x<175){blueTower-=e.damage*dt*.22}
  }
 });
 entities=entities.filter(e=>e.hp>0&&e.x>20&&e.x<1080);
 drawArena();
 if(seconds<=0||blueTower<=0||redTower<=0){
  active=false;const won=redTower<=0||(seconds<=0&&blueTower>redTower);
  toast(won?'ZAFER! Rakip kuleleri yıktın.':'MAÇ SONA ERDİ · Tekrar dene!');
  return;
 }
 raf=requestAnimationFrame(loop);
}
$('arena').onclick=e=>{
 if(!active||selected<0)return;
 const r=e.target.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*1100,y=(e.clientY-r.top)/r.height*620,u=units[selected];
 if(x>550||y<85||y>535){toast('Birliklerini kendi alanına yerleştir.');return}
 if(energy<u.cost){toast('Yeterli enerjin yok.');return}
 energy-=u.cost;spawn('blue',selected,x,y);selected=-1;renderHand();
};
$('playBtn').onclick=start;
$('exitMatch').onclick=()=>{active=false;cancelAnimationFrame(raf);$('match').classList.add('hidden')};
$('checkUpdate').onclick=async()=>{toast('Güncellemeler kontrol ediliyor…');const r=await window.arenaAPI.checkUpdate();if(r?.error)toast('Güncelleme kontrol edilemedi.');else if(!r.available)toast('Oyunun güncel.');};
let updateVersion='',updateDownloaded=false;
window.arenaAPI.on('update-available',v=>{updateVersion=v;$('updateText').textContent='Yeni sürüm '+v+' indirilmeye hazır.';$('updateModal').classList.remove('hidden')});
window.arenaAPI.on('update-none',()=>toast('Oyunun güncel.'));
window.arenaAPI.on('update-progress',p=>{$('progressBar').style.width=p+'%';$('updateText').textContent='İndiriliyor: %'+p});
window.arenaAPI.on('update-downloaded',()=>{updateDownloaded=true;$('updateText').textContent='Güncelleme hazır. Oyunu yeniden başlat.';$('updateAction').textContent='YENİDEN BAŞLAT'});
window.arenaAPI.on('update-error',e=>{$('updateText').textContent='Güncelleme hatası: '+e});
$('updateAction').onclick=()=>{if(updateDownloaded)window.arenaAPI.installUpdate();else window.arenaAPI.downloadUpdate();};
$('laterBtn').onclick=()=>$('updateModal').classList.add('hidden');
