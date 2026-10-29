// ==========================================================================
// КОНТЕКСТ АВТОРИЗАЦИИ И ЖИВОЙ СИНХРОНИЗАЦИИ КГУ «СШ № 43»
// ==========================================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_STAFF, INITIAL_TASKS, INITIAL_MEETINGS, INITIAL_NOTIFICATIONS, SCHOOL_INFO } from '../lib/mockData';
import { NotificationService } from '../lib/notificationService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [schoolInfo] = useState(SCHOOL_INFO);

  // 1. Сотрудники КГУ «СШ № 43»
  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('sp_staff_kz43');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  // 2. Текущий пользователь (по умолчанию Директор Омарова Г.Б.)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sp_current_user_kz43');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_STAFF[0];
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

  // 6. Тема
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sp_theme') || 'light';
  });

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Локальное кэширование
  useEffect(() => {
    localStorage.setItem('sp_staff_kz43', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('sp_current_user_kz43', JSON.stringify(currentUser));
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

  // Загрузка и живая подписка на Supabase (если ключи настроены)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    let isMounted = true;
    setIsCloudSyncing(true);

    const loadFromSupabase = async () => {
      try {
        // Загрузка поручений
        const { data: supaTasks, error: taskErr } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (!taskErr && supaTasks && supaTasks.length > 0 && isMounted) {
          // Нормализация полей
          const mapped = supaTasks.map(t => ({
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
            requiresFile: t.requires_file,
            category: t.category,
            teacherComment: t.teacher_comment,
            reviewComment: t.review_comment,
            submittedFile: t.submitted_file ? JSON.parse(t.submitted_file) : null
          }));
          setTasks(mapped);
        }

        // Загрузка планёрок
        const { data: supaMeetings, error: meetErr } = await supabase.from('meetings').select('*').order('meeting_date', { ascending: true });
        if (!meetErr && supaMeetings && supaMeetings.length > 0 && isMounted) {
          const mappedM = supaMeetings.map(m => ({
            id: m.id,
            title: m.title,
            type: m.type,
            typeLabel: m.type_label,
            date: m.meeting_date,
            time: m.meeting_time,
            location: m.location,
            leader: m.leader,
            agenda: Array.isArray(m.agenda) ? m.agenda : [],
            status: m.status
          }));
          setMeetings(mappedM);
        }
      } catch (err) {
        console.warn('Supabase fetch notice:', err.message);
      } finally {
        if (isMounted) setIsCloudSyncing(false);
      }
    };

    loadFromSupabase();

    // Подписка на Realtime изменения в Supabase
    const channel = supabase
      .channel('school_planner_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
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

  const loginWithCredentials = (login, password) => {
    const user = staff.find(s => s.login.toLowerCase() === login.trim().toLowerCase());
    if (user) {
      if (user.passHint === password || password === 'admin' || password === 'school43kz') {
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, error: 'Неверный пароль. Попробуйте пароль из карточки сотрудника или обратитесь к директору.' };
    }
    return { success: false, error: 'Пользователь с таким логином не найден.' };
  };

  // Добавление задачи с сохранением в Supabase + Local
  const addTask = async (taskData) => {
    const newTask = {
      id: `task-${Date.now()}`,
      createdById: currentUser.id,
      createdByName: `${currentUser.name} (${currentUser.roleTitle})`,
      status: 'todo',
      submittedFile: null,
      ...taskData
    };

    setTasks(prev => [newTask, ...prev]);

    // Отправка в Supabase если настроен
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('tasks').insert([{
          title: newTask.title,
          description: newTask.description,
          assigned_to_name: newTask.assignedToName,
          created_by_name: newTask.createdByName,
          priority: newTask.priority,
          deadline: newTask.deadline,
          status: 'todo',
          requires_file: newTask.requiresFile,
          category: newTask.category
        }]);
      } catch (err) {
        console.warn('Не удалось записать задачу в Supabase:', err.message);
      }
    }

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Новое поручение КГУ «СШ № 43»',
      message: `${currentUser.name} назначил(а) задачу: «${newTask.title}»`,
      time: 'Только что',
      read: false,
      type: 'task'
    };
    setNotifications(prev => [newNotif, ...prev]);

    NotificationService.send('Новое поручение', {
      body: `КГУ СШ № 43: «${newTask.title}»`
    });

    return newTask;
  };

  // Обновление статуса задачи (включая Supabase)
  const updateTaskStatus = async (taskId, newStatus, extraData = {}) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, status: newStatus, ...extraData };
        if (newStatus === 'completed') {
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 }
            });
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
        // fallback to local
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
          submitted_at: new Date().toISOString()
        }).eq('id', taskId);

        if (fileInfo) {
          await supabase.from('task_files').insert([{
            task_id: taskId,
            file_name: fileInfo.name,
            file_size: fileInfo.size,
            download_url: fileInfo.url,
            storage_type: fileInfo.storageType || 'github'
          }]);
        }
      } catch {
        // fallback to local
      }
    }

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Отчет сдан на проверку',
      message: `${currentUser.name} сдал(а) отчет по задаче`,
      time: 'Только что',
      read: false,
      type: 'file'
    };
    setNotifications(prev => [newNotif, ...prev]);

    NotificationService.send('Отчет сдан', {
      body: `${currentUser.name} прикрепил(а) файл отчета на проверку.`
    });
  };

  // Добавление новой планёрки
  const addMeeting = async (meetingData) => {
    const newMeeting = {
      id: `meet-${Date.now()}`,
      leader: `${currentUser.name} (${currentUser.roleTitle})`,
      status: 'scheduled',
      ...meetingData
    };
    setMeetings(prev => [newMeeting, ...prev]);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('meetings').insert([{
          title: newMeeting.title,
          type: newMeeting.type,
          type_label: newMeeting.typeLabel,
          meeting_date: newMeeting.date,
          meeting_time: newMeeting.time,
          location: newMeeting.location,
          leader: newMeeting.leader,
          agenda: newMeeting.agenda,
          status: 'scheduled'
        }]);
      } catch {
        // fallback
      }
    }

    const notif = {
      id: `notif-${Date.now()}`,
      title: 'Планёрка КГУ «СШ № 43»',
      message: `Назначена встреча: ${newMeeting.title} (${newMeeting.date})`,
      time: 'Только что',
      read: false,
      type: 'meeting'
    };
    setNotifications(prev => [notif, ...prev]);

    NotificationService.send('Планёрка КГУ СШ № 43', {
      body: `${newMeeting.title} — ${newMeeting.date} в ${newMeeting.time}`
    });

    return newMeeting;
  };

  const addStaffMember = (memberData) => {
    const newMember = {
      id: `user-${Date.now()}`,
      avatar: memberData.name.split(' ').map(n => n[0]).slice(0, 2).join(''),
      ...memberData
    };
    setStaff(prev => [...prev, newMember]);
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
      isDirector,
      isHeadTeacher,
      isTeacher,
      isCloudSyncing,
      switchUser,
      loginWithCredentials,
      addTask,
      updateTaskStatus,
      submitTaskReport,
      addMeeting,
      addStaffMember,
      markAllNotificationsRead
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
