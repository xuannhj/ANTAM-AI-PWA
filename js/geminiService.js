import { GROQ_API_KEY } from './config.js';

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const PROMPTS = {
  MEDICINE: `Nhiệm vụ: Đọc chữ in trên vỏ thuốc trong ảnh. Không giải thích hay phân tích tiếng Anh.
Chỉ trả về đúng 3 dòng theo mẫu:
- Tên thuốc: [Tên và hàm lượng]
- Công dụng: [Công dụng chính ngắn gọn]
- Cách uống: [Liều dùng ngắn gọn]`,

  RECEIPT: `Nhiệm vụ: Đọc hóa đơn mua hàng.
Chỉ trả về đúng 2 dòng:
- Nơi mua: [Tên cửa hàng/địa điểm]
- TỔNG TIỀN: [Số tiền thanh toán]`,

  CURRENCY: `Nhiệm vụ: Nhận diện tờ tiền trong ảnh.
Chỉ trả về đúng 1 câu: Tờ tiền [Mệnh giá] đồng.`
};

export async function analyzeImageFast(base64Data, mode = 'MEDICINE') {
  const promptText = PROMPTS[mode] || PROMPTS.MEDICINE;

  const payload = {
    model: "qwen/qwen3.6-27b",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptText },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Data}`
            }
          }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 2048
  };

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || 'Lỗi kết nối API');
  }

  const data = await response.json();
  let rawText = data.choices[0]?.message?.content || '';

  // 1. Cắt bỏ thẻ suy nghĩ <think>...</think> nếu có
  if (rawText.includes('</think>')) {
    rawText = rawText.split('</think>')[1].trim();
  }

  // 2. Bóc tách kết quả chuẩn xác theo từng chế độ
  if (mode === 'MEDICINE') {
    const matchName = rawText.match(/Tên thuốc:\s*([^\n\r*]+)/i);
    const matchUsage = rawText.match(/Công dụng:\s*([^\n\r*]+)/i);
    const matchDosage = rawText.match(/Cách (?:uống|dùng):\s*([^\n\r*]+)/i);

    if (matchName) {
      const name = matchName[1].replace(/\(.*?\)/g, '').trim();
      const usage = matchUsage ? matchUsage[1].replace(/\(.*?\)/g, '').trim() : "Giảm đau, hạ sốt";
      const dosage = matchDosage ? matchDosage[1].replace(/\(.*?\)/g, '').trim() : "1-2 viên/lần hoặc theo chỉ định bác sĩ";

      return `💊 Tên thuốc: ${name}\n✨ Công dụng: ${usage}\n📝 Cách uống: ${dosage}`;
    }
  } else if (mode === 'CURRENCY') {
    const matchCurrency = rawText.match(/(?:Tờ tiền|Mệnh giá).*?(?:\d+[\d.,]*|\b[A-Za-zÀ-ỹ\s]+)\s*(?:đồng|VNĐ|VND)/i);
    if (matchCurrency) {
      return `💵 ${matchCurrency[0].trim()}`;
    }
  } else if (mode === 'RECEIPT') {
    const matchPlace = rawText.match(/Nơi mua:\s*([^\n\r*]+)/i);
    const matchTotal = rawText.match(/TỔNG TIỀN:\s*([^\n\r*]+)/i);
    if (matchTotal) {
      return `🧾 Nơi mua: ${matchPlace ? matchPlace[1].trim() : "Không rõ"}\n💰 TỔNG TIỀN: ${matchTotal[1].trim()}`;
    }
  }

  // 3. Fallback an toàn lọc bỏ phần nháp
  const matchIndex = rawText.search(/[-*]?\s*(Tên thuốc|Tên|Nơi mua|Tờ tiền):/i);
  if (matchIndex !== -1) {
    return rawText.substring(matchIndex).trim();
  }

  return rawText.replace(/<think>[\s\S]*/gi, '').trim() || "Đã đọc xong nhưng không tìm thấy thông tin phù hợp, vui lòng chụp rõ nét hơn.";
}