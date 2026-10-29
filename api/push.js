// ==========================================================================
// VERCEL SERVERLESS FUNCTION: WEB PUSH NOTIFICATIONS DISPATCHER
// ==========================================================================
// Поддерживает:
//   1. Регистрацию подписок W3C PushManager (Chrome, Safari iOS 16.4+, Edge, Firefox)
//   2. Отправку Push-уведомлений по подпискам через FCM / APNs с защитой от дубликатов
//   3. Прием запросов из 3 источников:
//      - Прямой клиентский вызов из dispatchNotification()
//      - Supabase Database Webhook (настроенный в панели Supabase)
//      - Серверный pg_net триггер из PostgreSQL
//   4. Серверную проверку дедлайнов и планёрок по расписанию (Vercel Cron / On-demand)
// ==========================================================================

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// VAPID ключи для W3C Web Push Protocol
const vapidPublicKey  = process.env.VAPID_PUBLIC_KEY  || 'BPioFFDvLaqlDYXXedEYpXxOH1eBXgqgjcBr7okNukmmKMrfK1tbdXr1uviGiUTYfV2GPvx7joDDFMqU7vzs7ks';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'oI5vL_q2Nar9nEg8qVkGu7DY1ku9uXc3-IuDiFWl1bs';
const vapidEmail      = process.env.VAPID_EMAIL       || 'mailto:admin@school43.edu.kz';

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Серверный кэш дедупликации (защита от двойных пушей в окне 30 секунд)
const dedupeCache = new Map();

function isDuplicate(key) {
  const now = Date.now();
  for (const [k, timestamp] of dedupeCache.entries()) {
    if (now - timestamp > 60000) dedupeCache.delete(k);
  }
  if (dedupeCache.has(key)) return true;
  dedupeCache.set(key, now);
  return false;
}

// Поиск UUID пользователя (поддерживает и чистый UUID, и логин вроде 'director43')
async function resolveUserUuid(supabase, idOrLogin) {
  if (!idOrLogin) return null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(idOrLogin));
  if (isUuid) return String(idOrLogin);

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .or(`login.ilike.${idOrLogin},email.ilike.${idOrLogin}`)
      .maybeSingle();
    if (profile?.id) return profile.id;
  } catch (err) {
    console.warn('[push] Profile lookup warning:', err.message);
  }
  return String(idOrLogin);
}

export default async function handler(req, res) {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: либо публичный VAPID-ключ для браузера, либо запуск проверки дедлайнов
  if (req.method === 'GET') {
    const action = req.query?.action;
    if (action === 'check-deadlines') {
      return handleCheckDeadlines(res);
    }
    return res.status(200).json({ status: 'ok', publicKey: vapidPublicKey });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const body = req.body || {};
  const action = body.action || req.query?.action;

  const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

  // ── 1. РЕГИСТРАЦИЯ PUSH-ПОДПИСКИ УСТРОЙСТВА ─────────────────────────────
  if (action === 'subscribe') {
    const { userId, userLogin, subscription } = body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'Missing subscription payload' });
    }
    if (supabase) {
      try {
        const userUuid = await resolveUserUuid(supabase, userId || userLogin);

        const subData = {
          user_id:      userUuid || 'guest',
          endpoint:     subscription.endpoint,
          subscription: subscription,
          user_agent:   req.headers['user-agent'] || null,
          updated_at:   new Date().toISOString()
        };

        const { error: upsertErr } = await supabase
          .from('push_subscriptions')
          .upsert([subData], { onConflict: 'endpoint' });

        if (upsertErr) {
          console.warn('[push] Save sub error:', upsertErr.message);
          return res.status(400).json({ success: false, error: upsertErr.message });
        }

        return res.status(200).json({ success: true, message: 'Subscription registered', userId: userUuid });
      } catch (err) {
        console.warn('[push] Save sub error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
    }
    return res.status(200).json({ success: true, message: 'Supabase not configured' });
  }

  // ── 2. УДАЛЕНИЕ ПОДПИСКИ ────────────────────────────────────────────────
  if (action === 'unsubscribe') {
    const { subscription } = body;
    if (supabase && subscription?.endpoint) {
      try {
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
      } catch {}
    }
    return res.status(200).json({ success: true, message: 'Unsubscribed' });
  }

  // ── 3. ПРОВЕРКА ДЕДЛАЙНОВ (CRON / ON-DEMAND) ────────────────────────────
  if (action === 'check-deadlines') {
    return handleCheckDeadlines(res);
  }

  // ── 4. ОТПРАВКА WEB PUSH (ИЗ КЛИЕНТА, WEBHOOK ИЛИ ТРИГГЕРА) ──────────────
  // Универсальный парсинг входного формата:
  // а) Supabase Webhook payload: body.record
  // б) Прямой клиентский вызов: body.{ targetUserId, title, message... }
  const record = body.record || body;

  const rawTarget    = body.targetUserId || record.user_id || null;
  const targetRole   = body.targetRole   || null;
  const rawExclude   = body.excludeUserId || null;
  const title        = body.title        || record.title;
  const message      = body.message      || record.message;
  const taskId       = body.taskId       || record.task_id || null;
  const type         = body.type         || record.type || 'task';
  const customTag    = body.tag          || null;
  const notifId      = body.notifId      || record.id || null;
  const source       = body.source       || (body.record ? 'supabase_webhook' : 'client');

  if (!title) {
    return res.status(400).json({ error: 'Missing title' });
  }

  // Защита от дубликатов: проверяем окно 30 секунд
  const dedupeKey = notifId || `${rawTarget || targetRole || 'all'}_${taskId || 'none'}_${title}`;
  if (isDuplicate(dedupeKey)) {
    console.log(`[push] Suppressed duplicate push within 30s window: ${dedupeKey}`);
    return res.status(200).json({ sent: 0, duplicate: true, reason: 'Duplicate suppressed' });
  }

  if (!supabase) {
    return res.status(200).json({ warning: 'Supabase not configured' });
  }

  try {
    let query = supabase.from('push_subscriptions').select('*');

    if (rawTarget) {
      const targetUuid = await resolveUserUuid(supabase, rawTarget);
      query = query.eq('user_id', targetUuid);
    } else if (targetRole === 'all' || targetRole === 'teachers') {
      if (rawExclude) {
        const excludeUuid = await resolveUserUuid(supabase, rawExclude);
        query = query.not('user_id', 'eq', excludeUuid);
      }
    }

    const { data: subs, error: subErr } = await query;

    if (subErr) {
      console.warn('[push] Query subs error:', subErr.message);
      return res.status(500).json({ sent: 0, reason: 'DB query error: ' + subErr.message });
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ sent: 0, reason: 'No active device subscriptions found' });
    }

    // Детерминированный tag: исключает дубликаты на уровне ОС
    const tag = customTag || (taskId ? `school43-task-${taskId}` : `school43-notif-${notifId || type || 'general'}`);

    const payload = JSON.stringify({
      title,
      message,
      taskId: taskId  || null,
      type:   type    || 'task',
      url:    taskId ? `/?openTaskId=${taskId}&tab=tasks` : '/',
      tag:    tag
    });

    const results = await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(s.subscription, payload, {
            TTL:     86400, // 24ч на серверах FCM/APNs если телефон выключен/офлайн
            urgency: 'high' // высокий приоритет — мгновенное пробуждение экрана
          });
          return { success: true };
        } catch (err) {
          // Если токен устарел (404/410) — удаляем недействительную подписку
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('id', s.id).catch(() => {});
            console.log('[push] Removed expired subscription endpoint');
          } else {
            console.warn('[push] Send error:', err.statusCode, err.message);
          }
          throw err;
        }
      })
    );

    const sentCount   = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.length - sentCount;

    console.log(`[push] Sent ${sentCount}/${results.length} (source: ${source})`);
    return res.status(200).json({ sent: sentCount, failed: failedCount, total: subs.length, tag });

  } catch (err) {
    console.warn('[push] Handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── ФОНОВАЯ ПРОВЕРКА ДЕДЛАЙНОВ И ПЛАНЁРОК (ВЫЗЫВАЕТСЯ CRON ИЛИ КЛИЕНТОМ) ──
async function handleCheckDeadlines(res) {
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({ message: 'Supabase not configured for cron' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMs = new Date(todayStr).getTime();

  try {
    // 1. Загружаем активные задачи
    const { data: tasks, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .not('status', 'in', '("completed","cancelled")');

    if (taskErr) throw taskErr;

    let createdAlerts = 0;

    for (const task of (tasks || [])) {
      if (!task.deadline || !task.assigned_to_id) continue;

      const deadlineMs = new Date(task.deadline).getTime();
      const diffDays = Math.round((deadlineMs - todayMs) / (1000 * 60 * 60 * 24));

      let alertTitle = null;
      let alertMsg = null;
      let alertType = 'task';

      if (diffDays < 0) {
        alertTitle = '⚠️ Мерзімі өтті! / Срок истек';
        alertMsg = `«${task.title}» бойынша дедлайн (${task.deadline}) өтті!`;
        alertType = 'urgent';
      } else if (diffDays === 0) {
        alertTitle = '⏰ Бүгін дедлайн / Срок сдачи сегодня';
        alertMsg = `«${task.title}» — бүгін соңғы күн!`;
        alertType = 'urgent';
      }

      if (alertTitle) {
        // Проверяем, не отправляли ли уже сегодня оповещение по этой задаче
        const startOfDay = `${todayStr}T00:00:00.000Z`;
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('task_id', task.id)
          .eq('user_id', task.assigned_to_id)
          .gte('created_at', startOfDay)
          .limit(1);

        if (!existing || existing.length === 0) {
          // Создаем запись в notifications
          await supabase.from('notifications').insert([{
            user_id: task.assigned_to_id,
            task_id: task.id,
            title: alertTitle,
            message: alertMsg,
            type: alertType,
            is_read: false
          }]);

          // Находим push-подписку и отправляем Web Push
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', task.assigned_to_id);

          if (subs && subs.length > 0) {
            const pushPayload = JSON.stringify({
              title: alertTitle,
              message: alertMsg,
              taskId: task.id,
              type: alertType,
              url: `/?openTaskId=${task.id}&tab=tasks`,
              tag: `school43-deadline-${task.id}-${todayStr}`
            });

            for (const s of subs) {
              try {
                await webpush.sendNotification(s.subscription, pushPayload, { TTL: 43200, urgency: 'high' });
              } catch {}
            }
          }

          createdAlerts++;
        }
      }
    }

    return res.status(200).json({ success: true, date: todayStr, alertsDispatched: createdAlerts });

  } catch (err) {
    console.warn('[check-deadlines] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
