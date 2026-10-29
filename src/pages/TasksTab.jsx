import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, 
  Search, 
  PlusCircle, 
  Clock, 
  FileText, 
  CheckCircle2, 
  RotateCcw,
  Upload,
  XCircle
} from 'lucide-react';

export default function TasksTab({ onSelectTask, onOpenNewTask, onOpenSubmitReport }) {
  const { tasks, staff, currentUser, isDirector, isHeadTeacher, isTeacher, t } = useAuth();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Ограничение видимости поручений по ролям
  const visibleTasks = tasks.filter(task => {
    if (isDirector) return true;

    if (isHeadTeacher) {
      if (task.assignedToId === currentUser?.id || task.createdById === currentUser?.id) return true;
      const assignedMember = staff.find(s => s.id === task.assignedToId);
      if (assignedMember && assignedMember.role === 'teacher') return true;
      return false;
    }

    // Учитель видит строго свои задачи
    return task.assignedToId === currentUser?.id || task.createdById === currentUser?.id;
  });

  // Корпоративный стандарт архивации: завершенные задания старше 24 часов
  const isTaskArchived = (task) => {
    if (task.status !== 'completed') return false;
    const completedTime = task.reviewedAt ? new Date(task.reviewedAt).getTime() : new Date(task.deadline).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return (Date.now() - completedTime) >= oneDayMs;
  };

  const archivedTasksCount = visibleTasks.filter(t => isTaskArchived(t)).length;

  // 2. Фильтрация видимых поручений
  const filteredTasks = visibleTasks.filter(task => {
    // Режим архива:
    if (activeFilter === 'archive') {
      if (!isTaskArchived(task)) return false;
    } else {
      // В обычных вкладках: архивные (> 24ч) скрыты, если не включен чекбокс showArchived
      if (!showArchived && isTaskArchived(task)) {
        return false;
      }
    }

    // Поиск
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.assignedToName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    // Категория
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

    // Вкладки
    if (activeFilter === 'my') {
      return task.assignedToId === currentUser?.id || task.createdById === currentUser?.id;
    }
    if (activeFilter === 'active') {
      return (task.status === 'todo' || task.status === 'in_progress') && task.status !== 'cancelled';
    }
    if (activeFilter === 'pending') {
      return task.status === 'submitted';
    }
    if (activeFilter === 'revision') {
      return task.status === 'revision';
    }
    if (activeFilter === 'urgent') {
      return (task.priority === 'urgent' || task.deadline < todayStr) && task.status !== 'completed' && task.status !== 'cancelled';
    }
    if (activeFilter === 'completed') {
      return task.status === 'completed';
    }
    if (activeFilter === 'cancelled') {
      return task.status === 'cancelled';
    }

    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="badge badge-danger">{t('priorityUrgent')}</span>;
      case 'high':
        return <span className="badge badge-warning">{t('priorityHigh')}</span>;
      default:
        return <span className="badge badge-neutral">{t('priorityNormal')}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> {t('statusCompleted')}</span>;
      case 'submitted':
        return <span className="badge badge-warning"><Clock size={12} /> {t('statusSubmitted')}</span>;
      case 'revision':
        return <span className="badge badge-danger"><RotateCcw size={12} /> {t('statusRevision')}</span>;
      case 'cancelled':
        return <span className="badge badge-neutral" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}><XCircle size={12} /> {t('statusCancelled')}</span>;
      case 'in_progress':
        return <span className="badge badge-primary">{t('statusInProgress')}</span>;
      default:
        return <span className="badge badge-neutral">{t('statusTodo')}</span>;
    }
  };

  // Фильтры: для учителя простой и удобный личный пайплайн задач, для администрации - управленческий контроль
  const filterTabs = isTeacher ? [
    { id: 'all', label: `Барлығы / Все (${visibleTasks.length})` },
    { id: 'active', label: `Орындауда / В работе (${visibleTasks.filter(t => (t.status === 'todo' || t.status === 'in_progress') && t.status !== 'cancelled').length})` },
    { id: 'pending', label: `Тексеруде / На проверке (${visibleTasks.filter(t => t.status === 'submitted').length})` },
    { id: 'revision', label: `Қайта өңдеуге (${visibleTasks.filter(t => t.status === 'revision').length})` },
    { id: 'urgent', label: `Шұғыл (${visibleTasks.filter(t => (t.priority === 'urgent' || t.deadline < todayStr) && t.status !== 'completed' && t.status !== 'cancelled').length})` },
    { id: 'completed', label: `Орындалды (${visibleTasks.filter(t => t.status === 'completed' && !isTaskArchived(t)).length})` },
    { id: 'archive', label: `📦 ${t('filterArchived')} (${archivedTasksCount})` }
  ] : [
    { id: 'all', label: `${t('filterAll')} (${visibleTasks.length})` },
    { id: 'my', label: `${t('filterMy')} (${visibleTasks.filter(t => t.assignedToId === currentUser?.id || t.createdById === currentUser?.id).length})` },
    { id: 'pending', label: `${t('filterPending')} (${visibleTasks.filter(t => t.status === 'submitted').length})` },
    { id: 'urgent', label: t('filterUrgent') },
    { id: 'completed', label: `${t('filterCompleted')} (${visibleTasks.filter(t => t.status === 'completed' && !isTaskArchived(t)).length})` },
    { id: 'archive', label: `📦 ${t('filterArchived')} (${archivedTasksCount})` },
    { id: 'cancelled', label: `${t('filterCancelled')} (${visibleTasks.filter(t => t.status === 'cancelled').length})` }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Шапка раздела */}
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
            <CheckSquare size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {t('navTasks')} • КГУ «СШ № 43»
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isTeacher 
                ? 'Тағайындалған тапсырмалар тізімі және есеп беру' 
                : 'Контроль исполнения распоряжений директора и завучей'}
            </div>
          </div>
        </div>

        {(isDirector || isHeadTeacher) && (
          <button className="btn-primary btn-sm" onClick={onOpenNewTask}>
            <PlusCircle size={16} />
            {t('btnNewTask')}
          </button>
        )}
      </div>

      {/* Панель фильтров и поиска */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Кнопки-фильтры */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={activeFilter === tab.id ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Поиск и тумблер показа архива */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {activeFilter !== 'archive' && archivedTasksCount > 0 && (
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: '0.35rem 0.6rem',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)'
            }}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
                style={{ width: 'auto', margin: 0 }}
              />
              <span>{t('showArchived')}</span>
            </label>
          )}

          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={t('searchTaskPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.1rem', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Список поручений */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filteredTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckSquare size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Поручений не найдено</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              В выбранной категории задач нет.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isCancelled = task.status === 'cancelled';
            const isOverdue = !isCancelled && task.deadline < todayStr && task.status !== 'completed';
            const isAssignedToMe = task.assignedToId === currentUser?.id;
            const isArchived = isTaskArchived(task);

            return (
              <div
                key={task.id}
                className="card card-interactive"
                onClick={() => onSelectTask(task)}
                style={{
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  borderLeft: isCancelled ? '4px solid #94a3b8' : isOverdue ? '4px solid var(--color-danger)' : undefined,
                  opacity: isCancelled ? 0.75 : isArchived ? 0.85 : 1
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                    {isArchived && (
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem', backgroundColor: '#e2e8f0', color: '#475569' }}>
                        📦 {t('taskArchivedBadge')}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • {task.category}
                    </span>
                    {task.requiresFile && (
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        <FileText size={11} /> Файл
                      </span>
                    )}
                  </div>

                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: isCancelled ? 'var(--text-muted)' : 'var(--text-primary)',
                    margin: 0,
                    textDecoration: isCancelled ? 'line-through' : 'none'
                  }}>
                    {task.title}
                  </h3>

                  <p style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.3rem',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {isCancelled && task.cancelReason ? `[Отменено: ${task.cancelReason}] — ` : ''}
                    {task.description}
                  </p>
                </div>

                {/* Правая часть: исполнитель, срок, кнопки действия */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 600 }}>{task.assignedToName}</div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: isCancelled ? 'var(--text-muted)' : isOverdue ? 'var(--color-danger)' : 'var(--text-muted)',
                      fontWeight: isOverdue ? 600 : 400,
                      marginTop: '0.15rem'
                    }}>
                      {isCancelled ? 'Снято с контроля' : `до ${new Date(task.deadline).toLocaleDateString('ru-RU')}`}
                      {isOverdue && ' (просрочено!)'}
                    </div>
                  </div>

                  {/* Кнопка сдачи для учителя */}
                  {isAssignedToMe && task.status !== 'completed' && !isCancelled && (
                    <button
                      className="btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSubmitReport(task);
                      }}
                      style={{ gap: '0.35rem' }}
                    >
                      <Upload size={14} />
                      {task.submittedFile ? 'Изменить отчет' : t('btnSubmitReport')}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
