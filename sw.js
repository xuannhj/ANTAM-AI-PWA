// 1. Tên hòm Cache (Mỗi lần update giao diện HTML/CSS, chỉ cần đổi v1 -> v2, v3,...)
const CACHE_NAME = 'antam-ai-v4';

// 2. Danh sách các file cần lưu trữ offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './mat-than.html',
  './khien.html',
  './tro-ly.html',
  './manifest.json'
];

// ==========================================
// A. SỰ KIỆN INSTALL (Cài đặt & Lưu Cache)
// ==========================================
self.addEventListener('install', (event) => {
  // Ép Service Worker mới kích hoạt ngay lập tức mà không cần chờ đóng tab
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Đang lưu trữ tài nguyên vào Cache:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// ==========================================
// B. SỰ KIỆN ACTIVATE (TỰ ĐỘNG XÓA CACHE CŨ - ĐOẠN BẠN ĐANG THIẾU)
// ==========================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Nếu tìm thấy hòm cache khác tên với CACHE_NAME hiện tại (ví dụ antam-ai-v1) -> XÓA HẲN!
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Đang xóa bộ nhớ đệm cũ:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Giúp Service Worker chiếm quyền điều khiển các trang ngay lập tức
      return self.clients.claim();
    })
  );
});

// ==========================================
// C. SỰ KIỆN FETCH (Lấy dữ liệu)
// ==========================================
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Nếu có trong Cache thì trả về ngay, nếu không thì lên mạng tải
      return cachedResponse || fetch(event.request);
    })
  );
});