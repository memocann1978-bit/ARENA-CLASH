const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {loadProfiles,saveProfiles}=require('./profile-store');

test('profiles survive a server process restart',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'arena-profiles-'));
 const file=path.join(directory,'nested','profiles.json');
 try{
  const first=new Map([['player-1',{id:'player-1',name:'ArenaUser',wins:4,losses:2,trophies:85}]]);
  saveProfiles(first,file);
  const loaded=loadProfiles(file);
  assert.deepEqual(loaded.get('player-1'),first.get('player-1'));
  loaded.get('player-1').wins++;
  saveProfiles(loaded,file);
  assert.equal(loadProfiles(file).get('player-1').wins,5);
 }finally{
  fs.rmSync(directory,{recursive:true,force:true});
 }
});

test('missing profile file starts with an empty store',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'arena-empty-'));
 try{
  assert.equal(loadProfiles(path.join(directory,'missing.json')).size,0);
 }finally{
  fs.rmSync(directory,{recursive:true,force:true});
 }
});
