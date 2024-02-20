/*
    XML FILE SELECTION
*/
const xlsxFileInput = document.querySelector('#xlsx-file-input');

const xlsxDetails = document.querySelector('#current-file-data');
const xlsxFileName = document.querySelector('#input-file-name');
const xlsxFilePath = document.querySelector('#input-file-path');

let processedFile;

function getFile(e) {
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

  // SET DESCRIPTION NAME AND PATH
  xlsxDetails.style.display = 'block';
  document.querySelector( '#input-file-name' ).innerHTML = 'File: ' + file.name;
  var lastSlashPosition = file.path.lastIndexOf('\\');
  var pathWithoutFileName = file.path.substring(0, lastSlashPosition);
  document.querySelector( '#input-file-path' ).innerHTML = pathWithoutFileName;
}

function isXlsx(file) {
  const acceptedXlsxType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return file && file['type'] === acceptedXlsxType;
}

function resetFileInfo() {
  processingStatus.innerHTML = "";
  processingRowsNo.innerHTML = "";
  processingCellsNo.innerHTML = "";
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

const defaultProcessingStatus = processingStatus.innerHTML;
const defaultProcessingRowsNo = processingRowsNo.innerHTML;
const defaultProcessingCellsNo = processingCellsNo.innerHTML;

let downloadsMap;

function readXlsx() {
  if (!processedFile) {
    alert('Please load .xlsx file first');
    return;
  }
  var reader = new FileReader();
  // required by excel
  let totalRows =  0;
  let totalCells =  0;

  // INFORM ABOUT LOADING INIT:
  reader.onloadstart = function() {
    resetProcessingInfo();
    resetDownloadingInfo();
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

    // SAVE MAP AND SEND IT TO MAIN.JS
    downloadsMap = rowDataMap;
    window.electronAPI.send('map-toMain', rowDataMap);

    processingStatus.innerHTML = "File loaded:";
    processingRowsNo.innerHTML = totalRows;
    processingCellsNo.innerHTML = totalCells;
  }

  reader.readAsArrayBuffer(processedFile);
}

function resetProcessingInfo() {
  processingStatus.innerHTML = defaultProcessingStatus;
  processingRowsNo.innerHTML = defaultProcessingRowsNo;
  processingCellsNo.innerHTML = defaultProcessingCellsNo;
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

const defaultDownloadStatus = downloadStatus.innerHTML;
const defaultDownloadSuccessNo = downloadSuccessNo.innerHTML;
const defaultDownloadFailsNo = downloadFailsNo.innerHTML;

function startDownloading() {
  // TODO: ADD CHECK IF FILE HAS BEEN LOADED
  resetDownloadingInfo();

  downloadButton.innerHTML = 'Downloading...';

  window.electronAPI.send('download-toMain', true);
}

function downloadingFinished(response) {
  console.log(response);
  
  downloadButton.innerHTML = 'Download';
  if (response[0] !== undefined) downloadStatus.innerHTML = response[0];
  if (response[1] !== undefined) downloadSuccessNo.innerHTML = response[1];
  if (response[2] !== undefined) downloadFailsNo.innerHTML = response[2];
  if (response[3] !== undefined) console.log(response[3]); // TODO ADD FAILS LIST
}

function resetDownloadingInfo() {
  downloadStatus.innerHTML = defaultDownloadStatus;
  downloadSuccessNo.innerHTML = defaultDownloadSuccessNo;
  downloadFailsNo.innerHTML = defaultDownloadFailsNo;
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