import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import DashboardTab from './pages/DashboardTab';
import PlannerTab from './pages/PlannerTab';
import TasksTab from './pages/TasksTab';
import DocumentsTab from './pages/DocumentsTab';
import StaffTab from './pages/StaffTab';
import SettingsTab from './pages/SettingsTab';
import NewTaskModal from './components/NewTaskModal';
import NewMeetingModal from './components/NewMeetingModal';
import SubmitReportModal from './components/SubmitReportModal';
import TaskDetailModal from './components/TaskDetailModal';
import NotificationToast from './components/NotificationToast';

function AppContent() {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('sp_active_tab_kz43') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('sp_active_tab_kz43', activeTab);
  }, [activeTab]);
  
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToSubmit, setTaskToSubmit] = useState(null);

  // Навигация клавишами 1-6 на ПК
  useEffect(() => {
    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag) || e.target?.isContentEditable) {
        return;
      }

      if (isNewTaskOpen || isNewMeetingOpen || selectedTask || taskToSubmit) {
        return;
      }

      const tabsMap = {
        '1': 'dashboard',
        '2': 'planner',
        '3': 'tasks',
        '4': 'documents',
        '5': 'staff',
        '6': 'settings'
      };

      if (tabsMap[e.key]) {
        e.preventDefault();
        setActiveTab(tabsMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNewTaskOpen, isNewMeetingOpen, selectedTask, taskToSubmit]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  const handleOpenTaskDetail = (task) => {
    setSelectedTask(task);
  };

  const handleOpenSubmitReport = (task) => {
    setTaskToSubmit(task);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Шапка приложения */}
      <Header />

      {/* Основной макет */}
      <div style={{ display: 'flex', flex: 1, width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onOpenNewTask={() => setIsNewTaskOpen(true)}
          onOpenNewMeeting={() => setIsNewMeetingOpen(true)}
        />

        <main style={{
          flex: 1,
          padding: '1.25rem',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          paddingBottom: '5.5rem'
        }}>
          {activeTab === 'dashboard' && (
            <DashboardTab 
              onSelectTask={handleOpenTaskDetail}
              onOpenNewTask={() => setIsNewTaskOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerTab 
              onOpenNewMeeting={() => setIsNewMeetingOpen(true)}
              onSelectTask={handleOpenTaskDetail}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksTab 
              onSelectTask={handleOpenTaskDetail}
              onOpenNewTask={() => setIsNewTaskOpen(true)}
              onOpenSubmitReport={handleOpenSubmitReport}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab 
              onOpenSubmitReport={handleOpenSubmitReport}
              onSelectTask={handleOpenTaskDetail}
            />
          )}

          {activeTab === 'staff' && (
            <StaffTab />
          )}

          {activeTab === 'settings' && (
            <SettingsTab />
          )}
        </main>
      </div>

      {/* Живые всплывающие тост-уведомления */}
      <NotificationToast />

      {/* Модальные окна */}
      <NewTaskModal 
        isOpen={isNewTaskOpen} 
        onClose={() => setIsNewTaskOpen(false)} 
      />

      <NewMeetingModal 
        isOpen={isNewMeetingOpen} 
        onClose={() => setIsNewMeetingOpen(false)} 
      />

      <TaskDetailModal 
        isOpen={Boolean(selectedTask)} 
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onOpenSubmitReport={handleOpenSubmitReport}
      />

      <SubmitReportModal 
        isOpen={Boolean(taskToSubmit)} 
        onClose={() => setTaskToSubmit(null)}
        task={taskToSubmit}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
