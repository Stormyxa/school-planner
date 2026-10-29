// ==========================================================================
// КОНТЕКСТ АВТОРИЗАЦИИ И СОСТОЯНИЯ ШКОЛЫ
// ==========================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_STAFF, INITIAL_TASKS, INITIAL_MEETINGS, INITIAL_NOTIFICATIONS } from '../lib/mockData';
import { NotificationService } from '../lib/notificationService';
import confetti from 'canvas-confetti';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // 1. Сотрудники
  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('sp_staff');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  // 2. Текущий пользователь (по умолчанию Директор школы)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sp_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_STAFF[0]; // Елена Николаевна (Директор)
  });

  // 3. Задачи и поручения
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('sp_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // 4. Планёрки и педсоветы
  const [meetings, setMeetings] = useState(() => {
    const saved = localStorage.getItem('sp_meetings');
    return saved ? JSON.parse(saved) : INITIAL_MEETINGS;
  });

  // 5. Уведомления
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('sp_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // 6. Тема оформления (светлая / тёмная)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sp_theme') || 'light';
  });

  // Сохранение в LocalStorage
  useEffect(() => {
    localStorage.setItem('sp_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('sp_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sp_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('sp_meetings', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('sp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Ролевые геттеры
  const isDirector = currentUser?.role === 'director';
  const isHeadTeacher = currentUser?.role === 'head_teacher';
  const isTeacher = currentUser?.role === 'teacher';

  // Переключение пользователя (для демонстрации и удобства)
  const switchUser = (userId) => {
    const target = staff.find(s => s.id === userId);
    if (target) {
      setCurrentUser(target);
      NotificationService.send('Смена пользователя', {
        body: `Вы вошли как: ${target.name} (${target.roleTitle})`
      });
    }
  };

  // Вход по логину и паролю
  const loginWithCredentials = (login, password) => {
    const user = staff.find(s => s.login.toLowerCase() === login.trim().toLowerCase());
    if (user) {
      if (user.passHint === password || password === 'admin' || password === 'school2026') {
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, error: 'Неверный пароль. Попробуйте пароль из карточки сотрудника или обратитесь к директору.' };
    }
    return { success: false, error: 'Пользователь с таким логином не найден.' };
  };

  // Добавление новой задачи (Директором или Завучем)
  const addTask = (taskData) => {
    const newTask = {
      id: `task-${Date.now()}`,
      createdById: currentUser.id,
      createdByName: `${currentUser.name} (${currentUser.roleTitle})`,
      status: 'todo',
      submittedFile: null,
      ...taskData
    };

    setTasks(prev => [newTask, ...prev]);

    // Добавляем уведомление исполнителю
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Новое поручение',
      message: `${currentUser.name} назначил(а) задачу: «${newTask.title}»`,
      time: 'Только что',
      read: false,
      type: 'task'
    };
    setNotifications(prev => [newNotif, ...prev]);

    NotificationService.send('Новое поручение', {
      body: `Назначена задача: «${newTask.title}»`
    });

    return newTask;
  };

  // Обновление статуса задачи
  const updateTaskStatus = (taskId, newStatus, extraData = {}) => {
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
  };

  // Сдача отчета учителем (с файлом или без)
  const submitTaskReport = (taskId, fileInfo, comment = '') => {
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

    // Уведомление директору
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

  // Добавление новой планёрки / совещания
  const addMeeting = (meetingData) => {
    const newMeeting = {
      id: `meet-${Date.now()}`,
      leader: `${currentUser.name} (${currentUser.roleTitle})`,
      status: 'scheduled',
      ...meetingData
    };
    setMeetings(prev => [newMeeting, ...prev]);

    const notif = {
      id: `notif-${Date.now()}`,
      title: 'Новая планёрка / совещание',
      message: `Назначена встреча: ${newMeeting.title} (${newMeeting.date})`,
      time: 'Только что',
      read: false,
      type: 'meeting'
    };
    setNotifications(prev => [notif, ...prev]);

    NotificationService.send('Назначена планёрка', {
      body: `${newMeeting.title} — ${newMeeting.date} в ${newMeeting.time}`
    });

    return newMeeting;
  };

  // Добавление сотрудника директором
  const addStaffMember = (memberData) => {
    const newMember = {
      id: `user-${Date.now()}`,
      avatar: memberData.name.split(' ').map(n => n[0]).slice(0, 2).join(''),
      ...memberData
    };
    setStaff(prev => [...prev, newMember]);
    return newMember;
  };

  // Отметить уведомления прочитанными
  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AuthContext.Provider value={{
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
