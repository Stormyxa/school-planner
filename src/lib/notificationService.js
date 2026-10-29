// ==========================================================================
// СЕРВИС УВЕДОМЛЕНИЙ КГУ «СШ № 43» (WEB PUSH, PWA И СЕРВИС-ВОРКЕР)
// ==========================================================================
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const VAPID_PUBLIC_KEY = 'BPioFFDvLaqlDYXXedEYpXxOH1eBXgqgjcBr7okNukmmKMrfK1tbdXr1uviGiUTYfV2GPvx7joDDFMqU7vzs7ks';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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
   * Регистрация браузера в W3C PushManager (FCM / APNs)
   * Позволяет получать уведомления при закрытом браузере и выключенном экране
   */
  async subscribePush(currentUserUuid) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const granted = await this.requestPermission();
      if (!granted) return null;

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      if (subscription && currentUserUuid) {
        const subJson = subscription.toJSON();

        // 1. Сохраняем в Supabase push_subscriptions
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.from('push_subscriptions').upsert([{
              user_id: currentUserUuid,
              endpoint: subscription.endpoint,
              subscription: subJson,
              user_agent: navigator.userAgent,
              updated_at: new Date().toISOString()
            }], { onConflict: 'endpoint' });
          } catch (e) {
            console.warn('Supabase push_subscriptions upsert notice:', e.message);
          }
        }

        // 2. Регистрируем через серверную функцию
        try {
          fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'subscribe',
              userId: currentUserUuid,
              subscription: subJson
            })
          }).catch(() => {});
        } catch {
          // ignore
        }
      }

      return subscription;
    } catch (err) {
      console.warn('PushManager subscribePush error:', err.message);
      return null;
    }
  },

  /**
   * Локальная отправка системного уведомления (когда PWA в активном процессе)
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
