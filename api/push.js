// ==========================================================================
// VERCEL SERVERLESS FUNCTION: WEB PUSH NOTIFICATIONS DISPATCHER
// ==========================================================================
// Отправка системных уведомлений по стандарту W3C Web Push Protocol (FCM / APNs)
// Доставляет уведомления даже при выключенном экране телефона и закрытом браузере.

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BPioFFDvLaqlDYXXedEYpXxOH1eBXgqgjcBr7okNukmmKMrfK1tbdXr1uviGiUTYfV2GPvx7joDDFMqU7vzs7ks';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'oI5vL_q2Nar9nEg8qVkGu7DY1ku9uXc3-IuDiFWl1bs';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@school43.edu.kz';

webpush.setVapidDetails(
  vapidEmail,
  vapidPublicKey,
  vapidPrivateKey
);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  // CORS заголовки для вызова из PWA / браузера
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Публичный ключ для подписки браузера
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', publicKey: vapidPublicKey });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { action, userId, subscription, targetUserId, targetRole, title, message, taskId, type } = req.body || {};

  const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

  // 1. РЕГИСТРАЦИЯ ИЛИ ОБНОВЛЕНИЕ ПОДПИСКИ УСТРОЙСТВА
  if (action === 'subscribe') {
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Missing subscription payload' });
    }
    if (supabase && userId) {
      try {
        await supabase.from('push_subscriptions').upsert([{
          user_id: userId,
          endpoint: subscription.endpoint,
          subscription: subscription,
          updated_at: new Date().toISOString()
        }], { onConflict: 'endpoint' });
      } catch (err) {
        console.warn('Save push sub error:', err.message);
      }
    }
    return res.status(200).json({ success: true, message: 'Push subscription registered' });
  }

  // 2. ОТПРАВКА НАСТОЯЩЕГО WEB PUSH ЧЕРЕЗ FCM / APNs
  if (!title) {
    return res.status(400).json({ error: 'Missing title' });
  }

  if (!supabase) {
    return res.status(200).json({ warning: 'Supabase credentials not configured in environment' });
  }

  try {
    let query = supabase.from('push_subscriptions').select('*');

    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: subs, error: subErr } = await query;
    if (subErr || !subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, reason: 'No subscriptions found for target' });
    }

    const payload = JSON.stringify({
      title,
      message,
      taskId: taskId || null,
      type: type || 'task',
      url: taskId ? `/?openTaskId=${taskId}&tab=tasks` : '/',
      tag: `school43-${taskId || 'push'}-${Date.now()}`
    });

    const results = await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(s.subscription, payload, {
            TTL: 86400, // Сообщение хранится на серверах Google/Apple до 24 часов
            urgency: 'high'
          });
          return { success: true, id: s.id };
        } catch (err) {
          // Если endpoint устарел (пользователь удалил PWA или сбросил права) — удаляем из базы
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id);
          }
          throw err;
        }
      })
    );

    const sentCount = results.filter(r => r.status === 'fulfilled').length;
    return res.status(200).json({ sent: sentCount, total: subs.length });
  } catch (err) {
    console.warn('WebPush send error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
