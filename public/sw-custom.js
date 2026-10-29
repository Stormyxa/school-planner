// ==========================================================================
// СЕРВИС-ВОРКЕР КГУ «СШ № 43»: ФОНОВЫЙ WEB PUSH И ОБРАБОТКА ТАПОВ
// ==========================================================================
// Получает push-сообщения от Apple Push Notification Service (APNs) и
// Google Firebase Cloud Messaging (FCM) даже когда экран выключен и приложение закрыто.

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

  // Детерминированный tag исключает любые дубликаты на уровне ОС (Android / iOS / Windows)
  const tag = data.tag || (taskId ? `school43-task-${taskId}` : `school43-notif-${data.type || 'general'}`);

  const options = {
    body: data.message || data.body || 'Новое поручение в школьном планере',
    icon: '/school43logo.png',
    badge: '/badge-96x96.png',
    vibrate: [250, 100, 250],
    tag: tag,
    renotify: false, // Не спамить повторной вибрацией если уведомление с тем же tag уже на экране
    requireInteraction: false,
    data: {
      url: targetUrl,
      taskId: taskId,
      tab: data.tab || 'tasks'
    }
  };

  // Большой баннер только если явно передан URL картинки (а не иконка школы)
  if (data.image) {
    options.image = data.image;
  }

  event.waitUntil(
    (async () => {
      // 1. Показываем нативное системное уведомление на шторке / экране блокировки
      await self.registration.showNotification(title, options);

      // 2. Оповещаем все открытые окна/вкладки PWA (если есть), чтобы обновили список без перезагрузки
      try {
        const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of windowClients) {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_RECEIVED',
            payload: { ...data, tag }
          });
        }
      } catch {
        // ignore
      }
    })()
  );
});

// 2. Обработка клика/тапа по уведомлению (открытие задачи)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const taskId = data.taskId || null;
  const targetUrl = data.url || (taskId ? `/?openTaskId=${taskId}&tab=tasks` : '/');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Если приложение открыто (свернуто или активно) — фокусируемся и открываем задачу
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_OPEN_TASK',
            taskId: taskId,
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
