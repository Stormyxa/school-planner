import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { School, Lock, User, AlertCircle, Eye, EyeOff, Globe } from 'lucide-react';

export default function LoginScreen() {
  const { loginWithCredentials, schoolInfo, lang, toggleLanguage, t } = useAuth();

  const [login, setLogin] = useState('director43');
  const [password, setPassword] = useState('school43kz');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!login.trim() || !password.trim()) return;

    setError('');
    setLoading(true);

    const res = await loginWithCredentials(login, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || t('loginError'));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '1.25rem',
      position: 'relative'
    }}>
      {/* Кнопка смены языка в углу */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem' }}>
        <button
          onClick={toggleLanguage}
          className="btn-secondary btn-sm"
          style={{ gap: '0.4rem', borderRadius: 'var(--radius-full)' }}
          title="Сменить язык (Қазақша / Русский)"
        >
          <Globe size={14} color="var(--color-primary)" />
          <strong>{lang === 'ru' ? '🇰🇿 Қазақша' : '🇷🇺 Русский'}</strong>
        </button>
      </div>

      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2rem 1.75rem',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--radius-lg)'
      }}>
        {/* Логотип школы */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto',
            boxShadow: 'var(--shadow-md)'
          }}>
            <School size={30} />
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {schoolInfo.shortName}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {lang === 'kk' ? schoolInfo.kazName : 'Кабинет директора и администрации'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--color-danger-bg)',
            color: 'var(--color-danger-text)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('loginLabel')} *</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                placeholder="director43"
                value={login}
                onChange={e => setLogin(e.target.value)}
                style={{ paddingLeft: '2.4rem' }}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('passwordLabel')} *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '2.4rem', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Вход в систему...' : t('loginButton')}
          </button>
        </form>

        {/* Памятка для директора */}
        <div style={{
          marginTop: '1.5rem',
          padding: '0.85rem',
          backgroundColor: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {t('quickDemoHint')}
          </div>
          <div>Логин: <code>director43</code></div>
          <div>Пароль: <code>school43kz</code></div>
        </div>
      </div>
    </div>
  );
}
