// ==========================================================================
// СЕРВИС-ВОРКЕР КГУ «СШ № 43»: ФОНОВЫЙ WEB PUSH И ОБРАБОТКА ТАПОВ
// ==========================================================================

// 1. Прием системных Push-уведомлений (работает при выключенном экране и закрытом приложении/браузере)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { message: event.data.text() };
    }
  }

  const title = data.title || 'КГУ «СШ № 43»';
  const taskId = data.taskId || null;
  const targetUrl = data.url || (taskId ? `/?openTaskId=${taskId}&tab=tasks` : '/');

  const options = {
    body: data.message || data.body || 'Новое поручение в школьном планере',
    icon: '/school43logo.png',
    badge: '/badge-96x96.png',
    image: data.image || '/school43logo.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || `school43-push-${taskId || 'notif'}-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: {
      url: targetUrl,
      taskId: taskId,
      tab: data.tab || 'tasks'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Обработка клика/тапа по уведомлению (открытие задачи)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || (data.taskId ? `/?openTaskId=${data.taskId}&tab=tasks` : '/');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Если приложение открыто (свернуто или активно) — фокусируемся и открываем задачу без перезагрузки SPA
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.postMessage({
            type: 'NOTIFICATION_OPEN_TASK',
            taskId: data.taskId,
            tab: data.tab || 'tasks'
          });
          return client.focus();
        }
      }

      // 2. Если приложение было полностью закрыто — запускаем его с URL задачи
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
