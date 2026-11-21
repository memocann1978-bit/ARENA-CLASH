const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('arenaAPI',{
 checkUpdate:()=>ipcRenderer.invoke('check-update'),
 downloadUpdate:()=>ipcRenderer.invoke('download-update'),
 installUpdate:()=>ipcRenderer.invoke('install-update'),
 connectOnline:url=>ipcRenderer.invoke('online:connect',url),
 joinOnline:name=>ipcRenderer.invoke('online:join',name),
 playOnline:payload=>ipcRenderer.invoke('online:play',payload),
 leaveOnline:()=>ipcRenderer.invoke('online:leave'),
 on:(channel,callback)=>{const allowed=['update-available','update-none','update-progress','update-downloaded','update-error','online:connected','online:error','online:disconnected','online:event'];if(allowed.includes(channel))ipcRenderer.on(channel,(_event,...args)=>callback(...args))}
});
