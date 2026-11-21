const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const { io } = require('socket.io-client');
let win, socket, serverUrl='https://YOUR-ARENA-CLASH-SERVER.onrender.com';
function send(channel,...args){if(win&&!win.isDestroyed())win.webContents.send(channel,...args)}
function createWindow(){win=new BrowserWindow({width:1440,height:900,minWidth:1100,minHeight:700,backgroundColor:'#080d19',autoHideMenuBar:true,show:false,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false}});win.loadFile(path.join(__dirname,'index.html'));win.once('ready-to-show',()=>win.show())}
function connectOnline(url){
 if(typeof url!=='string'||!/^https?:\/\//i.test(url))return {error:'Sunucu adresi https:// ile başlamalı.'};
 serverUrl=url.replace(/\/$/,'');if(socket){socket.removeAllListeners();socket.disconnect();socket=null}
 socket=io(serverUrl,{transports:['websocket','polling'],timeout:12000,reconnection:true,reconnectionAttempts:5});
 socket.on('connect',()=>send('online:connected'));
 socket.on('connect_error',e=>send('online:error',e.message));
 socket.on('disconnect',reason=>send('online:disconnected',reason));
 for(const event of ['profile:data','match:queued','match:found','match:state','match:finished','match:left'])socket.on(event,data=>send('online:event',event,data));
 return {connecting:true};
}
app.whenReady().then(()=>{
 try{const saved=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'online.json'),'utf8'));if(saved.serverUrl)serverUrl=saved.serverUrl}catch{}
 createWindow();
 autoUpdater.autoDownload=false;
 autoUpdater.on('update-available',info=>send('update-available',info.version));
 autoUpdater.on('update-not-available',()=>send('update-none'));
 autoUpdater.on('download-progress',p=>send('update-progress',Math.round(p.percent)));
 autoUpdater.on('update-downloaded',()=>send('update-downloaded'));
 autoUpdater.on('error',e=>send('update-error',e.message));
 ipcMain.handle('check-update',async()=>{try{const r=await autoUpdater.checkForUpdates();return {available:!!r?.isUpdateAvailable,version:r?.updateInfo?.version}}catch(e){return {error:e.message}}});
 ipcMain.handle('download-update',()=>autoUpdater.downloadUpdate());
 ipcMain.handle('install-update',()=>autoUpdater.quitAndInstall());
 ipcMain.handle('online:connect',(_e,url)=>{const result=connectOnline(url||serverUrl);if(!result.error){try{fs.writeFileSync(path.join(app.getPath('userData'),'online.json'),JSON.stringify({serverUrl:url||serverUrl}))}catch{}}return result});
 ipcMain.handle('online:join',(_e,name)=>{if(!socket?.connected)return {error:'Sunucuya bağlı değilsin.'};socket.emit('profile:load',{name});socket.emit('match:join',{name});return {ok:true}});
 ipcMain.handle('online:play',(_e,payload)=>{if(socket?.connected)socket.emit('card:play',payload)});
 ipcMain.handle('online:leave',()=>{if(socket?.connected)socket.emit('match:leave')});
});
app.on('window-all-closed',()=>{if(socket)socket.disconnect();if(process.platform!=='darwin')app.quit()});
app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
