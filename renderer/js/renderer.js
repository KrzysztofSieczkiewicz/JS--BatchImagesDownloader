// Some JavaScript to load the image and show the form. There is no actual backend functionality. This is just the UI

const form = document.querySelector('#current-file');

function loadExcel(e) {
  const file = e.target.files[0];

  if (!isFileXlsx(file)) {
      alert('Please select an .xlsx file');
        return;
  }

  form.style.display = 'block';
  document.querySelector(
    '#filename'
  ).innerHTML = file.name;
}

function isFileXlsx(file) {
  const acceptedXlsxType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return file && file['type'] === acceptedXlsxType;
}

document.querySelector('#xlsx').addEventListener('change', loadExcel);
