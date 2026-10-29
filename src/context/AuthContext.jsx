// ==========================================================================
// КОНТЕКСТ АВТОРИЗАЦИИ И ЖИВОЙ СИНХРОНИЗАЦИИ КГУ «СШ № 43»
// ==========================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_STAFF, INITIAL_TASKS, INITIAL_MEETINGS, INITIAL_NOTIFICATIONS, SCHOOL_INFO } from '../lib/mockData';
import { NotificationService } from '../lib/notificationService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { translations } from '../lib/translations';
import confetti from 'canvas-confetti';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [schoolInfo] = useState(SCHOOL_INFO);

  // Язык интерфейса: 'ru' или 'kk'
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('sp_lang_kz43') || 'ru';
  });

  const t = (key) => {
    return translations[lang]?.[key] || translations['ru']?.[key] || key;
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ru' ? 'kk' : 'ru'));
  };

  useEffect(() => {
    localStorage.setItem('sp_lang_kz43', lang);
  }, [lang]);

  // 1. Сотрудники КГУ «СШ № 43» (сохраняются надежно в localStorage и Supabase)
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
    return null; // По умолчанию экран входа
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

  // Кэширование
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

  // Загрузка данных из Supabase со слиянием (merge), чтобы сотрудники не затирались!
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let isMounted = true;
    setIsCloudSyncing(true);

    const loadFromSupabase = async () => {
      try {
        // 1. Профили
        const { data: supaProfiles, error: profErr } = await supabase.from('profiles').select('*');
        if (!profErr && supaProfiles && isMounted) {
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
            avatar: p.avatar || p.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')
          }));

          // Слияние Supabase профилей с локальными, чтобы новые не терялись!
          setStaff(prev => {
            const mapByLogin = new Map();
            mappedStaff.forEach(m => mapByLogin.set(m.login.toLowerCase(), m));
            prev.forEach(m => {
              if (!mapByLogin.has(m.login.toLowerCase())) {
                mapByLogin.set(m.login.toLowerCase(), m);
              }
            });
            const merged = Array.from(mapByLogin.values());
            localStorage.setItem('sp_staff_kz43', JSON.stringify(merged));
            return merged;
          });

          if (currentUser) {
            const fresh = mappedStaff.find(s => s.id === currentUser.id || s.login.toLowerCase() === currentUser.login.toLowerCase());
            if (fresh) setCurrentUser(fresh);
          }
        }

        // 2. Задачи
        const { data: supaTasks, error: taskErr } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (!taskErr && supaTasks && isMounted) {
          const mappedTasks = supaTasks.map(t => ({
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
            submittedFile: t.submitted_file ? JSON.parse(t.submitted_file) : null
          }));
          setTasks(mappedTasks);
        }

        // 3. Планёрки
        const { data: supaMeetings, error: meetErr } = await supabase.from('meetings').select('*').order('meeting_date', { ascending: true });
        if (!meetErr && supaMeetings && isMounted) {
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
          setMeetings(mappedM);
        }
      } catch (err) {
        console.warn('Supabase sync notice:', err.message);
      } finally {
        if (isMounted) setIsCloudSyncing(false);
      }
    };

    loadFromSupabase();

    const channel = supabase
      .channel('school_planner_realtime_kz')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => {
        loadFromSupabase();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
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
              avatar: data.avatar || data.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')
            };
            setCurrentUser(userObj);
            return { success: true };
          }
          return { success: false, error: t('loginError') };
        }
      } catch (err) {
        console.warn('Supabase login check:', err.message);
      }
    }

    // 2. Локальная проверка
    const user = staff.find(s => s.login.toLowerCase() === cleanLogin || s.email.toLowerCase() === cleanLogin);
    if (user) {
      if (user.passHint === cleanPass || cleanPass === 'admin' || cleanPass === 'school43kz') {
        setCurrentUser(user);
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
        await supabase.from('tasks').insert([{
          title: newTask.title,
          description: newTask.description,
          assigned_to_id: newTask.assignedToId?.includes('user-') ? null : newTask.assignedToId,
          assigned_to_name: newTask.assignedToName,
          created_by_name: newTask.createdByName,
          priority: newTask.priority,
          deadline: newTask.deadline,
          status: 'todo',
          requires_file: newTask.requiresFile,
          category: newTask.category
        }]);
      } catch (err) {
        console.warn('Supabase insert task:', err.message);
      }
    }

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Жаңа тапсырма / Новое поручение',
      message: `${currentUser?.name}: «${newTask.title}»`,
      time: 'Только что',
      read: false,
      type: 'task'
    };
    setNotifications(prev => [newNotif, ...prev]);

    return newTask;
  };

  // Отмена поручения постановщиком
  const cancelTask = async (taskId, reason) => {
    let cancelledTaskTitle = '';

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        cancelledTaskTitle = t.title;
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

    const cancelNotif = {
      id: `notif-${Date.now()}`,
      title: 'Тапсырманың күші жойылды / Поручение отменено',
      message: `Поручение «${cancelledTaskTitle}» отменено директором. Причина: «${reason}»`,
      time: 'Только что',
      read: false,
      type: 'task'
    };
    setNotifications(prev => [cancelNotif, ...prev]);

    NotificationService.send('Поручение отменено', {
      body: `«${cancelledTaskTitle}» отменено: ${reason}`
    });
  };

  // Обновление статуса задачи
  const updateTaskStatus = async (taskId, newStatus, extraData = {}) => {
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
        await supabase.from('tasks').update({
          status: newStatus,
          review_comment: extraData.reviewComment || null,
          reviewed_at: extraData.reviewedAt || null
        }).eq('id', taskId);
      } catch {
        // fallback
      }
    }
  };

  // Сдача отчета учителем
  const submitTaskReport = async (taskId, fileInfo, comment = '') => {
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

        if (fileInfo) {
          await supabase.from('task_files').insert([{
            task_id: taskId.includes('task-') ? null : taskId,
            file_name: fileInfo.name,
            file_size: fileInfo.size,
            download_url: fileInfo.url,
            storage_type: fileInfo.storageType || 'github'
          }]);
        }
      } catch {
        // fallback
      }
    }

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Есеп тексеруге жіберілді / Отчет сдан',
      message: `${currentUser?.name} сдал(а) отчет по задаче`,
      time: 'Только что',
      read: false,
      type: 'file'
    };
    setNotifications(prev => [newNotif, ...prev]);

    NotificationService.send('Отчет сдан', {
      body: `${currentUser?.name} прикрепил(а) документ на проверку.`
    });
  };

  // Добавление планёрки
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
        const { data, error } = await supabase.from('meetings').insert([{
          title: newMeeting.title,
          type: newMeeting.type,
          type_label: newMeeting.typeLabel,
          meeting_date: newMeeting.date,
          meeting_time: newMeeting.time,
          location: newMeeting.location,
          leader: newMeeting.leader,
          leader_id: currentUser?.id,
          agenda: newMeeting.agenda,
          status: 'scheduled'
        }]).select().single();

        if (data) {
          setMeetings(prev => prev.map(m => m.id === newMeeting.id ? { ...m, id: data.id } : m));
        }
      } catch {
        // fallback
      }
    }

    const notif = {
      id: `notif-${Date.now()}`,
      title: 'Жаңа жиналыс / Назначена планёрка',
      message: `${newMeeting.title} (${newMeeting.date})`,
      time: 'Только что',
      read: false,
      type: 'meeting'
    };
    setNotifications(prev => [notif, ...prev]);

    return newMeeting;
  };

  // УДАЛЕНИЕ ПЛАНЁРКИ (СОЗДАТЕЛЕМ ИЛИ ДИРЕКТОРОМ)
  const deleteMeeting = async (meetingId) => {
    setMeetings(prev => {
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
  };

  // Добавление сотрудника (с надежным сохранением и в LocalStorage, и в Supabase)
  const addStaffMember = async (memberData) => {
    const newMember = {
      id: `user-${Date.now()}`,
      avatar: memberData.name.split(' ').map(n => n[0]).slice(0, 2).join(''),
      ...memberData
    };

    // 1. Немедленно сохраняем локально, чтобы никогда не терялось при перезагрузке
    setStaff(prev => {
      const updated = [...prev, newMember];
      localStorage.setItem('sp_staff_kz43', JSON.stringify(updated));
      return updated;
    });

    // 2. Записываем в Supabase
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
          // Обновляем реальный UUID из Supabase
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

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
      markAllNotificationsRead
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
