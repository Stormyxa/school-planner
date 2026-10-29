// ==========================================================================
// СЕРВИС-ВОРКЕР: ОБРАБОТКА НАЖАТИЯ НА УВЕДОМЛЕНИЯ КГУ «СШ № 43»
// ==========================================================================

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || (data.taskId ? `/?openTaskId=${data.taskId}&tab=tasks` : '/');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Если приложение открыто (свернуто или активно) — фокусируемся на нем
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(targetUrl);
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
