const fs=require('node:fs');
const path=require('node:path');

function dataPath(customPath){
 return customPath||path.join(__dirname,'data','profiles.json');
}

function loadProfiles(customPath){
 const file=dataPath(customPath);
 try{
  const parsed=JSON.parse(fs.readFileSync(file,'utf8'));
  const entries=Array.isArray(parsed)?parsed:[];
  return new Map(entries.filter(p=>p&&typeof p.id==='string').map(p=>[p.id,{
   id:p.id,
   name:typeof p.name==='string'?p.name:'Oyuncu',
   wins:Number.isFinite(p.wins)&&p.wins>=0?p.wins:0,
   losses:Number.isFinite(p.losses)&&p.losses>=0?p.losses:0,
   trophies:Number.isFinite(p.trophies)&&p.trophies>=0?p.trophies:0
  }]));
 }catch(error){
  if(error.code!=='ENOENT')console.error('Profile data could not be read:',error.message);
  return new Map();
 }
}

function saveProfiles(profiles,customPath){
 const file=dataPath(customPath);
 const directory=path.dirname(file);
 fs.mkdirSync(directory,{recursive:true});
 const temporary=file+'.'+process.pid+'.tmp';
 const payload=JSON.stringify([...profiles.values()]);
 fs.writeFileSync(temporary,payload,{encoding:'utf8',mode:0o600});
 fs.renameSync(temporary,file);
}

module.exports={loadProfiles,saveProfiles};
