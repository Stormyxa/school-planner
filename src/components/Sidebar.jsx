import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  CheckSquare, 
  FolderDown, 
  Users, 
  Settings,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab, onOpenNewTask, onOpenNewMeeting }) {
  const { isDirector, isHeadTeacher, t, schoolInfo } = useAuth();

  // Возможность скрывать / сворачивать полоску на ПК
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sp_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sp_sidebar_collapsed', String(next));
      return next;
    });
  };

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
      {/* Десктопная боковая панель (с возможностью свернуть полоску) */}
      <aside className="hide-on-mobile" style={{
        width: isCollapsed ? '64px' : '230px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isCollapsed ? '1rem 0.4rem' : '1.25rem 0.75rem',
        minHeight: 'calc(100vh - 65px)',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {/* Кнопка сворачивания/разворачивания боковой панели */}
          <div style={{
            display: 'flex',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            {!isCollapsed && (
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Навигация
              </span>
            )}
            <button
              onClick={toggleCollapse}
              className="btn-ghost btn-icon"
              title={isCollapsed ? 'Развернуть меню' : 'Скрыть боковую панель'}
              style={{ padding: '0.3rem', color: 'var(--text-secondary)' }}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Быстрые действия для руководства */}
          {(isDirector || isHeadTeacher) && (
            <div style={{ marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button 
                onClick={onOpenNewTask}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.85rem'
                }}
                title={t('btnNewTask')}
              >
                <PlusCircle size={18} />
                {!isCollapsed && <span>{t('btnNewTask')}</span>}
              </button>

              <button 
                onClick={onOpenNewMeeting}
                className="btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  fontSize: '0.82rem',
                  padding: isCollapsed ? '0.5rem 0' : '0.5rem 0.85rem'
                }}
                title={t('btnNewMeeting')}
              >
                <CalendarDays size={16} color="var(--color-primary-light)" />
                {!isCollapsed && <span>{t('btnNewMeeting')}</span>}
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
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: '0.75rem',
                  padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--color-primary-bg)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.88rem',
                  textAlign: 'left',
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Icon size={19} color={isActive ? 'var(--color-primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Инфо внизу сайдбара */}
        {!isCollapsed && (
          <div style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {schoolInfo.shortName}
            </div>
            <div>{t('academicYear')}</div>
            <div style={{ marginTop: '0.35rem', color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ● <span>{t('systemStatus')}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Мобильная нижняя навигация (СТРОГО ДЛЯ ТЕЛЕФОНОВ, НА ПК СКРЫТА) */}
      <nav className="mobile-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.35rem 0.2rem',
        zIndex: 90
      }}>
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
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
