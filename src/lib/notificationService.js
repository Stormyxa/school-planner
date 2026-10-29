// ==========================================================================
// СЕРВИС УВЕДОМЛЕНИЙ КГУ «СШ № 43» (WEB PUSH, PWA И СЕРВИС-ВОРКЕР)
// ==========================================================================

export const NotificationService = {
  /**
   * Запрос разрешения на браузерные уведомления
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Этот браузер не поддерживает Web Notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }

    return false;
  },

  /**
   * Проверка текущего статуса
   */
  getPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Отправка системного уведомления (с поддержкой Service Worker для Android/Desktop)
   * ВАЖНО: options.taskId — ID поручения для перехода при тапе
   */
  async send(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }

    // Явно извлекаем taskId — не полагаемся на spread
    const taskId = options.taskId || null;
    const body = options.body || '';
    const targetUrl = taskId ? `/?openTaskId=${taskId}&tab=tasks` : '/';

    // Формируем payload строго — data НЕ перезатирается, tag уникален для каждого события
    const notifOptions = {
      body,
      icon: '/school43logo.png',
      badge: '/badge-96x96.png',
      image: '/school43logo.png',
      vibrate: [250, 100, 250],
      tag: options.tag || `school43-${taskId || 'notif'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      renotify: true,
      requireInteraction: false,
      data: {
        url: targetUrl,
        taskId: taskId,
        tab: 'tasks'
      }
    };

    // 1. Через Service Worker (для Android/Desktop PWA — работает при свернутом приложении)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notifOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('SW showNotification failed, fallback to Notification constructor:', swErr?.message);
      }
    }

    // 2. Fallback: стандартный конструктор Notification (Desktop Chrome/Firefox)
    try {
      const notif = new Notification(title, notifOptions);
      notif.onclick = function(e) {
        e.preventDefault();
        window.focus();
        if (taskId && window.__openTaskFromNotification) {
          window.__openTaskFromNotification(taskId);
        } else {
          window.location.href = targetUrl;
        }
      };
      return notif;
    } catch (e) {
      console.warn('Notification constructor failed:', e?.message);
      return null;
    }
  }
};
