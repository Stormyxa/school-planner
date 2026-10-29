// ==========================================================================
// СЕРВИС ХРАНЕНИЯ ФАЙЛОВ (GITHUB STORAGE & FALLBACK)
// ==========================================================================

/**
 * Загрузка файла документа (Word, Excel, PDF, сканы)
 * @param {File} file - файл из input
 * @param {string} taskId - ID поручения
 * @param {string} userId - ID учителя
 * @returns {Promise<{name: string, size: string, url: string, date: string}>}
 */
export async function uploadSchoolFile(file, taskId, userId) {
  // Форматируем размер файла
  const sizeFormatted = file.size > 1024 * 1024 
    ? `${(file.size / (1024 * 1024)).toFixed(1)} МБ`
    : `${Math.round(file.size / 1024)} КБ`;

  const dateNow = new Date().toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  // 1. Попытка загрузить через Vercel Serverless Function (/api/upload -> GitHub Repo)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);
    formData.append('userId', userId);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      return {
        name: file.name,
        size: sizeFormatted,
        url: data.downloadUrl || data.url,
        date: dateNow,
        storageType: 'github'
      };
    }
  } catch {
    // Если развернуто локально без Vercel Serverless API, мягко переходим на локальное хранилище
  }

  // 2. Локальный Fallback (IndexedDB / Blob / Base64 URL для мгновенной работы из коробки)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        size: sizeFormatted,
        url: reader.result, // base64 data url
        date: dateNow,
        storageType: 'local_preview'
      });
    };
    reader.readAsDataURL(file);
  });
}
