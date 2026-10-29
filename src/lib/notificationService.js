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
   */
  async send(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }

    const taskId = options.taskId || options.data?.taskId || null;
    const targetUrl = taskId ? `/?openTaskId=${taskId}&tab=tasks` : '/';

    const mergedOptions = {
      icon: '/pwa-192x192.png',
      badge: '/badge-96x96.png', // Прозрачный силуэтный бейдж (устраняет белый квадрат на Android!)
      image: options.image || '/pwa-512x512.png', // Полноцветная картинка приложения в шторке Android
      vibrate: [250, 100, 250],
      tag: options.tag || `school43-${taskId || Date.now()}`,
      renotify: true,
      data: {
        url: targetUrl,
        taskId,
        tab: 'tasks',
        ...options.data
      },
      ...options
    };

    // 1. Через Service Worker (надежно на смартфонах Android при свернутом приложении)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, mergedOptions);
          return true;
        }
      } catch {
        // Fallback к обычному конструктору
      }
    }

    // 2. Стандартный конструктор Notification для Desktop (Windows, macOS, Linux)
    try {
      const notif = new Notification(title, mergedOptions);
      notif.onclick = function(e) {
        e.preventDefault();
        window.focus();
        if (taskId && window.__openTaskFromNotification) {
          window.__openTaskFromNotification(taskId);
        } else if (targetUrl) {
          window.location.href = targetUrl;
        }
      };
      return notif;
    } catch (e) {
      console.warn('System notification fallback warning:', e);
      return null;
    }
  }
};
