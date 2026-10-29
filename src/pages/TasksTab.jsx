import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  PlusCircle, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Upload
} from 'lucide-react';

export default function TasksTab({ onSelectTask, onOpenNewTask, onOpenSubmitReport }) {
  const { tasks, currentUser, isDirector, isHeadTeacher } = useAuth();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'my' | 'pending' | 'urgent' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Фильтрация
  const filteredTasks = tasks.filter(task => {
    // Поиск
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.assignedToName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Категория
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

    // Вкладки
    if (activeFilter === 'my') {
      return task.assignedToId === currentUser.id;
    }
    if (activeFilter === 'pending') {
      return task.status === 'submitted';
    }
    if (activeFilter === 'urgent') {
      return task.priority === 'urgent' || (task.deadline < todayStr && task.status !== 'completed');
    }
    if (activeFilter === 'completed') {
      return task.status === 'completed';
    }

    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="badge badge-danger">Срочно (Приказ)</span>;
      case 'high':
        return <span className="badge badge-warning">Высокий</span>;
      default:
        return <span className="badge badge-neutral">Обычный</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Принято</span>;
      case 'submitted':
        return <span className="badge badge-warning"><Clock size={12} /> На проверке</span>;
      case 'revision':
        return <span className="badge badge-danger"><RotateCcw size={12} /> Доработка</span>;
      case 'in_progress':
        return <span className="badge badge-primary">В работе</span>;
      default:
        return <span className="badge badge-neutral">Новое</span>;
    }
  };

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
              Школьный задачник и Поручения
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Контроль исполнения распоряжений директора и завучей
            </div>
          </div>
        </div>

        {(isDirector || isHeadTeacher) && (
          <button className="btn-primary btn-sm" onClick={onOpenNewTask}>
            <PlusCircle size={16} />
            Дать поручение
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
          {[
            { id: 'all', label: `Все (${tasks.length})` },
            { id: 'my', label: `Мои задачи (${tasks.filter(t => t.assignedToId === currentUser.id).length})` },
            { id: 'pending', label: `На проверке (${tasks.filter(t => t.status === 'submitted').length})` },
            { id: 'urgent', label: 'Срочные / Просрочка' },
            { id: 'completed', label: 'Завершенные' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={activeFilter === tab.id ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Поиск */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Поиск по теме или учителю..."
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
              Измените параметры поиска или добавьте новую задачу.
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const isOverdue = task.deadline < todayStr && task.status !== 'completed';
            const isAssignedToMe = task.assignedToId === currentUser.id;

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
                  borderLeft: isOverdue ? '4px solid var(--color-danger)' : undefined
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    {getStatusBadge(task.status)}
                    {getPriorityBadge(task.priority)}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      • {task.category}
                    </span>
                    {task.requiresFile && (
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        <FileText size={11} /> Требует файл
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
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
                    {task.description}
                  </p>
                </div>

                {/* Правая часть: исполнитель, срок, кнопки действия */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 600 }}>{task.assignedToName}</div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: isOverdue ? 'var(--color-danger)' : 'var(--text-muted)',
                      fontWeight: isOverdue ? 600 : 400,
                      marginTop: '0.15rem'
                    }}>
                      до {new Date(task.deadline).toLocaleDateString('ru-RU')}
                      {isOverdue && ' (просрочено!)'}
                    </div>
                  </div>

                  {/* Кнопка сдачи для учителя */}
                  {isAssignedToMe && task.status !== 'completed' && (
                    <button
                      className="btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenSubmitReport(task);
                      }}
                      style={{ gap: '0.35rem' }}
                    >
                      <Upload size={14} />
                      {task.submittedFile ? 'Изменить отчет' : 'Сдать отчет'}
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
