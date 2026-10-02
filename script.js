const imageInput = document.getElementById('imageInput');
const formatSelect = document.getElementById('formatSelect');
const fillBgCheckbox = document.getElementById('fillBgCheckbox');
const colorPickerBox = document.getElementById('colorPickerBox');
const bgColorInput = document.getElementById('bgColor');
const convertBtn = document.getElementById('convertBtn');
const previewContainer = document.getElementById('previewContainer');
const previewList = document.getElementById('previewList');
const removeAllBtn = document.getElementById('removeAllBtn');
const resultsContainer = document.getElementById('resultsContainer');
const resultsList = document.getElementById('resultsList');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const transparentFormats = ['png', 'webp', 'avif', 'gif', 'x-icon'];
let selectedFiles = [];

imageInput.addEventListener('change', () => {
  if (imageInput.files && imageInput.files.length > 0) {
    addFiles(Array.from(imageInput.files));
  }
});

removeAllBtn.addEventListener('click', () => {
  selectedFiles = [];
  imageInput.value = '';
  renderPreviews();
  resultsContainer.style.display = 'none';
});

fillBgCheckbox.addEventListener('change', () => {
  colorPickerBox.style.display = fillBgCheckbox.checked ? 'flex' : 'none';
});

function addFiles(files) {
  files.forEach(file => {
    selectedFiles.push(file);
  });
  renderPreviews();
}

function renderPreviews() {
  previewList.innerHTML = '';
  if (selectedFiles.length === 0) {
    previewContainer.style.display = 'none';
    return;
  }

  previewContainer.style.display = 'block';

  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'preview-item';

    const thumb = document.createElement('img');
    thumb.className = 'preview-thumb';
    const objectUrl = URL.createObjectURL(file);
    thumb.src = objectUrl;

    const info = document.createElement('div');
    info.className = 'preview-info';

    const name = document.createElement('div');
    name.className = 'preview-filename';
    name.textContent = file.name;

    const meta = document.createElement('div');
    meta.className = 'preview-size';
    meta.textContent = formatBytes(file.size);

    info.appendChild(name);
    info.appendChild(meta);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'item-remove-btn';
    removeBtn.innerHTML = '&times;';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      selectedFiles.splice(index, 1);
      renderPreviews();
    };

    item.appendChild(thumb);
    item.appendChild(info);
    item.appendChild(removeBtn);
    previewList.appendChild(item);
  });
}

convertBtn.addEventListener('click', async () => {
  if (selectedFiles.length === 0) {
    alert("Por favor, selecciona al menos una imagen.");
    return;
  }

  resultsList.innerHTML = '';
  resultsContainer.style.display = 'block';

  const targetFormat = formatSelect.value;
  const mimeMap = {
    'png': 'image/png',
    'webp': 'image/webp',
    'jpeg': 'image/jpeg',
    'avif': 'image/avif',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'x-icon': 'image/x-icon'
  };

  const extMap = {
    'png': 'png',
    'webp': 'webp',
    'jpeg': 'jpg',
    'avif': 'avif',
    'gif': 'gif',
    'bmp': 'bmp',
    'x-icon': 'ico'
  };

  const isTransparent = transparentFormats.includes(targetFormat);

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    await processAndDisplay(file, targetFormat, mimeMap[targetFormat], extMap[targetFormat], isTransparent);
  }
});

function processAndDisplay(file, format, mimeType, ext, isTransparent) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (format === 'x-icon') {
          width = Math.min(width, 256);
          height = Math.min(height, 256);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        if (fillBgCheckbox.checked || !isTransparent) {
          ctx.fillStyle = fillBgCheckbox.checked ? bgColorInput.value : '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outName = getOutputFilename(file.name, ext);

        canvas.toBlob((blob) => {
          let url;
          if (blob) {
            url = URL.createObjectURL(blob);
          } else {
            url = canvas.toDataURL('image/png');
          }
          createResultCard(url, outName);
          resolve();
        }, mimeType, 0.92);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function createResultCard(url, filename) {
  const item = document.createElement('div');
  item.className = 'result-item';

  const thumb = document.createElement('img');
  thumb.className = 'result-thumb';
  thumb.src = url;

  const info = document.createElement('div');
  info.className = 'result-info';

  const name = document.createElement('div');
  name.className = 'result-filename';
  name.textContent = filename;

  info.appendChild(name);

  const downloadBtn = document.createElement('a');
  downloadBtn.className = 'download-link-btn';
  downloadBtn.href = url;
  downloadBtn.download = filename;
  downloadBtn.textContent = 'Guardar';

  item.appendChild(thumb);
  item.appendChild(info);
  item.appendChild(downloadBtn);

  resultsList.appendChild(item);
}

function getOutputFilename(originalName, newExt) {
  const lastDot = originalName.lastIndexOf('.');
  const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
  return `${baseName}.${newExt}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
