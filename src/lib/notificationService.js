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
    return Notification.permission; // 'default' | 'granted' | 'denied'
  },

  /**
   * Отправка системного уведомления (с поддержкой Service Worker для Android/Desktop)
   */
  async send(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }

    const mergedOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200],
      tag: options.tag || `school43-${Date.now()}`,
      renotify: true,
      ...options
    };

    // 1. Попытка через Service Worker (обязательно для Android PWA, где new Notification() запрещен)
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

    // 2. Стандартный конструктор Notification для Desktop (Chrome, Edge, Safari, Firefox)
    try {
      return new Notification(title, mergedOptions);
    } catch (e) {
      console.warn('System notification fallback warning:', e);
      return null;
    }
  }
};
