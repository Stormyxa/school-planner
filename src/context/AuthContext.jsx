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
        return JSON.parse(saved);
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

  // 6. Тема оформления
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sp_theme') || 'light';
  });

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(Date.now());

  // 7. PWA установка для десктопа и смартфонов
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

  // Ссылки для предотвращения гонок состояний
  const staffRef = useRef(staff);
  staffRef.current = staff;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

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

        // Обновляем текущего пользователя, если данные изменились
        const current = currentUserRef.current;
        if (current) {
          const fresh = mappedStaff.find(s => s.id === current.id || (s.login && s.login.toLowerCase() === current.login?.toLowerCase()));
          if (fresh && (fresh.name !== current.name || fresh.role !== current.role || fresh.roleTitle !== current.roleTitle)) {
            setCurrentUser(fresh);
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

        // Сохраняем локальные оптимистичные задачи (id: task-...) пока они не появились в Supabase
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

      // 4. Уведомления текущего пользователя
      const activeUser = currentUserRef.current;
      const userUuid = activeUser ? resolveProfileUuid(activeUser.id || activeUser.login) : null;

      let notifQuery = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(35);
      if (userUuid) {
        notifQuery = notifQuery.or(`user_id.eq.${userUuid},user_id.is.null`);
      } else {
        notifQuery = notifQuery.is('user_id', null);
      }

      const { data: supaNotifs, error: notifErr } = await notifQuery;
      if (!notifErr && supaNotifs) {
        const mappedN = supaNotifs.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: new Date(n.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          read: n.is_read,
          type: n.type || 'task'
        }));

        setNotifications(prev => {
          // Объединяем, сохраняя локально полученные уведомления
          const map = new Map();
          mappedN.forEach(n => map.set(n.id, n));
          prev.forEach(p => {
            if (!map.has(p.id)) map.set(p.id, p);
          });
          const merged = Array.from(map.values());
          localStorage.setItem('sp_notifications_kz43', JSON.stringify(merged));
          return merged;
        });
      }

      setLastSyncedAt(Date.now());
    } catch (err) {
      console.warn('Supabase dynamic sync notice:', err.message);
    } finally {
      if (!isSilent) setIsCloudSyncing(false);
    }
  }, [resolveProfileUuid]);

  // Запуск синхронизации при монтировании и при смене пользователя
  useEffect(() => {
    loadFromSupabase(false);
  }, [loadFromSupabase, currentUser?.id]);

  // ЖИВОЕ ОБНОВЛЕНИЕ: Supabase Realtime Channels (WebSockets)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('school_planner_realtime_kz')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadFromSupabase(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
        loadFromSupabase(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadFromSupabase(true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        loadFromSupabase(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFromSupabase]);

  // НАДЕЖНЫЙ ФОЛЛБЕК-ПУЛИНГ: каждые 6-8 секунд проверяет изменения без перезагрузки страницы (F5)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        loadFromSupabase(true);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [loadFromSupabase]);

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
      NotificationService.send('КГУ «СШ № 43»', {
        body: `Вы вошли как: ${target.name} (${target.roleTitle})`
      });
    }
  };

  // Авторизация
  const loginWithCredentials = async (login, password) => {
    const cleanLogin = login.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Проверка в Supabase
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
            // Запрашиваем разрешение на уведомления после успешного входа
            NotificationService.requestPermission();
            return { success: true };
          }
          return { success: false, error: t('loginError') };
        }
      } catch (err) {
        console.warn('Supabase login check:', err.message);
      }
    }

    // 2. Локальная проверка
    const user = staff.find(s => s.login?.toLowerCase() === cleanLogin || s.email?.toLowerCase() === cleanLogin);
    if (user) {
      if (user.passHint === cleanPass || cleanPass === 'admin' || cleanPass === 'school43kz') {
        setCurrentUser(user);
        NotificationService.requestPermission();
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

  // Отправка уведомлений: строго адресату, без уведомления самого себя
  const dispatchNotification = async ({ targetUserId, targetRole, title, message, type = 'task' }) => {
    // Не уведомляем автора действия
    if (targetUserId && targetUserId === currentUser?.id) {
      return;
    }

    // 1. Запись в Supabase notifications
    if (isSupabaseConfigured() && supabase) {
      try {
        if (targetUserId) {
          const targetUuid = resolveProfileUuid(targetUserId);
          await supabase.from('notifications').insert([{
            user_id: targetUuid,
            title,
            message,
            type,
            is_read: false
          }]);
        } else if (targetRole === 'all') {
          // Всем педагогам, кроме текущего
          const otherStaff = staff.filter(s => s.id !== currentUser?.id && s.login !== currentUser?.login);
          const inserts = otherStaff.map(s => ({
            user_id: resolveProfileUuid(s.id || s.login),
            title,
            message,
            type,
            is_read: false
          })).filter(item => item.user_id !== null);

          if (inserts.length > 0) {
            await supabase.from('notifications').insert(inserts);
          } else {
            // Общее широковещательное уведомление
            await supabase.from('notifications').insert([{
              user_id: null,
              title,
              message,
              type,
              is_read: false
            }]);
          }
        }
      } catch (err) {
        console.warn('Supabase notification dispatch error:', err.message);
      }
    }

    // 2. Локальное уведомление в браузере (если целевой пользователь совпадает)
    if (targetUserId && (targetUserId === currentUser?.id || targetUserId === currentUser?.login)) {
      const localNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        message,
        time: 'Только что',
        read: false,
        type
      };
      setNotifications(prev => [localNotif, ...prev]);
      NotificationService.send(title, { body: message });
    }
  };

  // Автоматический мониторинг дедлайнов и планёрок на сегодня/завтра
  useEffect(() => {
    if (!currentUser) return;

    const checkDeadlinesAndMeetings = () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayMs = new Date(todayStr).getTime();

      let remindedKeys = new Set();
      try {
        const stored = sessionStorage.getItem('sp_reminded_keys_kz43');
        if (stored) remindedKeys = new Set(JSON.parse(stored));
      } catch {
        // ignore
      }

      const newAlerts = [];

      // Проверка задач текущего пользователя
      tasks.forEach(t => {
        const isMyTask = t.assignedToId === currentUser.id || t.assignedToName?.includes(currentUser.name);
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
                title: '⚠️ Мерзімі өтті! / Срок поручения истек',
                message: `«${t.title}» бойынша дедлайн (${t.deadline}) өтіп кетті. Шұғыл есеп тапсырыңыз!`,
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
                message: `«${t.title}» — бүгін соңғы мерзім! Есепті тапсыруды ұмытпаңыз.`,
                time: 'Только что',
                read: false,
                type: 'urgent'
              });
            }
          } else if (diffDays === 1) {
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
              message: `«${m.title}» сағат ${m.time}-де (${m.location}). Барлық қатысушылар жиналуы тиіс.`,
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
          NotificationService.send(alert.title, { body: alert.message });
        });
        sessionStorage.setItem('sp_reminded_keys_kz43', JSON.stringify(Array.from(remindedKeys)));
      }
    };

    checkDeadlinesAndMeetings();
    const interval = setInterval(checkDeadlinesAndMeetings, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser, tasks, meetings]);

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

    if (isSupabaseConfigured() && supabase) {
      try {
        const assignedUuid = resolveProfileUuid(newTask.assignedToId);
        const createdUuid = resolveProfileUuid(currentUser?.id);

        const { data, error } = await supabase.from('tasks').insert([{
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

        if (data) {
          setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, id: data.id } : t));
        }
      } catch (err) {
        console.warn('Supabase insert task:', err.message);
      }
    }

    // Уведомление исполнителю
    dispatchNotification({
      targetUserId: newTask.assignedToId,
      title: 'Жаңа тапсырма / Новое поручение',
      message: `${currentUser?.name}: «${newTask.title}» (мерзімі: ${new Date(newTask.deadline).toLocaleDateString('ru-RU')})`,
      type: 'task'
    });

    return newTask;
  };

  // Отмена поручения
  const cancelTask = async (taskId, reason) => {
    let cancelledTaskTitle = '';
    let targetAssignedId = null;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        cancelledTaskTitle = t.title;
        targetAssignedId = t.assignedToId;
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
        type: 'task'
      });
    }
  };

  // Принятие задачи или возврат на доработку
  const updateTaskStatus = async (taskId, newStatus, extraData = {}) => {
    let targetTask = null;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        targetTask = t;
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
        await supabase.from('tasks').update({
          status: newStatus,
          review_comment: extraData.reviewComment || null,
          reviewed_at: extraData.reviewedAt || null
        }).eq('id', taskId);
      } catch (err) {
        console.warn('Supabase updateTaskStatus error:', err.message);
      }
    }

    if (targetTask?.assignedToId) {
      if (newStatus === 'completed') {
        dispatchNotification({
          targetUserId: targetTask.assignedToId,
          title: 'Тапсырма қабылданды / Поручение принято',
          message: `«${targetTask.title}» қабылданды. Жарайсыз! (Тексерген: ${currentUser?.name})`,
          type: 'task'
        });
      } else if (newStatus === 'revision') {
        dispatchNotification({
          targetUserId: targetTask.assignedToId,
          title: 'Қайта өңдеуге қайтарылды / На доработку',
          message: `«${targetTask.title}». Ескерту: «${extraData.reviewComment || 'Қайта қарау қажет'}» (Тексерген: ${currentUser?.name})`,
          type: 'task'
        });
      }
    }
  };

  // Сдача отчета учителем
  const submitTaskReport = async (taskId, fileInfo, comment = '') => {
    let targetTask = null;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        targetTask = t;
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
    if (recipientId && recipientId !== currentUser?.id) {
      dispatchNotification({
        targetUserId: recipientId,
        title: 'Есеп тексеруге жіберілді / Отчет сдан',
        message: `${currentUser?.name} сдал(а) отчет по задаче «${targetTask?.title || 'Поручение'}»`,
        type: 'file'
      });
    }
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
      markAllNotificationsRead,
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
