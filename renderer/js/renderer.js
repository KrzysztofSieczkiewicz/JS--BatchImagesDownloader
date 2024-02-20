//TODO: REMOVE IMAGE-DOWNLOADER

const xlsxFileInput = document.getElementById('xlsx-file-input');

const xlsxDetails = document.querySelector('#current-file-data');
const xlsxFileName = document.querySelector('#input-file-name');
const xlsxFilePath = document.querySelector('#input-file-path');


const processFileButton = document.querySelector('#btn-file-process');
const processingStatus = document.querySelector('#file-process-progress');
const processingRowsNo = document.querySelector('#file-process-rows');
const processingCellsNo = document.querySelector('#file-process-cells');

const downloadButton = document.querySelector('#btn-download');

let processedFile;
let downloadsMap;

let isDownloading = false;

function loadFile(e) {
  const file = e.target.files[0];

  // CHECK IF FILE IS OF PROPER FORMAT
  if( !isXlsx(file) ) {
    alert('Please select valid .xlsx file');
    return;
  }

  // SET FILE VAR
  processedFile = file;

  // SET DESCRIPTION NAME AND PATH
  xlsxDetails.style.display = 'block';
  document.querySelector( '#input-file-name' ).innerHTML = 'File: ' + file.name;
  var lastSlashPosition = file.path.lastIndexOf('\\');
  var pathWithoutFileName = file.path.substring(0, lastSlashPosition);
  document.querySelector( '#input-file-path' ).innerHTML = pathWithoutFileName;

  // CLEAR LOADING STATISTICS
  processingStatus.innerHTML = "";
  processingRowsNo.innerHTML = "";
  processingCellsNo.innerHTML = "";
}

function isXlsx(file) {
  const acceptedXlsxType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return file && file['type'] === acceptedXlsxType;
}


function readXlsx() {
  var reader = new FileReader();
  // required by excel
  let totalRows =  0;
  let totalCells =  0;

  // INFORM ABOUT LOADING INIT:
  reader.onloadstart = function(event) {
    processingStatus.innerHTML = "Started processing";
    processingRowsNo.innerHTML = "";
    processingCellsNo.innerHTML = "";
  };

  // INFORM ABOUT PROGRESS:
  reader.onprogress = function(event) {
    if (event.lengthComputable) {
      processingStatus.innerHTML = "Loading file";
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

    downloadsMap = rowDataMap;

    processingStatus.innerHTML = "File loaded:";
    processingRowsNo.innerHTML = "Total rows detected: " + totalRows;
    processingCellsNo.innerHTML = "Total images detected: " + totalCells;
  }

  reader.readAsArrayBuffer(processedFile);
}


async function downloadFromMap() {
  if (isDownloading) {
    console.log('Download is already in progress. Prevented execution');
    return;
  }
  isDownloading = true;

  console.log("Started downloading")

  for (const [mapKey, valueArray] of downloadsMap.entries()) {
    console.log("Opened Map")
    for (let i =  0; i < valueArray.length; i++) {
      console.log('Started row: ' + i)

      console.log(valueArray[i])

      const options = {
        url: valueArray[i],
        dest: `./images/${mapKey}_${i}.jpg`
      };

      try {
        //const { filename } = await download.image(options);
        ipcRenderer.send("download", {
          url: valueArray[i],
          properties: {directory: `./images/${mapKey}_${i}.jpg`}
        });
        console.log('Image ' + filename + ' saved');
      } catch (e) {
        console.error(`Failed to download image ${valueArray[i]}, for product: ${mapKey}. ${e.message}`);
      }

      console.log('Finished row: ' + i)
    }
  }

  isDownloading = false;
}


xlsxFileInput.addEventListener('change', loadFile);
processFileButton.addEventListener('click', readXlsx);

downloadButton.addEventListener('click', () => {
  console.log("PRÓBUJĘ WYSŁAĆ")
  window.electronAPI.send('map-toMain', downloadsMap);
});


/*
document.getElementById('downloadButton').addEventListener('click', () => {
  //window.api.downloadImages(downloadsMap);

  ipcRenderer.send("download", {
    url: "URL is here",
    properties: {directory: "Directory is here"}
  });
});
*/