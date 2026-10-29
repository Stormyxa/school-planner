import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../lib/notificationService';
import { 
  Bell, 
  Moon, 
  Sun, 
  ChevronDown, 
  CheckCircle2, 
  Smartphone,
  School,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export default function Header() {
  const { 
    schoolInfo,
    currentUser, 
    staff, 
    switchUser, 
    theme, 
    toggleTheme, 
    notifications,
    markAllNotificationsRead,
    isCloudSyncing
  } = useAuth();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [pushStatus, setPushStatus] = useState(NotificationService.getPermissionStatus());

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRequestPush = async () => {
    const granted = await NotificationService.requestPermission();
    setPushStatus(NotificationService.getPermissionStatus());
    if (granted) {
      NotificationService.send('КГУ «СШ № 43»', {
        body: 'Уведомления включены! Вы будете вовремя узнавать о поручениях директора и сроках сдачи СОР/СОЧ.'
      });
    }
  };

  return (
    <header style={{
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(8px)',
      background: 'var(--bg-surface-glass)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem'
      }}>
        {/* Логотип и Название Школы: КГУ «СШ № 43» */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%)', // Небесно-голубой и индиго (Казахстанский мотив)
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <School size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.01em', margin: 0 }}>
                {schoolInfo.shortName}
              </h1>
              <span className="badge badge-primary hide-on-mobile" style={{ fontSize: '0.68rem', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                Планёрка • ҚР
              </span>
              {isCloudSyncing && (
                <span className="badge badge-warning pulse" style={{ fontSize: '0.65rem' }}>
                  Синхронизация...
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
              {schoolInfo.kazName}
            </p>
          </div>
        </div>

        {/* Действия: Kundelik, Push, Тема, Уведомления, Роль */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          {/* Быстрый переход в Kundelik.kz */}
          <a
            href="https://kundelik.kz"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary btn-sm hide-on-mobile"
            style={{ textDecoration: 'none', fontSize: '0.78rem', color: '#0284c7', borderColor: '#bae6fd' }}
            title="Открыть электронный журнал Күнделік"
          >
            <BookOpen size={14} />
            Kundelik.kz
            <ExternalLink size={11} style={{ opacity: 0.6 }} />
          </a>

          {/* Кнопка Push уведомлений */}
          {pushStatus !== 'granted' && (
            <button 
              className="btn-secondary btn-sm hide-on-mobile"
              onClick={handleRequestPush}
              title="Включить браузерные пуш-уведомления"
              style={{ fontSize: '0.8rem', gap: '0.35rem' }}
            >
              <Smartphone size={14} color="var(--color-primary)" />
              Включить пуши
            </button>
          )}

          {/* Тема оформления */}
          <button 
            className="btn-ghost btn-icon"
            onClick={toggleTheme}
            aria-label="Сменить тему"
            title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} color="#f59e0b" />}
          </button>

          {/* Колокольчик уведомлений */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn-ghost btn-icon"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowRoleMenu(false);
              }}
              style={{ position: 'relative' }}
              title="Уведомления"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: 'var(--color-danger)',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '18px',
                  height: '18px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px var(--bg-surface)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Выпадающее окно уведомлений */}
            {showNotifMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 100,
                padding: '0.75rem',
                animation: 'slideUp 0.15s ease-out'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.6rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Хабарламалар / Уведомления</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllNotificationsRead}
                      style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', padding: 0 }}
                    >
                      Прочитать все
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                      Нет новых уведомлений
                    </p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} style={{
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: notif.read ? 'transparent' : 'var(--bg-surface-subtle)',
                        borderLeft: notif.read ? '2px solid transparent' : '3px solid var(--color-primary-light)',
                        fontSize: '0.8rem'
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                          {notif.title}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                          {notif.time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Быстрый переключатель роли директора и педагогов */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowNotifMenu(false);
              }}
              className="btn-secondary"
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}
              title="Переключить роль (Директор / Завуч / Учитель)"
            >
              <div className="avatar avatar-sm">
                {currentUser?.avatar || 'У'}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.1 }} className="hide-on-mobile">
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  {currentUser?.name?.split(' ')[0]} {currentUser?.name?.split(' ')[1]?.[0]}.
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary-light)' }}>
                  {currentUser?.roleTitle?.split('(')[0]?.trim()}
                </div>
              </div>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {/* Меню смены пользователей */}
            {showRoleMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '300px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 100,
                padding: '0.6rem',
                animation: 'slideUp 0.15s ease-out'
              }}>
                <div style={{
                  padding: '0.4rem 0.6rem',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '0.4rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  Педколлектив КГУ «СШ № 43»:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {staff.map(member => {
                    const isSelected = member.id === currentUser?.id;
                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          switchUser(member.id);
                          setShowRoleMenu(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.5rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isSelected ? 'var(--color-primary-bg)' : 'transparent',
                          color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <div className="avatar avatar-sm" style={{
                          backgroundColor: member.role === 'director' ? '#0369a1' : undefined
                        }}>
                          {member.avatar}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                            {member.roleTitle}
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={16} color="var(--color-primary)" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
