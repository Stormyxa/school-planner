import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, CalendarDays, Plus, Trash2 } from 'lucide-react';

export default function NewMeetingModal({ isOpen, onClose }) {
  const { addMeeting, t } = useAuth();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('planerka');
  const [date, setDate] = useState(
    new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [time, setTime] = useState('08:30 – 09:15');
  const [location, setLocation] = useState('Кабинет директора (№ 201)');
  const [agendaInput, setAgendaInput] = useState('');
  const [agenda, setAgenda] = useState([
    'Мониторинг своевременности ведения Kundelik.kz',
    'График проведения СОР/СОЧ за 1 четверть'
  ]);

  if (!isOpen) return null;

  const handleAddAgendaItem = () => {
    if (agendaInput.trim()) {
      setAgenda([...agenda, agendaInput.trim()]);
      setAgendaInput('');
    }
  };

  const handleRemoveAgenda = (idx) => {
    setAgenda(agenda.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const typeLabels = {
      planerka: 'Планёрка администрации',
      pedsovet: 'Педагогический совет',
      soveshanie: 'Совещание при директоре',
      shkola: 'Общешкольное собрание'
    };

    addMeeting({
      title: title.trim(),
      type,
      typeLabel: typeLabels[type] || 'Совещание',
      date,
      time,
      location,
      agenda,
      participants: ['Администрация школы', 'Руководители МО']
    });

    onClose();
    setTitle('');
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
            <CalendarDays size={20} color="var(--color-primary)" />
            <h2 className="modal-title">Жиналыс белгілеу / Назначить планёрку</h2>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Кездесу тақырыбы / Тема встречи *</label>
              <input
                type="text"
                required
                placeholder="Мысалы: Аппаратная планёрка: мониторинг Kundelik.kz"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Тип мероприятия</label>
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="planerka">Планёрка администрации</option>
                  <option value="pedsovet">Педагогический совет</option>
                  <option value="soveshanie">Совещание при директоре</option>
                  <option value="shkola">Жалпы мектептік жиналыс</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Күні / Дата проведения *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Уақыты / Время</label>
                <input
                  type="text"
                  placeholder="08:30 – 09:15"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Өтетін орны / Место</label>
                <input
                  type="text"
                  placeholder="Кабинет директора (№ 201)"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Күн тәртібі / Повестка дня</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <input
                  type="text"
                  placeholder="Добавить пункт повестки..."
                  value={agendaInput}
                  onChange={e => setAgendaInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAgendaItem();
                    }
                  }}
                />
                <button type="button" className="btn-secondary" onClick={handleAddAgendaItem}>
                  <Plus size={16} />
                </button>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {agenda.map((item, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.85rem'
                  }}>
                    <span>{idx + 1}. {item}</span>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '0.2rem', color: 'var(--color-danger)' }}
                      onClick={() => handleRemoveAgenda(idx)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t('btnCancel')}
            </button>
            <button type="submit" className="btn-primary">
              {t('btnSave')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
