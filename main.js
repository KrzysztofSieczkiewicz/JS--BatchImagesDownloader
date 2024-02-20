const path = require('path')
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const download = require('image-downloader');
const os = require('os');
const fs = require('fs');

const isDev = process.env.NODE_ENV !== 'development'
const isMac = process.platform === 'darwin';

function createMainWindow() {
    const mainWindow = new BrowserWindow({
      title: 'Batch image downloader',
      width: isDev ? 1000 : 500,
      height: 720,
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
    xlsxMap = arg;
  });

  ipcMain.on('download-toMain', (event, arg) => {
    const response = downloadFromMap(xlsxMap)

    response.then( (data) => {
      event.sender.send('download-toRenderer', data);
    })
  })
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

//// FUNCTIONS TO HANDLE DATA DOWNLOAD
let xlsxMap;
let isDownloading = false;
const illegalRe = /[/\\?%*:|"<>]/g;
const homeDirectory = os.homedir();

async function downloadFromMap(urlsMap) {
  if (isDownloading) {
    return;
  }
  isDownloading = true;

  let failed = [];
  let successNo = 0;
  let errorNo = 0;

  // CREATE FOLDER FOR IMAGES
  const dateTime = getCurrentDateTime();
  const folderName = 'imagesDownload_' + dateTime;
  const dirDownloads = path.join(homeDirectory, 'Downloads');
  const dirFinal = path.join(dirDownloads, folderName);

  if (fs.existsSync(dirFinal)) {
    dirFinal += '_2'
  }
  fs.mkdirSync(dirFinal);

  // TODO: SEND BACK INFO ABOUT DOWNLOAD INIT

  for (const [mapKey, valueArray] of urlsMap.entries()) {
    for (let i =  0; i < valueArray.length; i++) {
      const saveMapKey = mapKey.replace(illegalRe, '-');

      const options = {
        url: valueArray[i],
        dest: `${dirFinal}/${saveMapKey}_${dateTime}_${i}.jpg`
      };

      try {
        await download.image(options);
        successNo += 1;
      } catch (e) {
        if (!failed.includes(mapKey)) failed.push(mapKey);
        errorNo += 1;
      }
    }
  }
  isDownloading = false;
  const message = "Downloading finished";

  return [message, successNo, errorNo, failed];
}



function getCurrentDateTime() {
  const date = new Date();

  let day = String(date.getDate()).padStart(2, '0');
  let month = String(date.getMonth() +  1).padStart(2, '0');
  let year = date.getFullYear();
  let hour = String(date.getHours()).padStart(2, '0');
  let minutes = String(date.getMinutes()).padStart(2, '0');

  return year + "" + month + "" + day + '-' + hour + "" + minutes;
}