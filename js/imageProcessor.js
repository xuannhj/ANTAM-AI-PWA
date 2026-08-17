/**
 * Nén ảnh siêu tốc cho Gemini Vision (~80KB - 150KB)
 * @param {File} file
 * @param {number} maxDimension - Mặc định 1000px
 * @param {number} quality - Mặc định 0.68
 */
export function compressImageFast(file, maxDimension = 1000, quality = 0.68) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('File không hợp lệ'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // 'medium' nhanh hơn 'high' mà vẫn sắc nét
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = dataUrl.split(',')[1];

        console.log(`[Fast Compress] Kích thước: ${width}x${height}px | Dung lượng payload: ${(base64Data.length * 0.75 / 1024).toFixed(1)} KB`);

        resolve({ base64Data, previewUrl: dataUrl });
      };
      img.onerror = () => reject(new Error('Lỗi load ảnh vào Canvas'));
    };
    reader.onerror = () => reject(new Error('Lỗi đọc file'));
  });
}