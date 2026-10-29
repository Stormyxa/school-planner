import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, 
  PlusCircle, 
  CheckCircle2,
  XCircle 
} from 'lucide-react';

export default function PlannerTab({ onOpenNewMeeting, onSelectTask }) {
  const { meetings, tasks, isDirector, isHeadTeacher, t, schoolInfo } = useAuth();
  
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month' | 'agenda'

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

      {/* РЕЖИМ 1: НЕДЕЛЯ */}
      {viewMode === 'week' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem'
        }}>
          {weekDays.map(day => {
            const dayMeetings = meetings.filter(m => m.date === day.dateStr && m.status !== 'cancelled');
            const dayDeadlines = tasks.filter(t => t.deadline === day.dateStr && t.status !== 'cancelled');

            return (
              <div 
                key={day.dateStr}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: day.isToday ? '2px solid var(--color-primary-light)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  minHeight: '260px',
                  boxShadow: day.isToday ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: day.isToday ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                      {day.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {day.dayNum} {day.monthStr}
                    </div>
                  </div>
                  {day.isToday && (
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                      Бүгін
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  {dayMeetings.length === 0 && dayDeadlines.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 'auto 0' }}>
                      Кездесулер жоқ
                    </div>
                  ) : null}

                  {/* Планёрки */}
                  {dayMeetings.map(m => (
                    <div 
                      key={m.id}
                      style={{
                        padding: '0.6rem',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-primary-bg)',
                        borderLeft: '3px solid #0284c7',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        ⏰ {m.time}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        📍 {m.location}
                      </div>
                    </div>
                  ))}

                  {/* Дедлайны */}
                  {dayDeadlines.map(t => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      style={{
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: t.status === 'completed' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                        borderLeft: `3px solid ${t.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)'}`,
                        cursor: 'pointer',
                        fontSize: '0.76rem'
                      }}
                      title="Ашу үшін басыңыз"
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        📎 Есеп мерзімі:
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
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
            {meetings.map(meet => (
              <div key={meet.id} style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span className="badge badge-primary">{meet.typeLabel}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {new Date(meet.date).toLocaleDateString('ru-RU')}
                  </span>
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
            ))}
          </div>
        </div>
      )}

      {/* РЕЖИМ 3: ВСЕ ВСТРЕЧИ */}
      {viewMode === 'agenda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {meetings.map(m => (
            <div key={m.id} className="card" style={{ padding: '1.25rem' }}>
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
          ))}
        </div>
      )}
    </div>
  );
}
