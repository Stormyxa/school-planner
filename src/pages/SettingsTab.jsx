import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabaseClient';
import { NotificationService } from '../lib/notificationService';
import { 
  Settings, 
  Database, 
  Bell, 
  Smartphone, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Loader2,
  Trash2,
  Wifi
} from 'lucide-react';

// Проверка, запущено ли приложение в Tauri
const isTauri = window.__TAURI__ !== undefined;

const GithubIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function SettingsTab() {
  const { schoolInfo, staff, tasks, meetings, logout, currentUser, showToast } = useAuth();
  const [pushStatus, setPushStatus] = useState(NotificationService.getPermissionStatus());
  const [testingPush, setTestingPush] = useState(false);
  const [pushTestResult, setPushTestResult] = useState(null);
  const [deviceEndpoint, setDeviceEndpoint] = useState(null); // endpoint этого устройства
  const [registering, setRegistering] = useState(false);
  
  // Тестирование Supabase
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState(null);

  // Состояние уведомлений (для Tauri desktop app)
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('sp_notifications_enabled');
    return saved !== 'false'; // По умолчанию включены
  });

  const isSupaActive = isSupabaseConfigured();

  // Сохранение состояния уведомлений
  useEffect(() => {
    localStorage.setItem('sp_notifications_enabled', notificationsEnabled.toString());
  }, [notificationsEnabled]);

  // Обработка события из Tauri tray menu
  useEffect(() => {
    if (isTauri && window.__TAURI__) {
      const unlisten = window.__TAURI__.event.listen('toggle-notifications', () => {
        setNotificationsEnabled(prev => !prev);
      });
      return () => {
        unlisten.then(fn => fn());
      };
    }
  }, []);

  // ─── АВТОМАТИЧЕСКАЯ РЕГИСТРАЦИЯ ПРИ ОТКРЫТИИ НАСТРОЕК ──────────────────────
  // В Tauri Desktop App уведомления всегда включены (приложение в трее)
  // Запускаем при каждом открытии SettingsTab чтобы убедиться что ЭТОТ браузер зарегистрирован
  useEffect(() => {
    let isMounted = true;

    const autoRegister = async () => {
      // 1. Узнать текущий endpoint этого браузера (без запроса разрешения)
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub && isMounted) {
            setDeviceEndpoint(sub.endpoint);
          }
        }
      } catch { /* ignore */ }

      // 2. В desktop app (Tauri) всегда тихо регистрируем токен устройства без запроса разрешения
      if (currentUser) {
        setRegistering(true);
        try {
          const sub = await NotificationService.subscribePush(currentUser);
          if (sub && isMounted) {
            setDeviceEndpoint(sub.endpoint);
          }
        } catch { /* ignore */ } finally {
          if (isMounted) setRegistering(false);
        }
      }
    };

    autoRegister();
    return () => { isMounted = false; };
  }, [currentUser]);

  const handleRunDbTest = async () => {
    setTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setDbTestResult(res);
    } finally {
      setTestingDb(false);
    }
  };

  const handleRequestPush = async () => {
    const granted = await NotificationService.requestPermission();
    setPushStatus(NotificationService.getPermissionStatus());
    if (granted) {
      if (currentUser) {
        setRegistering(true);
        try {
          const sub = await NotificationService.subscribePush(currentUser);
          if (sub) setDeviceEndpoint(sub.endpoint);
        } finally {
          setRegistering(false);
        }
      }
      showToast?.(schoolInfo.shortName, 'Web Push уведомления успешно подключены!');
    } else {
      showToast?.('Уведомления', 'Разрешите уведомления в настройках вашего браузера/устройства', 'urgent');
    }
  };

  const handleReRegister = async () => {
    setRegistering(true);
    try {
      const sub = await NotificationService.subscribePush(currentUser);
      if (sub) {
        setDeviceEndpoint(sub.endpoint);
        showToast?.(schoolInfo.shortName, 'Токен устройства успешно обновлен в базе!');
      } else {
        showToast?.('Push', 'Не удалось зарегистрировать. Проверьте разрешения браузера.', 'urgent');
      }
    } finally {
      setRegistering(false);
    }
  };



  const handleExportBackup = () => {
    const backupData = {
      school: schoolInfo,
      timestamp: new Date().toISOString(),
      staff,
      tasks,
      meetings
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kgu_sch43_archive_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLocalCache = () => {
    if (window.confirm('Очистить локальный кэш браузера и перезагрузить сессию?')) {
      localStorage.clear();
      logout();
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Шапка */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--color-primary-bg)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Settings size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
            Интеграции и Системные настройки • {schoolInfo.shortName}
          </h2>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Связь с Supabase PostgreSQL, архивом документов GitHub и PWA пушами
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Блок 1: Supabase */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Database size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>База данных Supabase</h3>
            </div>
            {isSupaActive ? (
              <span className="badge badge-success"><CheckCircle2 size={12} /> Активно</span>
            ) : (
              <span className="badge badge-warning"><AlertCircle size={12} /> Локальное хранилище</span>
            )}
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {isSupaActive 
              ? 'Ключи Supabase подключены. Все действия директора и учителей синхронизируются в реальном времени в облаке.'
              : 'Для постоянной синхронизации между устройствами укажите ключи в .env или на Vercel:'}
          </p>

          <div style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            padding: '0.65rem 0.8rem',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            margin: '0.75rem 0',
            lineHeight: 1.4
          }}>
            VITE_SUPABASE_URL=https://your-id.supabase.co<br />
            VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
          </div>

          {/* Кнопка тестирования связи */}
          <div style={{ marginTop: '0.75rem' }}>
            <button 
              className="btn-secondary btn-sm"
              onClick={handleRunDbTest}
              disabled={testingDb}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {testingDb ? <Loader2 size={14} className="pulse" /> : <RefreshCw size={14} />}
              Проверить связь с базой Supabase
            </button>

            {dbTestResult && (
              <div style={{
                marginTop: '0.65rem',
                padding: '0.65rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: dbTestResult.connected ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                color: dbTestResult.connected ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.45rem'
              }}>
                {dbTestResult.connected ? <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />}
                <div>{dbTestResult.message}</div>
              </div>
            )}
          </div>
        </div>

        {/* Блок 2: GitHub Storage */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <GithubIcon size={20} color="var(--text-primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>GitHub Файловый Архив</h3>
            </div>
            <span className="badge badge-success">Бесплатно</span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Файлы отчетов (Word, Excel, PDF, сканы СОР/СОЧ) учителей сохраняются в выделенный GitHub-репозиторий через Vercel Serverless API (`/api/upload`).
          </p>

          <div style={{
            backgroundColor: 'var(--bg-surface-subtle)',
            padding: '0.65rem 0.8rem',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            margin: '0.75rem 0',
            lineHeight: 1.4
          }}>
            GITHUB_STORAGE_REPO=Stormyxa/school-archive-storage<br />
            GITHUB_STORAGE_TOKEN=ghp_...
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Настраивается в панели Vercel (Settings → Environment Variables) и защищен от учителей.
          </div>
        </div>

        {/* Блок 3: PWA & Уведомления */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Smartphone size={20} color="var(--color-primary-light)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>PWA и W3C Web Push</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {registering && <Loader2 size={14} className="pulse" style={{ color: 'var(--color-primary)' }} />}
              {isTauri ? (
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="btn-secondary btn-sm"
                  style={{ gap: '0.4rem', color: notificationsEnabled ? '#059669' : '#64748b' }}
                >
                  <Bell size={14} />
                  {notificationsEnabled ? 'Включены' : 'Отключены'}
                </button>
              ) : pushStatus === 'granted' ? (
                <span className="badge badge-success"><CheckCircle2 size={12} /> Разрешено</span>
              ) : (
                <span className="badge badge-neutral">Не включено</span>
              )}
            </div>
          </div>

          {/* Статус регистрации этого устройства */}
          {pushStatus === 'granted' && (
            <div style={{
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: deviceEndpoint ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
              color: deviceEndpoint ? 'var(--color-success-text)' : 'var(--color-warning-text)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              {deviceEndpoint
                ? <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                : <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              }
              <div>
                {deviceEndpoint ? (
                  <>
                    <strong>Это устройство зарегистрировано</strong><br />
                    <span style={{ fontSize: '0.71rem', opacity: 0.8 }}>
                      {deviceEndpoint.replace('https://fcm.googleapis.com/fcm/send/', 'FCM: ').substring(0, 55)}...
                    </span>
                  </>
                ) : (
                  <>
                    <strong>Это устройство НЕ зарегистрировано</strong> — нажмите «Перерегистрировать»
                  </>
                )}
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            В Desktop App уведомления всегда включены (приложение в системном трее). Токен устройства автоматически регистрируется для получения push-уведомлений.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
            <button 
              className="btn-secondary btn-sm"
              onClick={handleReRegister}
              disabled={registering}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {registering ? <Loader2 size={14} className="pulse" /> : <RefreshCw size={13} />}
              {registering ? 'Регистрация...' : 'Перерегистрировать это устройство'}
            </button>

            <button 
              className="btn-ghost btn-sm"
              onClick={async () => {
                setTestingPush(true);
                setPushTestResult(null);
                showToast?.('Тест Web Push', 'Через 3 сек придёт пуш — заблокируйте экран!', 'task');
                if (currentUser) await NotificationService.subscribePush(currentUser);
                try {
                  const res = await NotificationService.sendTestWebPush(currentUser, 3);
                  if (res && res.sent > 0) {
                    setPushTestResult({ success: true, message: `FCM принял пуш (устройств: ${res.sent}). Если на экране блокировки НЕ появился — читай инструкцию ниже.` });
                  } else {
                    setPushTestResult({ success: false, message: `Пуш не принят FCM: ${res?.reason || res?.error || 'устройство не зарегистрировано'}` });
                  }
                } catch (e) {
                  setPushTestResult({ success: false, message: e.message });
                } finally {
                  setTestingPush(false);
                }
              }}
              disabled={testingPush}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
            >
              {testingPush ? <Loader2 size={14} className="pulse" /> : <Bell size={13} />}
              {testingPush ? 'Отправка через 3с (заблокируй экран)...' : 'Тест фонового пуша (заблокируй экран)'}
            </button>

            {pushTestResult && (
              <div style={{
                padding: '0.65rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: pushTestResult.success ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                color: pushTestResult.success ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.45rem'
              }}>
                {pushTestResult.success ? <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '2px' }} /> : <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />}
                <div>{pushTestResult.message}</div>
              </div>
            )}

            {/* Инструкции для фонового получения пушей */}
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                <Wifi size={13} />
                Если пуши не приходят при закрытом приложении:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div>
                  <strong>📱 Android:</strong> Настройки → Приложения → Chrome → Батарея → выбери <strong>«Без ограничений»</strong>. Стандартный режим блокирует FCM.
                </div>
                <div>
                  <strong>💻 ПК (Windows/Mac):</strong> В Chrome: Настройки → Дополнительно → Система → включи <strong>«Запускать фоновые приложения после закрытия»</strong>.
                </div>
                <div>
                  <strong>🍎 iPhone/iPad:</strong> Установи PWA через Safari «Поделиться → На экран Домой», запускай только через иконку PWA. Требуется iOS 16.4+.
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Блок 4: Резервное копирование и кэш */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <Download size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Резервная копия школы</h3>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Выгрузка полного архива поручений, протоколов планёрок и карточек педагогов в формате JSON на компьютер директора.
          </p>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary btn-sm" onClick={handleExportBackup}>
              <Download size={14} />
              Скачать копию (JSON)
            </button>
            <button className="btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={handleClearLocalCache}>
              <Trash2 size={14} />
              Очистить локальный кэш
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
