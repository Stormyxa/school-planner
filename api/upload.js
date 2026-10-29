// ==========================================================================
// VERCEL SERVERLESS FUNCTION: GITHUB FILE STORAGE
// ==========================================================================
// При деплое на Vercel эндпоинт доступен по адресу /api/upload
// Безопасно сохраняет отчеты в отдельный приватный GitHub-репозиторий
// без расхода квоты Supabase Storage.

export const config = {
  api: {
    bodyParser: false, // для обработки multipart/form-data
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не поддерживается. Используйте POST.' });
  }

  const githubToken = process.env.GITHUB_STORAGE_TOKEN;
  const githubRepo = process.env.GITHUB_STORAGE_REPO; // формат: "username/repo-name"

  if (!githubToken || !githubRepo) {
    return res.status(500).json({ 
      error: 'Переменные окружения GITHUB_STORAGE_TOKEN или GITHUB_STORAGE_REPO не настроены в Vercel.' 
    });
  }

  try {
    // В Vercel Edge/Serverless читаем бинарные данные
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Уникальный путь для файла
    const timestamp = Date.now();
    const filePath = `documents/${new Date().getFullYear()}/${timestamp}_school_document.bin`;

    const githubUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

    const githubResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'School-Planner-Vercel-App'
      },
      body: JSON.stringify({
        message: `Школьный отчет: загрузка документа ${timestamp}`,
        content: buffer.toString('base64')
      })
    });

    if (!githubResponse.ok) {
      const errData = await githubResponse.json();
      return res.status(githubResponse.status).json({ error: errData.message });
    }

    const result = await githubResponse.json();
    return res.status(200).json({
      success: true,
      downloadUrl: result.content.download_url,
      htmlUrl: result.content.html_url,
      path: filePath
    });
  } catch (err) {
    return res.status(500).json({ error: 'Ошибка сохранения файла в GitHub: ' + err.message });
  }
}
