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

function AppContent() {
  const { currentUser } = useAuth();

  // Сохраняем и восстанавливаем выбранную вкладку при перезагрузке
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('sp_active_tab_kz43') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('sp_active_tab_kz43', activeTab);
  }, [activeTab]);
  
  // Состояния модальных окон
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToSubmit, setTaskToSubmit] = useState(null);

  // Если не авторизован — показываем экран входа
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Шапка приложения */}
      <Header />

      {/* Основной макет: Боковая панель + Контент страницы */}
      <div style={{ display: 'flex', flex: 1 }}>
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
          paddingBottom: '5rem'
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
