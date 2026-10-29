import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, 
  PlusCircle, 
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  MapPin,
  Users,
  FileText,
  CalendarCheck
} from 'lucide-react';

export default function PlannerTab({ onOpenNewMeeting, onSelectTask }) {
  const { meetings, tasks, isDirector, isHeadTeacher, currentUser, deleteMeeting, t, schoolInfo } = useAuth();
  
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month' | 'agenda'

  const handleDeleteMeeting = async (e, meetingId) => {
    e.stopPropagation();
    if (window.confirm(t('confirmDeleteMeeting'))) {
      await deleteMeeting(meetingId);
    }
  };

  // Дни недели
  const getWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const days = [];
    const dayNames = ['Дүйсенбі / Пн', 'Сейсенбі / Вт', 'Сәрсенбі / Ср', 'Бейсенбі / Чт', 'Жұма / Пт', 'Сенбі / Сб'];

    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        name: dayNames[i],
        dateStr: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        monthStr: d.toLocaleDateString('ru-RU', { month: 'short' }),
        isToday: d.toISOString().split('T')[0] === now.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const weekDays = getWeekDates();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Шапка календаря */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem 1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-primary-bg)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarDays size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {t('navPlanner')} • {schoolInfo.shortName}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('academicYear')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Переключатель Неделя / Месяц */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-surface-subtle)',
            padding: '3px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setViewMode('week')}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: viewMode === 'week' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'week' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'week' ? 600 : 400,
                boxShadow: viewMode === 'week' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {t('calendarWeek')}
            </button>
            <button
              onClick={() => setViewMode('month')}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: viewMode === 'month' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'month' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'month' ? 600 : 400,
                boxShadow: viewMode === 'month' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {t('calendarMonth')}
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: viewMode === 'agenda' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'agenda' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'agenda' ? 600 : 400,
                boxShadow: viewMode === 'agenda' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {t('calendarAgenda')}
            </button>
          </div>

          {(isDirector || isHeadTeacher) && (
            <button className="btn-primary btn-sm" onClick={onOpenNewMeeting}>
              <PlusCircle size={16} />
              {t('btnNewMeeting')}
            </button>
          )}
        </div>
      </div>

      {/* РЕЖИМ 1: НЕДЕЛЯ — СЕТКА 2x3 НА ПК (3 СТОЛБЦА, 2 СТРОКИ) */}
      {viewMode === 'week' && (
        <div className="planner-week-grid">
          {weekDays.map(day => {
            const dayMeetings = meetings.filter(m => m.date === day.dateStr && m.status !== 'cancelled');
            const dayDeadlines = tasks.filter(t => t.deadline === day.dateStr && t.status !== 'cancelled');

            return (
              <div 
                key={day.dateStr}
                className={`planner-day-card ${day.isToday ? 'today' : ''}`}
              >
                {/* Заголовок дня недели */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '0.65rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <div style={{ 
                      fontSize: '0.92rem', 
                      fontWeight: 700, 
                      color: day.isToday ? 'var(--color-primary)' : 'var(--text-primary)' 
                    }}>
                      {day.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {day.dayNum} {day.monthStr}
                    </div>
                  </div>
                  {day.isToday && (
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
                      Бүгін / Сегодня
                    </span>
                  )}
                </div>

                {/* Содержимое дня */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
                  {dayMeetings.length === 0 && dayDeadlines.length === 0 ? (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      margin: 'auto 0',
                      padding: '1.5rem 0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      opacity: 0.7
                    }}>
                      <CalendarCheck size={26} />
                      <span>Жоспар жоқ / Нет событий</span>
                    </div>
                  ) : null}

                  {/* Карточки планёрок с увеличенным визуалом */}
                  {dayMeetings.map(m => {
                    const canDelete = isDirector || m.leaderId === currentUser?.id || m.leader?.includes(currentUser?.name);

                    return (
                      <div 
                        key={m.id}
                        className="planner-meeting-card"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                              {m.typeLabel || 'Планёрка'}
                            </span>
                          </div>
                          {canDelete && (
                            <button
                              onClick={(e) => handleDeleteMeeting(e, m.id)}
                              style={{
                                padding: '3px',
                                color: 'var(--color-danger)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                opacity: 0.75,
                                borderRadius: '4px'
                              }}
                              title={t('btnDeleteMeeting')}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div style={{ 
                          fontWeight: 700, 
                          color: 'var(--color-primary-dark)', 
                          fontSize: '0.9rem',
                          lineHeight: 1.35
                        }}>
                          {m.title}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                            <Clock size={13} color="var(--color-primary)" />
                            {m.time}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={13} color="var(--text-muted)" />
                            {m.location}
                          </span>
                        </div>

                        {m.leader && (
                          <div style={{ 
                            fontSize: '0.72rem', 
                            color: 'var(--text-muted)', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.3rem' 
                          }}>
                            <Users size={12} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.leader}
                            </span>
                          </div>
                        )}

                        {Array.isArray(m.agenda) && m.agenda.length > 0 && (
                          <div style={{ 
                            fontSize: '0.72rem', 
                            color: 'var(--text-secondary)',
                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                            padding: '0.3rem 0.5rem',
                            borderRadius: '4px',
                            marginTop: '0.15rem'
                          }}>
                            <strong>Повестка:</strong> {m.agenda[0]}
                            {m.agenda.length > 1 && <span style={{ color: 'var(--text-muted)' }}> (+{m.agenda.length - 1})</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Дедлайны задач */}
                  {dayDeadlines.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className="planner-deadline-card"
                      style={{
                        backgroundColor: t.status === 'completed' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                        borderLeft: `4px solid ${t.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)'}`
                      }}
                      title="Ашу үшін басыңыз / Нажмите для просмотра"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                        <FileText size={13} color={t.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)'} />
                        <span>Есеп мерзімі:</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {t.assignedToName?.split(' ')[0]} {t.assignedToName?.split(' ')[1]?.[0]}.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* РЕЖИМ 2: МЕСЯЦ */}
      {viewMode === 'month' && (
        <div className="card">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              Айлық іс-шаралар мен жиналыстар жоспары
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Жоспарланған: {meetings.length} жиналыс
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {meetings.map(meet => {
              const canDelete = isDirector || meet.leaderId === currentUser?.id || meet.leader?.includes(currentUser?.name);

              return (
                <div key={meet.id} style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                    <span className="badge badge-primary">{meet.typeLabel}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {new Date(meet.date).toLocaleDateString('ru-RU')}
                      </span>
                      {canDelete && (
                        <button
                          onClick={(e) => handleDeleteMeeting(e, meet.id)}
                          style={{
                            padding: '3px',
                            color: 'var(--color-danger)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          title={t('btnDeleteMeeting')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0.3rem 0' }}>{meet.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    ⏰ {meet.time} • 📍 {meet.location}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <strong>Күн тәртібі:</strong>
                    <ul style={{ paddingLeft: '1.2rem', marginTop: '0.2rem' }}>
                      {meet.agenda.map((ag, i) => <li key={i}>{ag}</li>)}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* РЕЖИМ 3: ВСЕ ВСТРЕЧИ */}
      {viewMode === 'agenda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {meetings.map(m => {
            const canDelete = isDirector || m.leaderId === currentUser?.id || m.leader?.includes(currentUser?.name);

            return (
              <div key={m.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span className="badge badge-primary">{m.typeLabel}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Күні: {new Date(m.date).toLocaleDateString('ru-RU')} • Уақыты: {m.time}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                      {m.title}
                    </h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                      Өтетін орны: {m.location} • Төрағасы: {m.leader}
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={(e) => handleDeleteMeeting(e, m.id)}
                      className="btn-ghost btn-sm"
                      style={{ color: 'var(--color-danger)', gap: '0.3rem' }}
                    >
                      <Trash2 size={15} />
                      {t('btnDeleteMeeting')}
                    </button>
                  )}
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    Күн тәртібі / Повестка дня:
                  </div>
                  <ol style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {m.agenda.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ol>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
