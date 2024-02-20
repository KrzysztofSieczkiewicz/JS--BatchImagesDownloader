const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
      console.log("NO POWINNO IŚĆ")
      ipcRenderer.send(channel, data) 
    },
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});