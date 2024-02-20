/*
    XML FILE SELECTION
*/
const xlsxFileInput = document.querySelector('#xlsx-file-input');

const xlsxDetails = document.querySelector('#current-file-data');
const xlsxFileName = document.querySelector('#input-file-name');
const xlsxFilePath = document.querySelector('#input-file-path');

const defaultXlsxFileName = xlsxFileName.innerHTML;
const defaultXlsxFilePath = xlsxFilePath.innerHTML;

let processedFile;
let isFileSelected = false;

function getFile(e) {
  isFileSelected = false;
  const file = e.target.files[0];

  // CHECK IF FILE IS OF PROPER FORMAT
  if( !isXlsx(file) ) {
    alert('Please select valid .xlsx file');
    return;
  }
  resetFileInfo();
  resetProcessingInfo();
  resetDownloadingInfo();

  // SET FILE VAR
  processedFile = file;
  isFileSelected = true;

  // SET DESCRIPTION NAME AND PATH
  xlsxFileName.innerHTML = 'File: ' + file.name;
  xlsxFileName.classList.remove('hidden');

  var lastSlashPosition = file.path.lastIndexOf('\\');
  var pathWithoutFileName = file.path.substring(0, lastSlashPosition);
  xlsxFilePath.innerHTML = pathWithoutFileName;
  xlsxFilePath.classList.remove('hidden');

  processingStatus.innerHTML = "Ready for processing"
  downloadStatus.innerHTML = "Load a file"
}

function isXlsx(file) {
  const acceptedXlsxType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return file && file['type'] === acceptedXlsxType;
}

function resetFileInfo() {
  xlsxFileName.innerHTML = defaultXlsxFileName;
  xlsxFileName.classList.add('hidden');

  xlsxFilePath.innerHTML = defaultXlsxFilePath;
  xlsxFilePath.classList.add('hidden');
}

// ADD EVENTLISTENERS
xlsxFileInput.addEventListener('change', getFile);



/*
    XML FILE READING
*/
const processFileButton = document.querySelector('#btn-file-process');
const processingStatus = document.querySelector('#file-process-progress');
const processingRowsNo = document.querySelector('#file-process-rows');
const processingCellsNo = document.querySelector('#file-process-cells');

const processingRowNoWrapper = document.querySelector('#file-process-rows-wrap')
const processingCellsNoWrapper = document.querySelector('#file-process-cells-wrap')

const defaultProcessButton = processFileButton.innerHTML;
const defaultProcessingStatus = processingStatus.innerHTML;
const defaultProcessingRowsNo = processingRowsNo.innerHTML;
const defaultProcessingCellsNo = processingCellsNo.innerHTML;

let isFileLoaded = false;
let isFileLoading = false;
let downloadsMap;

function readXlsx() {
  if (isFileLoading) return;
  if (!isFileSelected) {
    alert('Please load .xlsx file first');
    return;
  }
  isFileLoading = true;
  processFileButton.disabled = true;

  var reader = new FileReader();
  let totalRows =  0;
  let totalCells =  0;

  // INFORM ABOUT LOADING INIT:
  reader.onloadstart = function() {
    resetProcessingInfo();
    resetDownloadingInfo();

    isFileLoaded = false;

    processFileButton.innerHTML = "Loading..."
    downloadStatus.innerHTML = "Waiting for processing"
    processingStatus.innerHTML = "Started processing";
  };
  // INFORM ABOUT PROGRESS:
  reader.onprogress = function(event) {
    if (event.lengthComputable) {
      processingStatus.innerHTML = "Loading file...";
    }
  };
  // LOAD
  reader.onload = async function(event) {
    const data = new Uint8Array(event.target.result);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data);

    const rowDataMap = new Map();
    
    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row, rowNumber) => {

        const key = row.getCell(1).value;
        const values = [];
        totalRows++;

        row.eachCell((cell, colNumber) => {
          if (colNumber !==   1) {
            values.push(cell.value);
            totalCells++;
          }
        });

        rowDataMap.set(key, values);
      });
    });
    // REMOVE FIRST ROW TO SKIP HEADERS
    rowDataMap.delete(rowDataMap.keys().next().value);

    // SAVE MAP AND SEND IT TO MAIN.JS
    downloadsMap = rowDataMap;
    window.electronAPI.send('map-toMain', rowDataMap);

    processFileButton.innerHTML = defaultProcessButton;
    processingStatus.innerHTML = "File loaded:";
    processingRowsNo.innerHTML = totalRows;
    processingRowNoWrapper.classList.remove('hidden');
    processingCellsNo.innerHTML = totalCells;
    processingCellsNoWrapper.classList.remove('hidden');

    downloadStatus.innerHTML = "Ready to download"
    isFileLoaded = true;
    isFileLoading = false;
    processFileButton.disabled = false;
  }

  reader.readAsArrayBuffer(processedFile);
}

function resetProcessingInfo() {
  processingStatus.innerHTML = defaultProcessingStatus;
  processingRowsNo.innerHTML = defaultProcessingRowsNo;
  processingRowNoWrapper.classList.add('hidden');
  processingCellsNo.innerHTML = defaultProcessingCellsNo;
  processingCellsNoWrapper.classList.add('hidden');
}

// ADD EVENT LISTENER
processFileButton.addEventListener('click', readXlsx);



/*
    IMAGES DOWNLOAD
*/
const downloadButton = document.querySelector('#btn-download');
const downloadStatus = document.querySelector('#download-progress');
const downloadSuccessNo = document.querySelector('#download-success-no');
const downloadFailsNo = document.querySelector('#download-fails-no');
const downloadFailsList = document.querySelector('#download-fails-list');

const downloadSuccessNoWrapper = document.querySelector('#download-success-no-wrap');
const downloadFailsNoWrapper = document.querySelector('#download-fails-no-wrap');

const defaultDownloadStatus = downloadStatus.innerHTML;
const defaultDownloadSuccessNo = downloadSuccessNo.innerHTML;
const defaultDownloadFailsNo = downloadFailsNo.innerHTML;

let isDownloading = false;

function startDownloading() {
  if (!isFileSelected) {
    alert('Please select and process .xlsx file first');
    return;
  }
  if (!isFileLoaded) {
    alert('Please process .xlsx file first');
    return;
  }
  downloadButton.disabled = true;

  if (isDownloading) return;
  // TODO: ADD CHECK IF FILE HAS BEEN LOADED
  isDownloading = true;
  resetDownloadingInfo();

  downloadButton.innerHTML = 'Downloading...';
  downloadStatus.innerHTML = 'In progress...'

  window.electronAPI.send('download-toMain', true);
}

function downloadingFinished(response) {
  console.log(response);
  
  downloadButton.innerHTML = 'Download';
  if (response[0] !== undefined) {
    downloadStatus.innerHTML = response[0];
  }
  if (response[1] !== undefined) {
    downloadSuccessNo.innerHTML = response[1];
    downloadSuccessNoWrapper.classList.remove('hidden');
  }
  if (response[2] !== undefined) {
    downloadFailsNo.innerHTML = response[2];
    downloadFailsNoWrapper.classList.remove('hidden');
  }
  if (response[3] !== undefined && response[3].length !== 0) {
    downloadFailsList.innerHTML = response[3];
    downloadFailsList.classList.remove('hidden');
  }

  isDownloading = false;
  downloadButton.disabled = false;
}

function resetDownloadingInfo() {
  downloadStatus.innerHTML = defaultDownloadStatus;

  downloadSuccessNo.innerHTML = defaultDownloadSuccessNo;
  downloadSuccessNoWrapper.classList.add('hidden');

  downloadFailsNo.innerHTML = defaultDownloadFailsNo;
  downloadFailsNoWrapper.classList.add('hidden');

  downloadFailsList.innerHTML = "";
  downloadFailsList.classList.add('hidden');
}

// ADD EVENT LISTENERS
downloadButton.addEventListener( 'click', () => startDownloading() );

window.addEventListener('message', (event) => {
  if (event.data.channel === 'selected-directory') {
    console.log('Selected directory:', event.data.path);
  }
});

window.electronAPI.on('download-toRenderer', (response) => {
  downloadingFinished(response); // This will log the response from the main process
});