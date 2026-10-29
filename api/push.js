// ==========================================================================
// VERCEL SERVERLESS FUNCTION: WEB PUSH NOTIFICATIONS DISPATCHER
// ==========================================================================
// Получает запросы из двух источников:
//   1. Клиентский вызов из dispatchNotification() — когда браузер открыт
//   2. Серверный pg_net триггер из PostgreSQL — работает даже при закрытом браузере!

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY  || 'BPioFFDvLaqlDYXXedEYpXxOH1eBXgqgjcBr7okNukmmKMrfK1tbdXr1uviGiUTYfV2GPvx7joDDFMqU7vzs7ks';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'oI5vL_q2Nar9nEg8qVkGu7DY1ku9uXc3-IuDiFWl1bs';
const vapidEmail      = process.env.VAPID_EMAIL       || 'mailto:admin@school43.edu.kz';

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — возвращаем публичный VAPID ключ для подписки браузера
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', publicKey: vapidPublicKey });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const body = req.body || {};
  const { action, userId, subscription, targetUserId, targetRole, title, message, taskId, type, source } = body;

  const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

  // ── 1. РЕГИСТРАЦИЯ PUSH-ПОДПИСКИ УСТРОЙСТВА ─────────────────────────────
  if (action === 'subscribe') {
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'Missing subscription payload' });
    }
    if (supabase && userId) {
      try {
        await supabase.from('push_subscriptions').upsert([{
          user_id:      userId,
          endpoint:     subscription.endpoint,
          subscription: subscription,
          updated_at:   new Date().toISOString()
        }], { onConflict: 'endpoint' });
      } catch (err) {
        console.warn('[push] Save sub error:', err.message);
      }
    }
    return res.status(200).json({ success: true, message: 'Push subscription registered' });
  }

  // ── 2. ОТПРАВКА WEB PUSH ─────────────────────────────────────────────────
  if (!title) {
    return res.status(400).json({ error: 'Missing title' });
  }

  if (!supabase) {
    return res.status(200).json({ warning: 'Supabase not configured' });
  }

  try {
    // Запрашиваем подписки для конкретного пользователя или всех
    let query = supabase.from('push_subscriptions').select('*');
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: subs, error: subErr } = await query;

    if (subErr) {
      console.warn('[push] Query subs error:', subErr.message);
      return res.status(200).json({ sent: 0, reason: 'DB query error' });
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, reason: 'No subscriptions found' });
    }

    const payload = JSON.stringify({
      title,
      message,
      taskId: taskId  || null,
      type:   type    || 'task',
      url:    taskId ? `/?openTaskId=${taskId}&tab=tasks` : '/',
      tag:    `school43-${taskId || 'push'}-${Date.now()}`
    });

    const results = await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(s.subscription, payload, {
            TTL:     86400, // до 24ч на серверах FCM/APNs если устройство офлайн
            urgency: 'high'
          });
          return { success: true };
        } catch (err) {
          // Подписка устарела — удаляем из БД
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id).catch(() => {});
            console.log('[push] Removed expired subscription:', s.endpoint?.slice(0, 60));
          } else {
            console.warn('[push] sendNotification error:', err.statusCode, err.message);
          }
          throw err;
        }
      })
    );

    const sentCount   = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.length - sentCount;

    console.log(`[push] Sent ${sentCount}/${results.length}, source: ${source || 'client'}`);
    return res.status(200).json({ sent: sentCount, failed: failedCount, total: subs.length });

  } catch (err) {
    console.warn('[push] Handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
