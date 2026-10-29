import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadSchoolFile } from '../lib/storageService';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SubmitReportModal({ isOpen, onClose, task }) {
  const { currentUser, submitTaskReport, t } = useAuth();

  const [file, setFile] = useState(null);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !task) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (task.requiresFile && !file) {
      setError('Для этой задачи обязательно нужно прикрепить файл отчета (Word, Excel или PDF).');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      let fileInfo = null;
      if (file) {
        fileInfo = await uploadSchoolFile(file, task.id, currentUser.id);
      }

      await submitTaskReport(task.id, fileInfo, comment);
      setIsUploading(false);
      onClose();
      setFile(null);
      setComment('');
    } catch (err) {
      setIsUploading(false);
      setError('Не удалось загрузить файл: ' + err.message);
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      onMouseUp={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-content" 
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Upload size={20} color="var(--color-primary)" />
            <h2 className="modal-title">{t('btnSubmitReport')}</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{
              padding: '0.85rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              borderLeft: '4px solid var(--color-primary-light)'
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                {task.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Срок сдачи: <strong>{new Date(task.deadline).toLocaleDateString('ru-RU')}</strong> • Назначил: {task.createdByName}
              </div>
            </div>

            {/* Зона загрузки файла */}
            <div className="form-group">
              <label className="form-label">Құжат файлын таңдаңыз / Прикрепить документ *</label>
              <div style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: file ? 'var(--color-primary-bg)' : 'transparent',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }} onClick={() => document.getElementById('reportFileInput').click()}>
                <input
                  id="reportFileInput"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept=".doc,.docx,.xls,.xlsx,.pdf,.jpg,.jpeg,.png,.zip"
                />

                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <FileText size={32} color="var(--color-primary)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {(file.size / 1024).toFixed(1)} КБ • Ауыстыру үшін басыңыз
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Файлды таңдау үшін басыңыз
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Word (.docx), Excel (.xlsx), PDF, сканерленген құжат
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div style={{
                color: 'var(--color-danger)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Түсініктеме / Комментарий к отчету</label>
              <textarea
                rows={3}
                placeholder="Мысалы: 1 тоқсан бойынша СОР/СОЧ кестесі бекітілді..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isUploading}>
              {t('btnCancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 size={16} className="pulse" />
                  Сақталуда...
                </>
              ) : (
                t('btnSubmitReport')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
