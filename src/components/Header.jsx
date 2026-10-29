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
    isCloudSyncing,
    refreshData,
    deferredPrompt,
    isPwaInstalled,
    promptPwaInstall
  } = useAuth();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleInstallClick = async () => {
    const res = await promptPwaInstall();
    if (!res.success && res.isIos) {
      setShowInstallGuide(true);
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
        {/* Логотип школы КГУ «СШ № 43» */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%)',
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
                <span className="badge badge-warning pulse" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <RefreshCw size={10} className="pulse" />
                  Live
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
              {lang === 'kk' ? schoolInfo.kazName : schoolInfo.name}
            </p>
          </div>
        </div>

        {/* Действия: Язык, Kundelik, Установка PWA, Тема, Уведомления, Профиль, Выход */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Кнопка ручной синхронизации */}
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
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              gap: '0.35rem',
              fontWeight: 600,
              fontSize: '0.78rem'
            }}
            title="Тілді өзгерту / Сменить язык"
          >
            <Globe size={14} color="#0284c7" />
            <span>{lang === 'ru' ? 'ҚАЗ' : 'РУС'}</span>
          </button>

          {/* Быстрая ссылка на Kundelik.kz */}
          <a
            href="https://kundelik.kz"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary btn-sm hide-on-mobile"
            style={{ textDecoration: 'none', fontSize: '0.78rem', color: '#0284c7', borderColor: '#bae6fd' }}
            title="Kundelik.kz электронды журналы"
          >
            <BookOpen size={14} />
            Kundelik.kz
            <ExternalLink size={11} style={{ opacity: 0.6 }} />
          </a>

          {/* Кнопка установки PWA на ПК / Смартфон */}
          {!isPwaInstalled && (deferredPrompt || /iPad|iPhone|iPod|Android/.test(navigator.userAgent)) && (
            <button 
              className="btn-primary btn-sm"
              onClick={handleInstallClick}
              title="Установить приложение на ПК или телефон"
              style={{ fontSize: '0.78rem', gap: '0.35rem', backgroundColor: '#0284c7' }}
            >
              <MonitorDown size={14} />
              <span className="hide-on-mobile">{t('btnInstallDesktop') || 'Установить'}</span>
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
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              style={{ position: 'relative' }}
              title="Хабарламалар"
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
                      Оқу / Прочитать
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
            )}
          </div>

          {/* Профиль текущего пользователя */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div className="avatar avatar-sm" style={{ backgroundColor: '#0284c7' }}>
              {currentUser?.avatar || 'У'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.1 }} className="hide-on-mobile">
              <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {currentUser?.name?.split(' ')[0]} {currentUser?.name?.split(' ')[1]?.[0]}.
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-primary-light)' }}>
                {currentUser?.roleTitle?.split('(')[0]?.trim()}
              </div>
            </div>

            {/* Кнопка выхода */}
            <button
              onClick={logout}
              className="btn-ghost"
              style={{ padding: '0.25rem', color: 'var(--color-danger)' }}
              title={t('logout')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно инструкций по установке для iOS */}
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
    </header>
  );
}
