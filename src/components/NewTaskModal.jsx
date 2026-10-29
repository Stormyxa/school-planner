import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CheckSquare, Calendar, AlertCircle } from 'lucide-react';

export default function NewTaskModal({ isOpen, onClose }) {
  const { staff, addTask, currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [priority, setPriority] = useState('normal'); // 'normal' | 'high' | 'urgent'
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [requiresFile, setRequiresFile] = useState(true);
  const [category, setCategory] = useState('Отчетность');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !assignedToId) return;

    const assignedStaff = staff.find(s => s.id === assignedToId);

    addTask({
      title: title.trim(),
      description: description.trim(),
      assignedToId,
      assignedToName: assignedStaff ? assignedStaff.name : 'Сотрудник',
      priority,
      deadline,
      requiresFile,
      category
    });

    onClose();
    setTitle('');
    setDescription('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckSquare size={20} color="var(--color-primary)" />
            <h2 className="modal-title">Новое школьное поручение</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Тема / Название поручения *</label>
              <input
                type="text"
                required
                placeholder="Например: Сдать отчет по успеваемости за 1 четверть"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Подробные указания и требования</label>
              <textarea
                rows={3}
                placeholder="Что именно необходимо подготовить, по какой форме..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Ответственный исполнитель *</label>
                <select
                  required
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                >
                  <option value="">-- Выберите учителя / завуча --</option>
                  {staff.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.roleTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Срок выполнения (дедлайн) *</label>
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
                <label className="form-label">Категория</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Отчетность">Отчетность</option>
                  <option value="Учебные программы">Учебные программы</option>
                  <option value="Безопасность">Безопасность</option>
                  <option value="Олимпиады и конкурсы">Олимпиады и конкурсы</option>
                  <option value="Воспитательная работа">Воспитательная работа</option>
                  <option value="Приказ РОНО">Приказ РОНО / ГОРОНО</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Приоритет</label>
                <select value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="normal">Обычный</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочно (Приказ)</option>
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
                <strong>Требуется прикрепление файла документа</strong> (Word, Excel, скан или PDF)
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Назначить поручение
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
