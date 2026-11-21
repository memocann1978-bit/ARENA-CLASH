const CARDS=[
 {id:'guard',name:'Muhafız',icon:'🛡️',cost:3,hp:150,speed:35,damage:18,range:35},
 {id:'mage',name:'Alev Büyücüsü',icon:'🔥',cost:4,hp:85,speed:25,damage:34,range:115},
 {id:'shadow',name:'Gölge',icon:'🗡️',cost:2,hp:65,speed:75,damage:25,range:30},
 {id:'siege',name:'Kuşatma',icon:'💣',cost:5,hp:110,speed:18,damage:48,range:150},
 {id:'archer',name:'Okçu',icon:'🏹',cost:3,hp:75,speed:42,damage:24,range:125},
 {id:'knight',name:'Şövalye',icon:'⚔️',cost:4,hp:230,speed:28,damage:30,range:38},
 {id:'golem',name:'Taş Dev',icon:'🪨',cost:6,hp:390,speed:13,damage:42,range:42},
 {id:'healer',name:'Şifacı',icon:'✨',cost:4,hp:95,speed:30,damage:10,range:90}
];
function sanitizePlayerName(value){
 const name=String(value??'Oyuncu')
  .replace(/[<>]/g,'')
  .replace(/[\u0000-\u001f\u007f]/g,'')
  .trim()
  .slice(0,18);
 return name||'Oyuncu';
}
function validatePlacement(team,x,y){
 if((team!=='blue'&&team!=='red')||!Number.isFinite(x)||!Number.isFinite(y))return false;
 if(x<20||x>1080||y<85||y>535)return false;
 return team==='blue'?x<=545:x>=555;
}
module.exports={CARDS,sanitizePlayerName,validatePlacement};
