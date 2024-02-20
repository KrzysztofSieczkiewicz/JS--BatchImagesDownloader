const path = require('path')
const { app, BrowserWindow, Menu, ipcMain } = require('electron');

const isDev = process.env.NODE_ENV !== 'development'
const isMac = process.platform === 'darwin';
const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';

function createMainWindow() {
    const mainWindow = new BrowserWindow({
      title: 'Batch image downloader',
      width: isDev ? 1000 : 500,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        enableRemoteModule: false
      }
    });

  const appMenu = Menu.buildFromTemplate(menu);
  mainWindow.setMenu(appMenu);

    // Open devtools if in dev env
    if(isDev) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

function createHelpWindow() {
  const helpWindow = new BrowserWindow({
    title: 'How to use?',
    width: 600,
    height: 300,
  });

  helpWindow.setMenu(null);

  helpWindow.loadFile(path.join(__dirname, './renderer/help.html'));
}

app.whenReady().then( () => {
  createMainWindow();

  app.on('activate', () => {
    if(BrowserWindow.getAllWindows.length === 0) {
      createMainWindow();
    }
  })
  
  app.on('window-all-closed', () => {
    if(!isMac) {
      app.quit();
    }
  })
})

app.on('ready', () => {
  ipcMain.on('map-toMain', (event, arg) => {
      console.log('Received message on get-map:', arg);
      // Handle the message
  });
})

// Top bar menu template
const menu = [
  {
    label: 'Help',
    submenu: [
      {
        label: 'How to?',
        click: () => createHelpWindow(),
        accelerator: 'CmdOrCtrl+H'
      }
    ]
  }
]