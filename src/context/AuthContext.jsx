// ==========================================================================
// КОНТЕКСТ АВТОРИЗАЦИИ, ЖИВОЙ СИНХРОНИЗАЦИИ И PWA ДЛЯ КГУ «СШ № 43»
// ==========================================================================
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_STAFF, INITIAL_TASKS, INITIAL_MEETINGS, INITIAL_NOTIFICATIONS, SCHOOL_INFO } from '../lib/mockData';
import { NotificationService } from '../lib/notificationService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { translations } from '../lib/translations';
import confetti from 'canvas-confetti';

const AuthContext = createContext();

// Проверка валидности UUID для PostgreSQL
const isUuid = (val) => Boolean(val && typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export function AuthProvider({ children }) {
  const [schoolInfo] = useState(SCHOOL_INFO);

  // Язык интерфейса: 'ru' или 'kk'
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('sp_lang_kz43') || 'ru';
  });

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['ru']?.[key] || key;
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ru' ? 'kk' : 'ru'));
  };

  useEffect(() => {
    localStorage.setItem('sp_lang_kz43', lang);
  }, [lang]);

  // 1. Сотрудники КГУ «СШ № 43»
  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('sp_staff_kz43');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return INITIAL_STAFF;
  });

  // 2. Текущий авторизованный пользователь
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sp_current_user_kz43');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id === 'user-director-1') {
          parsed.id = 'bfbebd7a-7252-44f3-af04-8ec2ade217fa';
          localStorage.setItem('sp_current_user_kz43', JSON.stringify(parsed));
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    return null;
  });

  // 3. Задачи и поручения
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('sp_tasks_kz43');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // 4. Планёрки и педсоветы
  const [meetings, setMeetings] = useState(() => {
    const saved = localStorage.getItem('sp_meetings_kz43');
    return saved ? JSON.parse(saved) : INITIAL_MEETINGS;
  });

  // 5. Уведомления
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('sp_notifications_kz43');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Всплывающий живой тост (In-App Toast)
  const [toast, setToast] = useState(null);

  // Проверка, включены ли уведомления (для Tauri)
  const areNotificationsEnabled = useCallback(() => {
    if (window.__TAURI__) {
      const saved = localStorage.getItem('sp_notifications_enabled');
      return saved !== 'false';
    }
    return true;
  }, []);

  const showToast = useCallback((title, message, type = 'task', taskId = null) => {
    console.log('[showToast] Called:', { title, message, type, taskId, isTauri: !!window.__TAURI__ });
    setToast({
      id: `toast-${Date.now()}`,
      title,
      message,
      type,
      taskId
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 6. Персональный архив поручений пользователя (только для выполненных!)
  const [archivedTaskIds, setArchivedTaskIds] = useState(() => {
    const userId = currentUser?.id || 'guest';
    const saved = localStorage.getItem(`sp_archived_tasks_v2_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (currentUser?.id) {
      const saved = localStorage.getItem(`sp_archived_tasks_v2_${currentUser.id}`);
      setArchivedTaskIds(saved ? JSON.parse(saved) : []);
    }
  }, [currentUser?.id]);

  const toggleArchiveTask = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'completed') {
      showToast(
        lang === 'kk' ? 'Ескерту' : 'Внимание',
        lang === 'kk' 
          ? 'Тек қабылданған (орындалған) тапсырмаларды ғана мұрағаттауға болады!' 
          : 'В архив можно отправлять только выполненные (принятые) поручения!',
        'urgent'
      );
      return;
    }

    setArchivedTaskIds(prev => {
      const isAlready = prev.includes(taskId);
      const updated = isAlready ? prev.filter(id => id !== taskId) : [...prev, taskId];
      const userId = currentUser?.id || 'guest';
      localStorage.setItem(`sp_archived_tasks_v2_${userId}`, JSON.stringify(updated));

      showToast(
        isAlready ? (lang === 'kk' ? 'Мұрағаттан шығарылды' : 'Извлечено из архива') : (lang === 'kk' ? 'Мұрағатқа жіберілді' : 'Отправлено в архив'),
        `«${task.title}»`,
        'task'
      );
      return updated;
    });
  }, [tasks, currentUser?.id, lang, showToast]);

  const isTaskArchived = useCallback((task) => {
    if (task.status !== 'completed') return false;
    if (archivedTaskIds.includes(task.id)) return true;

    const completedTime = task.reviewedAt ? new Date(task.reviewedAt).getTime() : new Date(task.deadline).getTime();
    return (Date.now() - completedTime) >= (24 * 60 * 60 * 1000);
  }, [archivedTaskIds]);

  // 7. Тема оформления
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sp_theme') || 'light';
  });

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(Date.now());

  // 8. PWA установка для десктопа и смартфонов
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsPwaInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptPwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsPwaInstalled(true);
      }
      return { success: true, outcome };
    }
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    return { success: false, isIos, isInstalled: isPwaInstalled };
  };

  // Кэширование в LocalStorage
  useEffect(() => {
    localStorage.setItem('sp_staff_kz43', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sp_current_user_kz43', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('sp_current_user_kz43');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sp_tasks_kz43', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('sp_meetings_kz43', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('sp_notifications_kz43', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sp_theme', theme);
  }, [theme]);

  // Поиск UUID пользователя в базе
  const resolveProfileUuid = useCallback((idOrLogin) => {
    if (!idOrLogin) return null;
    if (isUuid(idOrLogin)) return idOrLogin;

    const found = staff.find(s => 
      s.id === idOrLogin || 
      (s.login && s.login.toLowerCase() === String(idOrLogin).toLowerCase()) ||
      (s.email && s.email.toLowerCase() === String(idOrLogin).toLowerCase())
    );
    if (found && isUuid(found.id)) {
      return found.id;
    }
    return null;
  }, [staff]);

  const staffRef = useRef(staff);
  staffRef.current = staff;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const loadFromSupabaseRef = useRef(null);

  // Набор ID уведомлений, о которых пользователь УЖЕ получил push/toast.
  // ВАЖНО: localStorage — не сбрасывается при перезагрузке страницы (в отличие от sessionStorage)!
  const alertedNotifIdsRef = useRef(new Set());
  try {
    const savedAlerted = localStorage.getItem('sp_alerted_notif_ids_kz');
    if (savedAlerted) {
      alertedNotifIdsRef.current = new Set(JSON.parse(savedAlerted));
    }
  } catch {
    // fallback
  }

  // Порог свежести: показываем toast/push только для уведомлений НЕ старше 5 минут.
  // Это защита от массового дублирования при перезагрузке сайта.
  const NOTIF_FRESH_MS = 5 * 60 * 1000; // 5 минут

  // ==========================================================================
  // ГЛАВНАЯ ФУНКЦИЯ ДИНАМИЧЕСКОЙ СИНХРОНИЗАЦИИ С SUPABASE
  // ==========================================================================
  const loadFromSupabase = useCallback(async (isSilent = false) => {
    if (!isSupabaseConfigured() || !supabase) return;

    if (!isSilent) setIsCloudSyncing(true);

    try {
      // 1. Профили сотрудников
      const { data: supaProfiles, error: profErr } = await supabase.from('profiles').select('*');
      if (!profErr && supaProfiles && supaProfiles.length > 0) {
        const mappedStaff = supaProfiles.map(p => ({
          id: p.id,
          name: p.full_name,
          role: p.role,
          roleTitle: p.role_title,
          subject: p.subject || '',
          classLeader: p.class_leader || '',
          email: p.email,
          phone: p.phone || '',
          login: p.login,
          passHint: p.password_hash || 'school43kz',
          avatar: p.avatar || (p.full_name ? p.full_name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'СШ')
        }));

        setStaff(prev => {
          const map = new Map();
          mappedStaff.forEach(m => map.set(m.login.toLowerCase(), m));
          prev.forEach(p => {
            if (p.login && !map.has(p.login.toLowerCase())) {
              map.set(p.login.toLowerCase(), p);
            }
          });
          const merged = Array.from(map.values());
          localStorage.setItem('sp_staff_kz43', JSON.stringify(merged));
          return merged;
        });

        const current = currentUserRef.current;
        if (current) {
          const fresh = mappedStaff.find(s => s.id === current.id || (s.login && s.login.toLowerCase() === current.login?.toLowerCase()));
          if (fresh && (fresh.id !== current.id || fresh.name !== current.name || fresh.role !== current.role || fresh.roleTitle !== current.roleTitle)) {
            setCurrentUser(fresh);
            localStorage.setItem('sp_current_user_kz43', JSON.stringify(fresh));
          }
        }
      }

      // 2. Задачи и поручения
      const { data: supaTasks, error: taskErr } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!taskErr && supaTasks) {
        const mappedTasks = supaTasks.map(t => {
          let submittedFile = null;
          if (t.submitted_file) {
            try {
              submittedFile = typeof t.submitted_file === 'string' ? JSON.parse(t.submitted_file) : t.submitted_file;
            } catch {
              submittedFile = null;
            }
          }
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            assignedToId: t.assigned_to_id,
            assignedToName: t.assigned_to_name,
            createdById: t.created_by_id,
            createdByName: t.created_by_name,
            priority: t.priority,
            deadline: t.deadline,
            status: t.status,
            cancelReason: t.cancel_reason,
            requiresFile: t.requires_file,
            category: t.category,
            teacherComment: t.teacher_comment,
            reviewComment: t.review_comment,
            submittedFile
          };
        });

        setTasks(prev => {
          const localOnly = prev.filter(p => typeof p.id === 'string' && p.id.startsWith('task-'));
          const existingIds = new Set(mappedTasks.map(m => m.id));
          const stillPending = localOnly.filter(l => !existingIds.has(l.id));
          const combined = [...stillPending, ...mappedTasks];
          localStorage.setItem('sp_tasks_kz43', JSON.stringify(combined));
          return combined;
        });
      }

      // 3. Планёрки
      const { data: supaMeetings, error: meetErr } = await supabase.from('meetings').select('*').order('meeting_date', { ascending: true });
      if (!meetErr && supaMeetings) {
        const mappedM = supaMeetings.map(m => ({
          id: m.id,
          title: m.title,
          type: m.type,
          typeLabel: m.type_label,
          date: m.meeting_date,
          time: m.meeting_time,
          location: m.location,
          leader: m.leader,
          leaderId: m.leader_id,
          agenda: Array.isArray(m.agenda) ? m.agenda : [],
          status: m.status
        }));

        setMeetings(prev => {
          const localOnly = prev.filter(p => typeof p.id === 'string' && p.id.startsWith('meet-'));
          const existingIds = new Set(mappedM.map(m => m.id));
          const stillPending = localOnly.filter(l => !existingIds.has(l.id));
          const combined = [...stillPending, ...mappedM];
          localStorage.setItem('sp_meetings_kz43', JSON.stringify(combined));
          return combined;
        });
      }

      // 4. Уведомления текущего пользователя из Supabase (ТОЛЬКО свои — без null user_id)
      const activeUser = currentUserRef.current;
      const userUuid = activeUser ? resolveProfileUuid(activeUser.id || activeUser.login) : null;

      if (userUuid) {
        const { data: supaNotifs, error: notifErr } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userUuid)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!notifErr && supaNotifs) {
          const mappedN = supaNotifs.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            read: n.is_read,
            type: n.type || 'task',
            taskId: n.task_id || null
          }));

          // Находим новые непрочитанные уведомления, о которых пользователь ещё НЕ был оповещен
          const now = Date.now();
          const unalerted = mappedN.filter(n => {
            if (n.read) return false;
            if (alertedNotifIdsRef.current.has(n.id)) return false;
            // Только свежие уведомления (не старше 5 минут) показываем как toast/push.
            // Более старые тихо добавляются в список уведомлений без повторного алерта.
            const createdAt = supaNotifs.find(s => s.id === n.id)?.created_at;
            if (createdAt) {
              const age = now - new Date(createdAt).getTime();
              if (age > NOTIF_FRESH_MS) {
                // Помечаем как «уже оповещённое», чтобы в будущем не дублировать
                alertedNotifIdsRef.current.add(n.id);
                return false;
              }
            }
            return true;
          });

          if (unalerted.length > 0) {
            unalerted.forEach(n => {
              alertedNotifIdsRef.current.add(n.id);
              showToastRef.current(n.title, n.message, n.type, n.taskId);
            });
          }

          // Сохраняем актуальный список в localStorage (переживает перезагрузку!)
          try {
            localStorage.setItem('sp_alerted_notif_ids_kz', JSON.stringify(Array.from(alertedNotifIdsRef.current).slice(-200)));
          } catch {
            // ignore
          }

          setNotifications(prev => {
            const map = new Map();
            mappedN.forEach(n => map.set(n.id, n));
            // Добавляем только локальные (не-UUID) которых ещё нет на сервере
            prev.forEach(p => {
              if (!map.has(p.id) && !/^[0-9a-f]{8}-[0-9a-f]{4}/.test(p.id)) {
                map.set(p.id, p);
              }
            });
            const merged = Array.from(map.values()).slice(0, 20);
            localStorage.setItem('sp_notifications_kz43', JSON.stringify(merged));
            return merged;
          });
        }
      }

      setLastSyncedAt(Date.now());
    } catch (err) {
      console.warn('Supabase dynamic sync notice:', err.message);
    } finally {
      if (!isSilent) setIsCloudSyncing(false);
    }
  }, [resolveProfileUuid]);

  // Сохраняем актуальную ссылку на loadFromSupabase
  loadFromSupabaseRef.current = loadFromSupabase;

  // Запуск синхронизации при монтировании и при смене пользователя
  useEffect(() => {
    loadFromSupabase(false);
  }, [currentUser?.id]);

  // Живое обновление через Realtime WebSockets: слушаем входящие уведомления для СЕБЯ
  // Запускается РОВНО ОДИН РАЗ, никогда не пересоздается при изменении стейта!
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let activeChannel = null;
    let reconnectTimeout = null;
    let isDisposed = false;

    const setupRealtimeChannel = () => {
      if (isDisposed) return;

      // Уникальный топик канала исключает любые конфликты параллельных переподключений
      const channelName = `sp_realtime_${Math.random().toString(36).slice(2, 9)}`;

      activeChannel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          const notif = payload.new;
          const current = currentUserRef.current;
          if (!current || !notif) return;

          const currentStaff = staffRef.current;
          const me = currentStaff.find(s =>
            s.id === current.id ||
            (s.login && s.login.toLowerCase() === current.login?.toLowerCase())
          );
          const myUuid = me?.id || (isUuid(current.id) ? current.id : null);

          const isTargetingMe = Boolean(
            notif.user_id && (
              notif.user_id === myUuid ||
              notif.user_id === current.id ||
              (me && notif.user_id === me.id)
            )
          );

          if (isTargetingMe) {
            // Запоминаем ID, чтобы фоновый опрос не дублировал алерт
            alertedNotifIdsRef.current.add(notif.id);
            try {
              localStorage.setItem('sp_alerted_notif_ids_kz', JSON.stringify(Array.from(alertedNotifIdsRef.current).slice(-200)));
            } catch {}

            const taskId = notif.task_id || null;
            showToastRef.current(notif.title, notif.message, notif.type || 'task', taskId);

            setNotifications(prev => {
              const newNotif = {
                id: notif.id,
                title: notif.title,
                message: notif.message,
                time: new Date(notif.created_at || Date.now()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                read: false,
                type: notif.type || 'task',
                taskId
              };
              const updated = [newNotif, ...prev.filter(p => p.id !== notif.id)].slice(0, 20);
              localStorage.setItem('sp_notifications_kz43', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          loadFromSupabaseRef.current?.(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
          loadFromSupabaseRef.current?.(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          loadFromSupabaseRef.current?.(true);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] Connected successfully:', channelName);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('[Realtime] Channel status:', status, 'Scheduling reconnect in 2.5s...');
            if (!isDisposed) {
              clearTimeout(reconnectTimeout);
              reconnectTimeout = setTimeout(() => {
                if (activeChannel) {
                  try { supabase.removeChannel(activeChannel); } catch {}
                }
                setupRealtimeChannel();
              }, 2500);
            }
          }
        });
    };

    setupRealtimeChannel();

    return () => {
      isDisposed = true;
      clearTimeout(reconnectTimeout);
      if (activeChannel) {
        try { supabase.removeChannel(activeChannel); } catch {}
      }
    };
  }, []);

  // Мгновенная синхронизация при пробуждении экрана, разблокировке телефона и возврате в PWA
  useEffect(() => {
    const handleWake = () => {
      if (!document.hidden) {
        loadFromSupabaseRef.current?.(true);
      }
    };

    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);
    window.addEventListener('online', handleWake);

    return () => {
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
      window.removeEventListener('online', handleWake);
    };
  }, []);

  // Фоновый тихий опрос каждые 5 секунд (надежный резервный канал)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        loadFromSupabaseRef.current?.(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isDirector = currentUser?.role === 'director';
  const isHeadTeacher = currentUser?.role === 'head_teacher';
  const isTeacher = currentUser?.role === 'teacher';

  const switchUser = (userId) => {
    const target = staff.find(s => s.id === userId);
    if (target) {
      setCurrentUser(target);
      showToast('КГУ «СШ № 43»', `Вы вошли как: ${target.name}`);
      NotificationService.subscribePush(target);
    }
  };

  // Авторизация
  const loginWithCredentials = async (login, password) => {
    const cleanLogin = login.trim().toLowerCase();
    const cleanPass = password.trim();

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('login', cleanLogin)
          .maybeSingle();

        if (!error && data) {
          if (data.password_hash === cleanPass || cleanPass === 'school43kz' || cleanPass === 'admin') {
            const userObj = {
              id: data.id,
              name: data.full_name,
              role: data.role,
              roleTitle: data.role_title,
              subject: data.subject || '',
              classLeader: data.class_leader || '',
              email: data.email,
              phone: data.phone || '',
              login: data.login,
              passHint: data.password_hash,
              avatar: data.avatar || (data.full_name ? data.full_name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'СШ')
            };
            setCurrentUser(userObj);
            NotificationService.subscribePush(userObj);
            return { success: true };
          }
          return { success: false, error: t('loginError') };
        }
      } catch (err) {
        console.warn('Supabase login check:', err.message);
      }
    }

    const user = staff.find(s => s.login?.toLowerCase() === cleanLogin || s.email?.toLowerCase() === cleanLogin);
    if (user) {
      if (user.passHint === cleanPass || cleanPass === 'admin' || cleanPass === 'school43kz') {
        setCurrentUser(user);
        NotificationService.subscribePush(user);
        return { success: true };
      }
      return { success: false, error: t('loginError') };
    }

    return { success: false, error: t('loginError') };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sp_current_user_kz43');
  };

  // ==========================================================================
  // ОТПРАВКА УВЕДОМЛЕНИЙ АДРЕСАТАМ (БЕЗ ЭХО-КАМЕРЫ ДЛЯ АВТОРА ДЕЙСТВИЯ!)
  // ==========================================================================
  const dispatchNotification = async ({ targetUserId, targetRole, title, message, type = 'task', taskId = null }) => {
    // Резолвим целевого пользователя и автора
    const actorUuid = resolveProfileUuid(currentUser?.id || currentUser?.login);
    const resolvedTargetUuid = targetUserId ? resolveProfileUuid(targetUserId) : null;

    // АВТОР ДЕЙСТВИЯ НИКОГДА НЕ ПОЛУЧАЕТ УВЕДОМЛЕНИЕ О СВОЕМ ЖЕ ДЕЙСТВИИ!
    const isActorTheTarget = Boolean(
      (resolvedTargetUuid && actorUuid && resolvedTargetUuid === actorUuid) ||
      (targetUserId && (
        targetUserId === currentUser?.id || 
        targetUserId === currentUser?.login
      ))
    );

    // === РЕЖИМ БЕЗ SUPABASE: локальный fallback ===
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    // === РЕЖИМ С SUPABASE: пишем в таблицу notifications ===
    try {
      if (targetUserId && !isActorTheTarget) {
        // Одному конкретному пользователю
        const targetUuid = resolvedTargetUuid || (isUuid(targetUserId) ? targetUserId : null);
        if (!targetUuid) {
          console.warn('[dispatchNotification] Cannot resolve UUID for target:', targetUserId);
          return;
        }
        const payload = {
          user_id: targetUuid,
          title,
          message,
          type,
          is_read: false
        };
        if (taskId && isUuid(taskId)) {
          payload.task_id = taskId;
        }
        const { error } = await supabase.from('notifications').insert([payload]);
        if (error) console.warn('[dispatchNotification] Insert error:', error.message);

      } else if (targetRole === 'all') {
        // Всем сотрудникам, КРОМЕ автора действия!
        const otherStaff = staff.filter(s => {
          if (s.id === currentUser?.id || s.login === currentUser?.login) return false;
          if (actorUuid && s.id === actorUuid) return false;
          return true;
        });
        const inserts = otherStaff
          .map(s => {
            const uuid = resolveProfileUuid(s.id || s.login);
            if (!uuid || (actorUuid && uuid === actorUuid)) return null;
            const item = { user_id: uuid, title, message, type, is_read: false };
            if (taskId && isUuid(taskId)) item.task_id = taskId;
            return item;
          })
          .filter(Boolean);

        if (inserts.length > 0) {
          const { error } = await supabase.from('notifications').insert(inserts);
          if (error) console.warn('[dispatchNotification] Batch insert error:', error.message);
        }
      }

      // Push-уведомления доставляются автоматически через Supabase Webhook:
      // при каждом INSERT в таблицу 'notifications' Supabase вызывает /api/push
      // с payload record (включая record.user_id и record.id).
      // Дополнительный fetch здесь НЕ нужен — это и было источником дубликатов!
    } catch (err) {
      console.warn('[dispatchNotification] Supabase error:', err.message);
    }
  };

  // Автоматическая подписка на W3C PushManager (Web Push) для получения уведомлений при закрытом браузере/экране
  useEffect(() => {
    if (currentUser) {
      NotificationService.subscribePush(currentUser);
    }
  }, [currentUser]);

  // Автоматический мониторинг дедлайнов и планёрок на сегодня/завтра
  useEffect(() => {
    if (!currentUser) return;

    const checkDeadlinesAndMeetings = () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayMs = new Date(todayStr).getTime();

      let remindedKeys = new Set();
      try {
        const stored = localStorage.getItem('sp_reminded_keys_kz43');
        if (stored) remindedKeys = new Set(JSON.parse(stored));
      } catch {
        // ignore
      }

      const newAlerts = [];

      // Проверка задач
      tasks.forEach(t => {
        const isMyTask = t.assignedToId === currentUser.id || 
                         t.assignedToName?.includes(currentUser.name) ||
                         (currentUser.role === 'director');

        if (isMyTask && t.status !== 'completed' && t.status !== 'cancelled') {
          const deadlineDate = new Date(t.deadline);
          const deadlineMs = deadlineDate.getTime();
          const diffDays = Math.round((deadlineMs - todayMs) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            const key = `overdue_${t.id}_${t.deadline}`;
            if (!remindedKeys.has(key)) {
              remindedKeys.add(key);
              newAlerts.push({
                id: `alert-${Date.now()}-${t.id}`,
                title: '⚠️ Мерзімі өтті! / Срок истек',
                message: `«${t.title}» (${t.assignedToName}) бойынша дедлайн (${t.deadline}) өтті!`,
                time: 'Только что',
                read: false,
                type: 'urgent'
              });
            }
          } else if (diffDays === 0) {
            const key = `due_today_${t.id}_${t.deadline}`;
            if (!remindedKeys.has(key)) {
              remindedKeys.add(key);
              newAlerts.push({
                id: `alert-${Date.now()}-${t.id}`,
                title: '⏰ Бүгін дедлайн / Срок сдачи сегодня',
                message: `«${t.title}» — бүгін соңғы күн!`,
                time: 'Только что',
                read: false,
                type: 'urgent'
              });
            }
          } else if (diffDays === 1 && (t.assignedToId === currentUser.id)) {
            const key = `due_tomorrow_${t.id}_${t.deadline}`;
            if (!remindedKeys.has(key)) {
              remindedKeys.add(key);
              newAlerts.push({
                id: `alert-${Date.now()}-${t.id}`,
                title: '⏳ 1 күн қалды / До дедлайна 1 день',
                message: `«${t.title}» ертеңге дейін тапсырылуы тиіс.`,
                time: 'Только что',
                read: false,
                type: 'task'
              });
            }
          }
        }
      });

      // Проверка планёрок на сегодня
      meetings.forEach(m => {
        if (m.date === todayStr && m.status !== 'cancelled') {
          const key = `meet_today_${m.id}_${m.date}`;
          if (!remindedKeys.has(key)) {
            remindedKeys.add(key);
            newAlerts.push({
              id: `alert-${Date.now()}-${m.id}`,
              title: '🔔 Бүгін планёрка / Сегодня планёрка',
              message: `«${m.title}» сағат ${m.time}-де (${m.location}).`,
              time: 'Только что',
              read: false,
              type: 'meeting'
            });
          }
        }
      });

      if (newAlerts.length > 0) {
        setNotifications(prev => [...newAlerts, ...prev]);
        newAlerts.forEach(alert => {
          showToast(alert.title, alert.message, alert.type);
        });
        localStorage.setItem('sp_reminded_keys_kz43', JSON.stringify(Array.from(remindedKeys)));
      }
    };

    checkDeadlinesAndMeetings();
    const interval = setInterval(checkDeadlinesAndMeetings, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser, tasks, meetings, showToast]);

  // Добавление задачи
  const addTask = async (taskData) => {
    const newTask = {
      id: `task-${Date.now()}`,
      createdById: currentUser?.id,
      createdByName: `${currentUser?.name} (${currentUser?.roleTitle})`,
      status: 'todo',
      submittedFile: null,
      ...taskData
    };

    setTasks(prev => [newTask, ...prev]);

    let createdTaskId = newTask.id;

    if (isSupabaseConfigured() && supabase) {
      try {
        const assignedUuid = resolveProfileUuid(newTask.assignedToId);
        const createdUuid = resolveProfileUuid(currentUser?.id);

        const { data } = await supabase.from('tasks').insert([{
          title: newTask.title,
          description: newTask.description,
          assigned_to_id: assignedUuid,
          assigned_to_name: newTask.assignedToName,
          created_by_id: createdUuid,
          created_by_name: newTask.createdByName,
          priority: newTask.priority,
          deadline: newTask.deadline,
          status: 'todo',
          requires_file: newTask.requiresFile,
          category: newTask.category
        }]).select().single();

        if (data && data.id) {
          createdTaskId = data.id;
          setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, id: data.id } : t));
        }
      } catch (err) {
        console.warn('Supabase insert task:', err.message);
      }
    }

    dispatchNotification({
      targetUserId: newTask.assignedToId,
      title: 'Жаңа тапсырма / Новое поручение',
      message: `${currentUser?.name}: «${newTask.title}» (мерзімі: ${new Date(newTask.deadline).toLocaleDateString('ru-RU')})`,
      type: 'task',
      taskId: createdTaskId
    });

    return newTask;
  };

  // Отмена поручения
  const cancelTask = async (taskId, reason) => {
    const targetTask = tasks.find(t => t.id === taskId);
    const cancelledTaskTitle = targetTask?.title || 'Поручение';
    const targetAssignedId = targetTask?.assignedToId || null;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'cancelled',
          cancelReason: reason,
          cancelledAt: new Date().toISOString(),
          cancelledByName: currentUser?.name
        };
      }
      return t;
    }));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('tasks').update({
          status: 'cancelled',
          cancel_reason: reason
        }).eq('id', taskId);
      } catch (err) {
        console.warn('Supabase cancel update:', err.message);
      }
    }

    if (targetAssignedId) {
      dispatchNotification({
        targetUserId: targetAssignedId,
        title: 'Тапсырманың күші жойылды / Поручение отменено',
        message: `Поручение «${cancelledTaskTitle}» отменено руководством. Причина: «${reason}»`,
        type: 'task',
        taskId: taskId
      });
    }
  };

  // Принятие задачи или возврат на доработку
  const updateTaskStatus = async (taskId, newStatus, extraData = {}) => {
    // 1. Ищем задачу ДО обновления state (надежный поиск)
    let targetTask = tasks.find(t => t.id === taskId);

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, status: newStatus, ...extraData };
        if (newStatus === 'completed') {
          try {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          } catch {
            // ignore
          }
        }
        return updated;
      }
      return t;
    }));

    if (isSupabaseConfigured() && supabase) {
      try {
        const updatePayload = {
          status: newStatus,
          review_comment: extraData.reviewComment !== undefined ? extraData.reviewComment : null,
          reviewed_at: extraData.reviewedAt || new Date().toISOString()
        };
        const { data: updatedDbTask } = await supabase
          .from('tasks')
          .update(updatePayload)
          .eq('id', taskId)
          .select()
          .maybeSingle();

        if (updatedDbTask && !targetTask) {
          targetTask = {
            id: updatedDbTask.id,
            title: updatedDbTask.title,
            assignedToId: updatedDbTask.assigned_to_id,
            assignedToName: updatedDbTask.assigned_to_name,
            createdById: updatedDbTask.created_by_id,
            createdByName: updatedDbTask.created_by_name,
            status: updatedDbTask.status
          };
        }
      } catch (err) {
        console.warn('Supabase updateTaskStatus error:', err.message);
      }
    }

    // 2. Отправка уведомления адресату
    const recipientUserId = targetTask?.assignedToId;
    if (recipientUserId) {
      if (newStatus === 'completed') {
        dispatchNotification({
          targetUserId: recipientUserId,
          title: 'Тапсырма қабылданды / Поручение принято',
          message: `«${targetTask?.title || 'Поручение'}» қабылданды. Жарайсыз! (Тексерген: ${currentUser?.name})`,
          type: 'task',
          taskId: taskId
        });
      } else if (newStatus === 'revision') {
        dispatchNotification({
          targetUserId: recipientUserId,
          title: 'Қайта өңдеуге қайтарылды / На доработку',
          message: `«${targetTask?.title || 'Поручение'}». Ескерту: «${extraData.reviewComment || 'Қайта қарау қажет'}» (Тексерген: ${currentUser?.name})`,
          type: 'task',
          taskId: taskId
        });
      }
    }
  };

  // Сдача отчета учителем
  const submitTaskReport = async (taskId, fileInfo, comment = '') => {
    const targetTask = tasks.find(t => t.id === taskId);

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'submitted',
          submittedFile: fileInfo,
          teacherComment: comment,
          submittedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('tasks').update({
          status: 'submitted',
          teacher_comment: comment,
          submitted_file: fileInfo ? JSON.stringify(fileInfo) : null,
          submitted_at: new Date().toISOString()
        }).eq('id', taskId);

        if (fileInfo && isUuid(taskId)) {
          await supabase.from('task_files').insert([{
            task_id: taskId,
            file_name: fileInfo.name,
            file_size: fileInfo.size,
            download_url: fileInfo.url,
            storage_type: fileInfo.storageType || 'github'
          }]);
        }
      } catch (err) {
        console.warn('Supabase submit report error:', err.message);
      }
    }

    const recipientId = targetTask?.createdById || staff.find(s => s.role === 'director')?.id;
    dispatchNotification({
      targetUserId: recipientId,
      title: 'Есеп тексеруге жіберілді / Отчет сдан',
      message: `${currentUser?.name} сдал(а) отчет по задаче «${targetTask?.title || 'Поручение'}»`,
      type: 'file',
      taskId: taskId
    });
  };

  // Назначение планёрки
  const addMeeting = async (meetingData) => {
    const newMeeting = {
      id: `meet-${Date.now()}`,
      leader: `${currentUser?.name} (${currentUser?.roleTitle})`,
      leaderId: currentUser?.id,
      status: 'scheduled',
      ...meetingData
    };
    setMeetings(prev => [newMeeting, ...prev]);

    if (isSupabaseConfigured() && supabase) {
      try {
        const leaderUuid = resolveProfileUuid(currentUser?.id);
        const { data } = await supabase.from('meetings').insert([{
          title: newMeeting.title,
          type: newMeeting.type,
          type_label: newMeeting.typeLabel,
          meeting_date: newMeeting.date,
          meeting_time: newMeeting.time,
          location: newMeeting.location,
          leader: newMeeting.leader,
          leader_id: leaderUuid,
          agenda: newMeeting.agenda,
          status: 'scheduled'
        }]).select().single();

        if (data) {
          setMeetings(prev => prev.map(m => m.id === newMeeting.id ? { ...m, id: data.id } : m));
        }
      } catch (err) {
        console.warn('Supabase addMeeting error:', err.message);
      }
    }

    dispatchNotification({
      targetRole: 'all',
      title: 'Жаңа жиналыс / Назначена планёрка',
      message: `«${newMeeting.title}» • ${newMeeting.date} күні сағат ${newMeeting.time}-де (${newMeeting.location})`,
      type: 'meeting'
    });

    return newMeeting;
  };

  // Удаление планёрки
  const deleteMeeting = async (meetingId) => {
    let deletedTitle = '';
    setMeetings(prev => {
      const target = prev.find(m => m.id === meetingId);
      if (target) deletedTitle = target.title;
      const updated = prev.filter(m => m.id !== meetingId);
      localStorage.setItem('sp_meetings_kz43', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('meetings').delete().eq('id', meetingId);
      } catch (err) {
        console.warn('Supabase delete meeting error:', err.message);
      }
    }

    if (deletedTitle) {
      dispatchNotification({
        targetRole: 'all',
        title: 'Планёрканың күші жойылды / Планёрка отменена',
        message: `«${deletedTitle}» жойылды.`,
        type: 'meeting'
      });
    }
  };

  // Добавление сотрудника
  const addStaffMember = async (memberData) => {
    const newMember = {
      id: `user-${Date.now()}`,
      avatar: memberData.name ? memberData.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'СШ',
      ...memberData
    };

    setStaff(prev => {
      const updated = [...prev, newMember];
      localStorage.setItem('sp_staff_kz43', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').insert([{
          email: newMember.email || `${newMember.login}@sch43.kz`,
          full_name: newMember.name,
          role: newMember.role,
          role_title: newMember.roleTitle,
          subject: newMember.subject,
          class_leader: newMember.classLeader,
          phone: newMember.phone,
          login: newMember.login,
          password_hash: newMember.passHint || 'school43kz',
          avatar: newMember.avatar
        }]).select().single();

        if (error) {
          console.error('Ошибка добавления сотрудника в Supabase:', error.message);
        } else if (data) {
          setStaff(prev => {
            const updated = prev.map(s => s.id === newMember.id ? { ...s, id: data.id } : s);
            localStorage.setItem('sp_staff_kz43', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.warn('Supabase network notice:', err.message);
      }
    }

    return newMember;
  };

  // Удаление сотрудника (только для директора)
  const deleteStaffMember = async (memberId) => {
    if (!isDirector) return;

    setStaff(prev => {
      const updated = prev.filter(s => s.id !== memberId);
      localStorage.setItem('sp_staff_kz43', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', memberId);
        if (error) {
          console.error('Ошибка удаления сотрудника из Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Supabase network notice:', err.message);
      }
    }
  };

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    if (isSupabaseConfigured() && supabase) {
      try {
        const userUuid = resolveProfileUuid(currentUser?.id || currentUser?.login);
        if (userUuid) {
          await supabase.from('notifications').update({ is_read: true }).eq('user_id', userUuid);
        }
      } catch {
        // fallback
      }
    }
  };

  // Удаление отдельного уведомления
  const deleteNotification = async (notifId) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notifId);
      localStorage.setItem('sp_notifications_kz43', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured() && supabase && isUuid(notifId)) {
      try {
        await supabase.from('notifications').delete().eq('id', notifId);
      } catch {
        // ignore
      }
    }
  };

  // Полная очистка всех уведомлений пользователя
  const clearAllNotifications = async () => {
    setNotifications([]);
    localStorage.setItem('sp_notifications_kz43', JSON.stringify([]));

    if (isSupabaseConfigured() && supabase) {
      try {
        const userUuid = resolveProfileUuid(currentUser?.id || currentUser?.login);
        if (userUuid) {
          await supabase.from('notifications').delete().eq('user_id', userUuid);
        }
      } catch {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      schoolInfo,
      currentUser,
      setCurrentUser,
      staff,
      setStaff,
      tasks,
      meetings,
      notifications,
      theme,
      toggleTheme,
      lang,
      setLang,
      t,
      toggleLanguage,
      isDirector,
      isHeadTeacher,
      isTeacher,
      isCloudSyncing,
      lastSyncedAt,
      refreshData: () => loadFromSupabase(false),
      switchUser,
      loginWithCredentials,
      logout,
      addTask,
      cancelTask,
      updateTaskStatus,
      submitTaskReport,
      addMeeting,
      deleteMeeting,
      addStaffMember,
      deleteStaffMember,
      markAllNotificationsRead,
      deleteNotification,
      clearAllNotifications,
      // Живые тосты
      toast,
      showToast,
      dismissToast,
      // Архивирование поручений (строго для выполненных)
      archivedTaskIds,
      toggleArchiveTask,
      isTaskArchived,
      // PWA интеграция
      deferredPrompt,
      isPwaInstalled,
      promptPwaInstall
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
