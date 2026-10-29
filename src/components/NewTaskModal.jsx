import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckSquare, Calendar, AlertCircle } from 'lucide-react';

export default function NewTaskModal({ isOpen, onClose }) {
  const { staff, addTask, currentUser, t } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [requiresFile, setRequiresFile] = useState(true);
  const [category, setCategory] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !assignedToId) return;

    const assignedStaff = staff.find(s => s.id === assignedToId);

    addTask({
      title: title.trim(),
      description: description.trim(),
      assignedToId,
      assignedToName: assignedStaff ? assignedStaff.name : 'Педагог',
      priority,
      deadline,
      requiresFile,
      category: category.trim() || 'Жалпы'
    });

    onClose();
    setTitle('');
    setDescription('');
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
            <CheckSquare size={20} color="var(--color-primary)" />
            <h2 className="modal-title">Жаңа тапсырма / Новое поручение</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Тапсырма тақырыбы / Тема поручения *</label>
              <input
                type="text"
                required
                placeholder="Мысалы: Сдать графики проведения СОР/СОЧ за 1 четверть"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Нұсқаулық пен талаптар / Указания и требования</label>
              <textarea
                rows={3}
                placeholder="Что именно необходимо подготовить, критерии и дескрипторы..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Жауапты орындаушы / Исполнитель *</label>
                <select
                  required
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                >
                  <option value="">-- Педагогті таңдаңыз --</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.roleTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Орындау мерзімі (дедлайн) *</label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Санаты / Категория (міндетті емес)</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Жалпы / Без категории</option>
                  <option value="СОР и СОЧ">СОР и СОЧ (БЖБ/ТЖБ)</option>
                  <option value="Kundelik.kz">Kundelik.kz (Күнделік)</option>
                  <option value="Біртұтас тәрбие">Біртұтас тәрбие</option>
                  <option value="Учебные программы">Оқу бағдарламалары (КТП)</option>
                  <option value="Аттестация">Аттестация (НКТ/ОЗП)</option>
                  <option value="Безопасность">Қауіпсіздік / Безопасность</option>
                  <option value="Олимпиада">Олимпиадалар мен сайыстар</option>
                  <option value="Приказ РОНО">Бұйрық / Приказ ГорОО</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Маңыздылығы / Приоритет</label>
                <select value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="normal">{t('priorityNormal')}</option>
                  <option value="high">{t('priorityHigh')}</option>
                  <option value="urgent">{t('priorityUrgent')}</option>
                </select>
              </div>
            </div>

            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <input
                type="checkbox"
                id="reqFile"
                checked={requiresFile}
                onChange={e => setRequiresFile(e.target.checked)}
                style={{ width: 'auto', margin: 0 }}
              />
              <label htmlFor="reqFile" style={{ fontSize: '0.88rem', cursor: 'pointer', margin: 0 }}>
                <strong>Құжат файлын жүктеу міндетті</strong> (Word, Excel, PDF, сканерленген құжат)
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t('btnCancel')}
            </button>
            <button type="submit" className="btn-primary">
              {t('btnNewTask')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
