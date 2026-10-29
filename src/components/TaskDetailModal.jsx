import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Calendar, 
  User, 
  FileText, 
  Download, 
  CheckCircle2, 
  RotateCcw, 
  Clock, 
  Tag, 
  AlertTriangle,
  XCircle
} from 'lucide-react';

export default function TaskDetailModal({ isOpen, onClose, task, onOpenSubmitReport }) {
  const { currentUser, isDirector, isHeadTeacher, updateTaskStatus, cancelTask, t } = useAuth();
  
  const [reviewNote, setReviewNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  
  // Отмена поручения постановщиком
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  if (!isOpen || !task) return null;

  const isAssignedToMe = task.assignedToId === currentUser?.id;
  const isCreatedByMe = task.createdById === currentUser?.id;
  const canReview = isDirector || isHeadTeacher;
  const canCancel = isDirector || isCreatedByMe;

  const handleAccept = () => {
    updateTaskStatus(task.id, 'completed', {
      reviewedAt: new Date().toISOString(),
      reviewedByName: currentUser.name
    });
    onClose();
  };

  const handleReject = () => {
    if (!reviewNote.trim()) return;
    updateTaskStatus(task.id, 'revision', {
      reviewComment: reviewNote.trim(),
      reviewedAt: new Date().toISOString(),
      reviewedByName: currentUser.name
    });
    setShowRejectInput(false);
    onClose();
  };

  const handleConfirmCancel = () => {
    const reason = cancelReasonInput.trim() || 'Снято с контроля решением администрации';
    cancelTask(task.id, reason);
    setShowCancelPrompt(false);
    onClose();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success"><CheckCircle2 size={13} /> {t('statusCompleted')}</span>;
      case 'submitted':
        return <span className="badge badge-warning"><Clock size={13} /> {t('statusSubmitted')}</span>;
      case 'revision':
        return <span className="badge badge-danger"><RotateCcw size={13} /> {t('statusRevision')}</span>;
      case 'cancelled':
        return <span className="badge badge-neutral" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}><XCircle size={13} /> {t('statusCancelled')}</span>;
      case 'in_progress':
        return <span className="badge badge-primary">{t('statusInProgress')}</span>;
      default:
        return <span className="badge badge-neutral">{t('statusTodo')}</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {getStatusBadge(task.status)}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              #{task.id}
            </span>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Баннер, если поручение отменено */}
          {task.status === 'cancelled' && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderLeft: '4px solid var(--text-muted)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}>
              <XCircle size={18} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {t('taskCancelledNotice')}
                </div>
                {task.cancelReason && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {t('cancellationReason')}: <em>«{task.cancelReason}»</em>
                  </div>
                )}
              </div>
            </div>
          )}

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.3, textDecoration: task.status === 'cancelled' ? 'line-through' : 'none' }}>
            {task.title}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            padding: '0.85rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem'
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Исполнитель:</div>
              <div style={{ fontWeight: 600 }}>{task.assignedToName}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Срок (дедлайн):</div>
              <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                {new Date(task.deadline).toLocaleDateString('ru-RU')}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Категория:</div>
              <div style={{ fontWeight: 600 }}>{task.category || 'Общее'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Назначил:</div>
              <div style={{ fontWeight: 600 }}>{task.createdByName}</div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Инструкция и описание задачи:
            </h3>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
              {task.description || 'Дополнительных комментариев не указано.'}
            </p>
          </div>

          {/* Прикрепленный файл отчета */}
          {task.submittedFile ? (
            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--color-primary-bg)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={28} color="var(--color-primary)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                      {task.submittedFile.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Размер: {task.submittedFile.size} • Загружен: {task.submittedFile.date}
                    </div>
                  </div>
                </div>

                <a
                  href={task.submittedFile.url}
                  download={task.submittedFile.name}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <Download size={15} />
                  {t('btnDownload')}
                </a>
              </div>

              {task.teacherComment && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Комментарий учителя:</strong> «{task.teacherComment}»
                </div>
              )}
            </div>
          ) : task.requiresFile && task.status !== 'cancelled' ? (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-warning-bg)',
              color: 'var(--color-warning-text)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1.25rem'
            }}>
              <AlertTriangle size={18} />
              <span>Файл отчета еще не прикреплен исполнителем.</span>
            </div>
          ) : null}

          {/* Замечание директора, если возвращали на доработку */}
          {task.reviewComment && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger-text)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}>
              <strong>Замечание директора:</strong> {task.reviewComment}
            </div>
          )}

          {/* Форма подтверждения отмены поручения */}
          {showCancelPrompt && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-danger)' }}>
                {t('cancelReasonLabel')}
              </label>
              <textarea
                rows={2}
                placeholder={t('cancelReasonPlaceholder')}
                value={cancelReasonInput}
                onChange={e => setCancelReasonInput(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                <button className="btn-danger btn-sm" onClick={handleConfirmCancel}>
                  <XCircle size={14} />
                  {t('btnConfirmCancel')}
                </button>
                <button className="btn-secondary btn-sm" onClick={() => setShowCancelPrompt(false)}>
                  {t('btnCancel')}
                </button>
              </div>
            </div>
          )}

          {/* Форма отправки на доработку */}
          {showRejectInput && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <label className="form-label">Укажите, что именно нужно исправить или дополнить:</label>
              <textarea
                rows={2}
                placeholder="Не заполнены графы СОЧ, скорректируйте..."
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                <button className="btn-danger btn-sm" onClick={handleReject}>
                  Отправить замечание
                </button>
                <button className="btn-secondary btn-sm" onClick={() => setShowRejectInput(false)}>
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {/* Кнопка сдачи отчета учителем */}
            {isAssignedToMe && task.status !== 'completed' && task.status !== 'cancelled' && (
              <button 
                className="btn-primary" 
                onClick={() => {
                  onClose();
                  onOpenSubmitReport(task);
                }}
              >
                <FileText size={16} />
                {task.submittedFile ? 'Заменить сданный отчет' : t('btnSubmitReport')}
              </button>
            )}

            {/* КНОПКА ОТМЕНЫ ПОРУЧЕНИЯ ПОСТАНОВЩИКОМ / ДИРЕКТОРОМ */}
            {canCancel && task.status !== 'completed' && task.status !== 'cancelled' && !showCancelPrompt && (
              <button
                type="button"
                className="btn-ghost btn-sm"
                style={{ color: 'var(--color-danger)', border: '1px solid var(--border-subtle)' }}
                onClick={() => setShowCancelPrompt(true)}
                title="Отменить задачу (исполнитель получит уведомление об отмене)"
              >
                <XCircle size={15} />
                {t('btnCancelTask')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {canReview && task.status === 'submitted' && !showRejectInput && (
              <>
                <button 
                  className="btn-secondary" 
                  style={{ color: 'var(--color-danger)' }}
                  onClick={() => setShowRejectInput(true)}
                >
                  <RotateCcw size={16} />
                  {t('btnRejectReport')}
                </button>
                <button className="btn-success" onClick={handleAccept}>
                  <CheckCircle2 size={16} />
                  {t('btnAcceptReport')}
                </button>
              </>
            )}
            <button className="btn-secondary" onClick={onClose}>
              {t('btnClose')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
