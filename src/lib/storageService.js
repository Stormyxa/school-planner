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
    const encodedName = encodeURIComponent(file.name);
    const response = await fetch(`/api/upload?filename=${encodedName}`, {
      method: 'POST',
      headers: {
        'x-filename': encodedName,
        'content-type': file.type || 'application/octet-stream'
      },
      body: file
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

/**
 * Надежное скачивание файла в браузере с сохранением оригинального имени и расширения (.docx, .xlsx, .pdf)
 * Предотвращает скачивание в виде .bin для внешних ссылок (GitHub raw content).
 * @param {string} url - ссылка на файл (GitHub raw или data url)
 * @param {string} fileName - оригинальное название файла с расширением
 */
export async function triggerFileDownload(url, fileName) {
  if (!url) return;
  const safeName = fileName || 'document';

  try {
    // Если это локальный base64 URL
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // Для внешних ссылок (GitHub raw content): запрашиваем Blob
    // Это гарантирует, что браузер сохранит файл с правильным расширением и именем
    const response = await fetch(url);
    if (!response.ok) throw new Error('Fetch failed: ' + response.status);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch {
    // Резервный вариант, если прямой fetch заблокирован CORS
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
