import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, AlertTriangle, CheckCircle, FileText, X } from 'lucide-react';

export default function NotificationToast() {
  const { toast, dismissToast } = useAuth();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'urgent':
        return <AlertTriangle size={20} color="#e11d48" />;
      case 'meeting':
        return <Bell size={20} color="#0284c7" />;
      case 'file':
        return <FileText size={20} color="#7c3aed" />;
      default:
        return <CheckCircle size={20} color="#059669" />;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '5rem',
      right: '1rem',
      zIndex: 9999,
      maxWidth: 'min(380px, calc(100vw - 2rem))',
      width: '100%',
      backgroundColor: 'var(--bg-surface-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-xl)',
      padding: '0.85rem 1rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      borderLeft: toast.type === 'urgent' ? '4px solid #e11d48' : '4px solid #0284c7'
    }}>
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {getIcon()}
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          {toast.title}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.35, wordBreak: 'break-word' }}>
          {toast.message}
        </div>
      </div>

      <button
        onClick={dismissToast}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '0.2rem',
          flexShrink: 0
        }}
        title="Закрыть"
      >
        <X size={16} />
      </button>
    </div>
  );
}
