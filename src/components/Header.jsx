import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../lib/notificationService';
import { 
  Bell, 
  Moon, 
  Sun, 
  School, 
  ExternalLink, 
  BookOpen, 
  Globe, 
  LogOut, 
  MonitorDown,
  RefreshCw,
  Smartphone
} from 'lucide-react';

export default function Header() {
  const { 
    schoolInfo,
    currentUser, 
    theme, 
    toggleTheme, 
    lang,
    toggleLanguage,
    t,
    logout,
    notifications,
    markAllNotificationsRead,
    refreshData,
    isCloudSyncing,
    deferredPrompt,
    isPwaInstalled,
    promptPwaInstall,
    showToast
  } = useAuth();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [pushStatus, setPushStatus] = useState(() => NotificationService.getPermissionStatus());

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleInstallClick = async () => {
    const res = await promptPwaInstall();
    if (!res.success && res.isIos) {
      setShowInstallGuide(true);
    }
  };

  const handleRequestPush = async () => {
    const granted = await NotificationService.requestPermission();
    const updatedStatus = NotificationService.getPermissionStatus();
    setPushStatus(updatedStatus);

    if (granted) {
      showToast(schoolInfo.shortName, 'Хабарламалар қосылды! / Уведомления успешно включены!');
      NotificationService.send(schoolInfo.shortName, {
        body: 'Уведомления включены! Вы будете вовремя узнавать о поручениях директора и сроках сдачи СОР/СОЧ.'
      });
    } else {
      showToast(
        'Хабарламалар / Уведомления',
        'Браузер параметрлерінен рұқсат беріңіз / Разрешите уведомления в настройках браузера',
        'urgent'
      );
    }
  };

  return (
    <>
      <header style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
        background: 'var(--bg-surface-glass)',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.65rem',
          paddingBottom: '0.65rem',
          flexWrap: 'nowrap',
          gap: '0.5rem',
          boxSizing: 'border-box'
        }}>
          {/* Логотип школы КГУ «СШ № 43» */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0
            }}>
              <School size={20} />
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h1 style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {schoolInfo.shortName}
                </h1>
                <span className="badge badge-primary hide-on-mobile" style={{ fontSize: '0.65rem', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                  Планёрка
                </span>
              </div>
              <p style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {lang === 'kk' ? schoolInfo.kazName : schoolInfo.name}
              </p>
            </div>
          </div>

          {/* Правая панель действий */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            {/* Ручная синхронизация */}
            <button
              onClick={() => refreshData()}
              className="btn-ghost btn-icon hide-on-mobile"
              title="Синхронизировать с базой Supabase"
              style={{ padding: '0.4rem' }}
            >
              <RefreshCw size={16} className={isCloudSyncing ? 'pulse' : ''} />
            </button>

            {/* Переключатель языка: 🇰🇿 ҚАЗ / 🇷🇺 РУС */}
            <button
              onClick={toggleLanguage}
              className="btn-secondary btn-sm"
              style={{
                padding: '0.3rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                gap: '0.25rem',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
              title="Тілді өзгерту / Сменить язык"
            >
              <Globe size={13} color="#0284c7" />
              <span>{lang === 'ru' ? 'ҚАЗ' : 'РУС'}</span>
            </button>

            {/* Kundelik.kz */}
            <a
              href="https://kundelik.kz"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-sm hide-on-mobile"
              style={{ textDecoration: 'none', fontSize: '0.75rem', color: '#0284c7', borderColor: '#bae6fd', padding: '0.3rem 0.55rem' }}
              title="Kundelik.kz электронды журналы"
            >
              <BookOpen size={13} />
              Kundelik
              <ExternalLink size={10} style={{ opacity: 0.6 }} />
            </a>

            {/* Кнопка установки PWA */}
            {!isPwaInstalled && (deferredPrompt || /iPad|iPhone|iPod|Android/.test(navigator.userAgent)) && (
              <button 
                className="btn-primary btn-sm"
                onClick={handleInstallClick}
                title="Установить приложение на ПК или телефон"
                style={{ fontSize: '0.75rem', gap: '0.3rem', backgroundColor: '#0284c7', padding: '0.3rem 0.6rem' }}
              >
                <MonitorDown size={13} />
                <span className="hide-on-mobile">{t('btnInstallDesktop') || 'Установить'}</span>
              </button>
            )}

            {/* Тема */}
            <button 
              className="btn-ghost btn-icon"
              onClick={toggleTheme}
              aria-label="Сменить тему"
              style={{ padding: '0.4rem' }}
              title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#f59e0b" />}
            </button>

            {/* Колокольчик уведомлений */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn-ghost btn-icon"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                style={{ position: 'relative', padding: '0.4rem' }}
                title="Хабарламалар"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: 'var(--color-danger)',
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    width: '16px',
                    height: '16px',
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

              {/* Выпадающее окно уведомлений (поверх всех элементов на ПК и телефоне) */}
              {showNotifMenu && (
                <>
                  <div 
                    onClick={() => setShowNotifMenu(false)}
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      zIndex: 9998
                    }}
                  />
                  <div className="notifications-dropdown" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 'min(340px, calc(100vw - 1.5rem))',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xl)',
                    zIndex: 9999,
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
                          Оқу / Прочитать
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {notifications.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                          Жаңа хабарлама жоқ / Нет уведомлений
                        </p>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} style={{
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: notif.read ? 'transparent' : 'var(--bg-surface-subtle)',
                            borderLeft: notif.read ? '2px solid transparent' : '3px solid #0284c7',
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
                </>
              )}
            </div>

            {/* Профиль текущего пользователя */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div className="avatar avatar-sm" style={{ backgroundColor: '#0284c7', width: '26px', height: '26px', fontSize: '0.7rem' }}>
                {currentUser?.avatar || 'У'}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.1 }} className="hide-on-mobile">
                <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                  {currentUser?.name?.split(' ')[0]} {currentUser?.name?.split(' ')[1]?.[0]}.
                </div>
              </div>

              {/* Кнопка выхода */}
              <button
                onClick={logout}
                className="btn-ghost"
                style={{ padding: '0.2rem', color: 'var(--color-danger)' }}
                title={t('logout')}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* БАННЕР ПРЕДЛОЖЕНИЯ ВКЛЮЧИТЬ УВЕДОМЛЕНИЯ (ПОДДЕРЖИВАЕТ И СВЕТЛУЮ, И ТЁМНУЮ ТЕМУ) */}
      {pushStatus !== 'granted' && (
        <div style={{
          backgroundColor: 'var(--color-primary-bg)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.55rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100vw'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            <Bell size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Уведомления выключены:</strong> Включите пуши, чтобы вовремя узнавать о поручениях директора и планёрках!
            </span>
          </div>
          <button
            onClick={handleRequestPush}
            className="btn-primary btn-sm"
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.78rem',
              backgroundColor: '#0284c7',
              flexShrink: 0
            }}
          >
            Включить / Қосу
          </button>
        </div>
      )}

      {/* Модальное окно установки для iOS Safari */}
      {showInstallGuide && (
        <div className="modal-backdrop" onClick={() => setShowInstallGuide(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', margin: '0 auto 1rem', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={26} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Установка на iPhone / iPad (iOS)
            </h3>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              1. Нажмите кнопку <strong>«Поделиться»</strong> (квадрат со стрелкой вверх) в нижней панели Safari.<br />
              2. Прокрутите список вниз и выберите <strong>«На экран Домой»</strong> (+).<br />
              3. Нажмите <strong>«Добавить»</strong> в правом верхнем углу.<br />
              Иконка школы появится на рабочем столе вашего телефона!
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowInstallGuide(false)}>
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
}
