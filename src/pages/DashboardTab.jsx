import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CalendarDays, 
  FileText, 
  TrendingUp, 
  ArrowRight,
  PlusCircle,
  FileCheck
} from 'lucide-react';

export default function DashboardTab({ onSelectTask, onOpenNewTask, setActiveTab }) {
  const { tasks, meetings, currentUser, isDirector, isHeadTeacher } = useAuth();

  // Расчет статистики
  const totalTasks = tasks.length;
  const pendingReview = tasks.filter(t => t.status === 'submitted').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = tasks.filter(t => t.deadline < todayStr && t.status !== 'completed').length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Мои задачи (для текущего пользователя)
  const myTasks = tasks.filter(t => t.assignedToId === currentUser.id);
  const myPendingTasks = myTasks.filter(t => t.status !== 'completed');

  // Ближайшие встречи
  const upcomingMeetings = [...meetings]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Приветственный блок */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.5rem 1.75rem'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
            Здравствуйте, {currentUser.name}!
          </h2>
          <p style={{ opacity: 0.9, marginTop: '0.35rem', fontSize: '0.95rem' }}>
            {isDirector 
              ? 'Контроль работы школы: 1 четверть. Проверьте сданные учителями отчеты и планёрки.'
              : isHeadTeacher
              ? 'Координация учебного процесса и мониторинг исполнения поручений.'
              : `У вас ${myPendingTasks.length} активных поручений на этой неделе.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(isDirector || isHeadTeacher) ? (
            <button 
              className="btn-secondary" 
              onClick={onOpenNewTask}
              style={{ backgroundColor: '#ffffff', color: 'var(--color-primary-dark)', fontWeight: 600 }}
            >
              <PlusCircle size={18} />
              Новое поручение
            </button>
          ) : (
            <button 
              className="btn-secondary" 
              onClick={() => setActiveTab('tasks')}
              style={{ backgroundColor: '#ffffff', color: 'var(--color-primary-dark)', fontWeight: 600 }}
            >
              Мои дедлайны ({myPendingTasks.length})
            </button>
          )}
        </div>
      </div>

      {/* Метрики и сводка */}
      <div className="grid-cols-auto">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Сдано на проверку
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '0.2rem' }}>
                {pendingReview}
              </div>
            </div>
            <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-warning-bg)' }}>
              <FileCheck size={22} color="var(--color-warning)" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.6rem' }}>
            {pendingReview > 0 ? 'Требуется утверждение директором' : 'Все поступившие отчеты проверены'}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Срочно / Просрочено
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: overdueTasks > 0 ? 'var(--color-danger)' : 'var(--text-primary)', marginTop: '0.2rem' }}>
                {overdueTasks + urgentTasks}
              </div>
            </div>
            <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-danger-bg)' }}>
              <AlertTriangle size={22} color="var(--color-danger)" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.6rem' }}>
            Просрочено: {overdueTasks} • Срочных: {urgentTasks}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Всего поручений
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-primary-light)', marginTop: '0.2rem' }}>
                {totalTasks}
              </div>
            </div>
            <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-bg)' }}>
              <CheckCircle2 size={22} color="var(--color-primary-light)" />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.6rem' }}>
            Завершено {completedTasks} из {totalTasks}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Исполнительская дисциплина
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.2rem' }}>
                {completionRate}%
              </div>
            </div>
            <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-success-bg)' }}>
              <TrendingUp size={22} color="var(--color-success)" />
            </div>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            marginTop: '0.6rem',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${completionRate}%`,
              height: '100%',
              backgroundColor: 'var(--color-success)',
              borderRadius: 'var(--radius-full)'
            }} />
          </div>
        </div>
      </div>

      {/* Две колонки: Задачи на контроле + Ближайшие планёрки */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Колонка 1: Актуальные поручения */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              {isDirector || isHeadTeacher ? 'Поручения на контроле' : 'Мои текущие задачи'}
            </h3>
            <button 
              className="btn-ghost btn-sm" 
              onClick={() => setActiveTab('tasks')}
              style={{ color: 'var(--color-primary-light)' }}
            >
              Все поручения <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {(isDirector || isHeadTeacher ? tasks : myTasks).slice(0, 4).map(task => {
              const isOverdue = task.deadline < todayStr && task.status !== 'completed';
              return (
                <div 
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="card-interactive"
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: isOverdue ? 'var(--color-danger-bg)' : 'var(--bg-surface-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {task.assignedToName} • до {new Date(task.deadline).toLocaleDateString('ru-RU')}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {task.status === 'completed' && <span className="badge badge-success">Принято</span>}
                    {task.status === 'submitted' && <span className="badge badge-warning">На проверке</span>}
                    {task.status === 'in_progress' && <span className="badge badge-primary">В работе</span>}
                    {task.status === 'todo' && <span className="badge badge-neutral">Новое</span>}
                    {task.status === 'revision' && <span className="badge badge-danger">Доработка</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Колонка 2: Ближайшие планёрки и совещания */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              Планёрки и совещания
            </h3>
            <button 
              className="btn-ghost btn-sm" 
              onClick={() => setActiveTab('planner')}
              style={{ color: 'var(--color-primary-light)' }}
            >
              Расписание <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingMeetings.map(meet => (
              <div key={meet.id} style={{
                padding: '0.9rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderLeft: '4px solid var(--color-primary)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {meet.typeLabel}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {new Date(meet.date).toLocaleDateString('ru-RU')} • {meet.time}
                  </span>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.3rem' }}>
                  {meet.title}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  📍 {meet.location} • Руководитель: {meet.leader}
                </div>

                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Повестка: {meet.agenda.slice(0, 2).join('; ')}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
