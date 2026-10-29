// ==========================================================================
// СЕРВИС УВЕДОМЛЕНИЙ КГУ «СШ № 43» (W3C WEB PUSH, PWA И СЕРВИС-ВОРКЕР)
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
   * Проверка текущего статуса разрешения
   */
  getPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  /**
   * Проверка поддержки W3C Web Push в текущем браузере
   */
  isPushSupported() {
    return ('serviceWorker' in navigator) && ('PushManager' in window);
  },

  /**
   * Регистрация браузера/смартфона в W3C PushManager (FCM / APNs)
   * Позволяет доставлять системные уведомления при выключенном экране и закрытом приложении
   */
  async subscribePush(userOrId, optionalLogin = null) {
    if (!this.isPushSupported()) {
      console.warn('[Push] ServiceWorker или PushManager не поддерживаются в этом браузере.');
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

      // Извлекаем userId и userLogin из объекта или аргументов
      let userId = null;
      let userLogin = optionalLogin;

      if (typeof userOrId === 'object' && userOrId !== null) {
        userId = userOrId.id || userOrId.login;
        userLogin = userOrId.login || optionalLogin;
      } else {
        userId = userOrId;
      }

      if (subscription && userId) {
        const subJson = subscription.toJSON();
        const idValue = String(userId);
        const loginValue = userLogin ? String(userLogin).toLowerCase() : null;

        // 1. Сохраняем подписку через Vercel Serverless Function /api/push
        try {
          await fetch('/api/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'subscribe',
              userId: idValue,
              userLogin: loginValue,
              subscription: subJson
            })
          });
        } catch (fetchErr) {
          console.warn('[Push] /api/push subscribe notice:', fetchErr.message);
        }

        // 2. Прямой upsert в Supabase push_subscriptions (при наличии подключения)
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.from('push_subscriptions').upsert([{
              user_id: idValue,
              user_login: loginValue,
              endpoint: subscription.endpoint,
              subscription: subJson,
              user_agent: navigator.userAgent,
              updated_at: new Date().toISOString()
            }], { onConflict: 'endpoint' });
          } catch (e) {
            console.warn('[Push] Supabase push_subscriptions notice:', e.message);
          }
        }
      }

      return subscription;
    } catch (err) {
      console.warn('PushManager subscribePush error:', err.message);
      return null;
    }
  },

  /**
   * Отправка настоящего серверного Web Push на текущее устройство
   * Позволяет проверить приход уведомления при выключенном экране телефона
   */
  async sendTestWebPush(currentUser, delaySeconds = 0) {
    if (!currentUser) return { success: false, error: 'Пользователь не авторизован' };

    const targetUserId = currentUser.id || currentUser.login;

    if (delaySeconds > 0) {
      // Задержка: даем пользователю время заблокировать экран телефона
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }

    try {
      const response = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          title: '🔔 Тест Web Push: КГУ «СШ № 43»',
          message: 'Web Push доставлен! Работает даже при заблокированном экране и закрытом браузере.',
          type: 'test',
          tag: `school43-test-${Date.now()}`
        })
      });
      const data = await response.json();
      return { success: true, ...data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Локальное системное уведомление (резервный fallback только для автономного режима без интернета)
   */
  async send(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }

    const taskId = options.taskId || null;
    const body = options.body || '';
    const targetUrl = taskId ? `/?openTaskId=${taskId}&tab=tasks` : '/';
    const tag = options.tag || (taskId ? `school43-local-${taskId}` : `school43-local-${Date.now()}`);

    const notifOptions = {
      body,
      icon: '/school43logo.png',
      badge: '/badge-96x96.png',
      vibrate: [250, 100, 250],
      tag,
      renotify: false,
      requireInteraction: false,
      data: {
        url: targetUrl,
        taskId: taskId,
        tab: 'tasks'
      }
    };

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notifOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('SW showNotification fallback:', swErr?.message);
      }
    }

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
