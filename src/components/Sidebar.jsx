import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  FolderDown, 
  Users, 
  Settings,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, onOpenNewTask, onOpenNewMeeting }) {
  const { isDirector, isHeadTeacher, t, schoolInfo } = useAuth();

  const navItems = [
    { id: 'dashboard', label: t('navPulse'), icon: LayoutDashboard },
    { id: 'planner', label: t('navPlanner'), icon: CalendarDays },
    { id: 'tasks', label: t('navTasks'), icon: CheckSquare },
    { id: 'documents', label: t('navDocs'), icon: FolderDown },
    { id: 'staff', label: t('navStaff'), icon: Users },
    { id: 'settings', label: t('navSettings'), icon: Settings },
  ];

  return (
    <>
      {/* Десктопная боковая панель */}
      <aside className="hide-on-mobile" style={{
        width: '240px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 0.75rem',
        minHeight: 'calc(100vh - 65px)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {/* Быстрые действия для директора/завуча */}
          {(isDirector || isHeadTeacher) && (
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={onOpenNewTask}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                <PlusCircle size={18} />
                {t('btnNewTask')}
              </button>
              <button 
                onClick={onOpenNewMeeting}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.85rem' }}
              >
                <CalendarDays size={17} color="var(--color-primary-light)" />
                {t('btnNewMeeting')}
              </button>
            </div>
          )}

          {/* Пункты навигации */}
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--color-primary-bg)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  textAlign: 'left',
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={19} color={isActive ? 'var(--color-primary)' : 'var(--text-muted)'} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Инфо внизу сайдбара */}
        <div style={{
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-surface-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.4
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {schoolInfo.shortName}
          </div>
          <div>{t('academicYear')}</div>
          <div style={{ marginTop: '0.4rem', color: 'var(--color-success)', fontWeight: 600 }}>
            ● {t('systemStatus')}
          </div>
        </div>
      </aside>

      {/* Мобильная нижняя навигация */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.4rem 0.2rem',
        zIndex: 90
      }} className="mobile-nav">
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.3rem 0.4rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
                fontSize: '0.68rem',
                fontWeight: isActive ? 600 : 400
              }}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
