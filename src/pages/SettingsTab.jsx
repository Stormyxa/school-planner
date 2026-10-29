import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabaseClient';
import { NotificationService } from '../lib/notificationService';
import { 
  Settings, 
  Database, 
  Bell, 
  Smartphone, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { INITIAL_STAFF, INITIAL_TASKS, INITIAL_MEETINGS, INITIAL_NOTIFICATIONS } from '../lib/mockData';

const GithubIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function SettingsTab() {
  const { schoolInfo, staff, tasks, meetings, setStaff, setTasks, setMeetings } = useAuth();
  const [pushStatus, setPushStatus] = useState(NotificationService.getPermissionStatus());
  
  // Тестирование Supabase
  const [testingDb, setTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState(null);

  const isSupaActive = isSupabaseConfigured();

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
      NotificationService.send('КГУ «СШ № 43»', {
        body: 'Школьная Планёрка: уведомления успешно подключены!'
      });
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
    a.download = `kgu_sch43_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetDemoData = () => {
    if (window.confirm('Сбросить все задачи, планёрки и учителей к эталонным данным КГУ «СШ № 43»?')) {
      setStaff(INITIAL_STAFF);
      setTasks(INITIAL_TASKS);
      setMeetings(INITIAL_MEETINGS);
      localStorage.clear();
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
              <span className="badge badge-success"><CheckCircle2 size={12} /> Ключи заданы</span>
            ) : (
              <span className="badge badge-warning"><AlertCircle size={12} /> Автономный режим</span>
            )}
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {isSupaActive 
              ? 'Ключи Supabase подключены. Все действия директора и учителей синхронизируются в реальном времени.'
              : 'Приложение работает через быстрое локальное хранилище браузера (LocalStorage). Для синхронизации между разными устройствами добавьте переменные в файл .env или на Vercel:'}
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
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>PWA и Пуш-уведомления</h3>
            </div>
            {pushStatus === 'granted' ? (
              <span className="badge badge-success"><CheckCircle2 size={12} /> Разрешено</span>
            ) : (
              <span className="badge badge-neutral">Не включено</span>
            )}
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Установите ярлык планёрки на рабочий стол смартфона директора (iPhone/Android) или ПК в один клик.
          </p>

          <div style={{ marginTop: '1rem' }}>
            <button 
              className="btn-primary btn-sm"
              onClick={handleRequestPush}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Bell size={15} />
              {pushStatus === 'granted' ? 'Отправить тестовый пуш директора' : 'Запросить разрешение на уведомления'}
            </button>
          </div>
        </div>

        {/* Блок 4: Резервное копирование и сброс */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <Download size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Архив и Бэкап КГУ «СШ № 43»</h3>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Выгрузка полного архива поручений, протоколов планёрок и карточек педагогов в формате JSON.
          </p>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary btn-sm" onClick={handleExportBackup}>
              <Download size={14} />
              Скачать копию (JSON)
            </button>
            <button className="btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={handleResetDemoData}>
              <RotateCcw size={14} />
              Сброс к эталону СШ № 43
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
