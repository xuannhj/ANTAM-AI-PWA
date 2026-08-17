import { compressImageFast } from './imageProcessor.js';
import { analyzeImageFast } from './geminiService.js';

let currentMode = 'MEDICINE';

// 1. SỬA LỖI CHUYỂN TAB: Bắt sự kiện click cho từng nút chế độ
const modeButtons = document.querySelectorAll('.btn-mode');
modeButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Reset giao diện các nút
    modeButtons.forEach(b => {
      b.classList.remove('bg-primary', 'text-white');
      b.classList.add('bg-surface-container-highest', 'text-on-surface');
    });

    // Kích hoạt nút vừa bấm
    const target = e.currentTarget;
    target.classList.remove('bg-surface-container-highest', 'text-on-surface');
    target.classList.add('bg-primary', 'text-white');
    
    currentMode = target.dataset.mode;
    console.log("👉 Đã chuyển sang chế độ:", currentMode);
  });
});

// 2. Xử lý Camera & Upload
const cameraInput = document.getElementById('camera-input');
const btnCapture = document.getElementById('btn-capture');
const previewContainer = document.getElementById('preview-container');
const imagePreview = document.getElementById('image-preview');
const loadingSpinner = document.getElementById('loading-spinner');
const resultDisplay = document.getElementById('result-display');

if (btnCapture && cameraInput) {
  btnCapture.addEventListener('click', () => cameraInput.click());
}

if (cameraInput) {
  cameraInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const startTime = performance.now();

    try {
      previewContainer.style.display = 'block';
      loadingSpinner.style.display = 'block';
      resultDisplay.innerText = '';

      // 1. Nén ảnh qua Canvas
      const { base64Data, previewUrl } = await compressImageFast(file);
      imagePreview.src = previewUrl;

      // 2. Gửi API phân tích ảnh
      const resultText = await analyzeImageFast(base64Data, currentMode);

      // 3. Hiển thị kết quả trọn vẹn
      loadingSpinner.style.display = 'none';
      resultDisplay.innerText = resultText;

      const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`⚡ Tổng thời gian Groq xử lý: ${totalTime}s`);

    } catch (error) {
      loadingSpinner.style.display = 'none';
      resultDisplay.innerText = `Lỗi: ${error.message}`;
      console.error(error);
    }
  });
}