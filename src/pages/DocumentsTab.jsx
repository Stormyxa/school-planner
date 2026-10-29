import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { triggerFileDownload } from '../lib/storageService';
import { 
  FolderDown, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Upload
} from 'lucide-react';

const GithubIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function DocumentsTab({ onOpenSubmitReport, onSelectTask }) {
  const { staff, tasks, currentUser, isDirector, isHeadTeacher, isTeacher, t, schoolInfo } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('matrix');
  const [selectedQuarter, setSelectedQuarter] = useState('q1');
  const [searchDoc, setSearchDoc] = useState('');

  // Задачи, требующие сдачи файла, с учетом роли
  const fileTasks = tasks.filter(t => {
    if (t.status === 'cancelled' || !t.requiresFile) return false;
    if (isTeacher) {
      return t.assignedToId === currentUser?.id;
    }
    return true;
  });

  // Список загруженных файлов с учетом прав:
  // - Директор видит все файлы
  // - Завуч видит файлы учителей и свои
  // - Учитель видит только свои загруженные файлы
  const uploadedFiles = tasks
    .filter(t => {
      if (!t.submittedFile) return false;
      if (isDirector) return true;
      if (isHeadTeacher) {
        if (t.assignedToId === currentUser?.id || t.createdById === currentUser?.id) return true;
        const teacher = staff.find(s => s.id === t.assignedToId);
        return teacher && teacher.role === 'teacher';
      }
      return t.assignedToId === currentUser?.id;
    })
    .map(t => ({
      taskId: t.id,
      taskTitle: t.title,
      teacherId: t.assignedToId,
      teacherName: t.assignedToName,
      file: t.submittedFile,
      status: t.status,
      category: t.category,
      taskObj: t
    }))
    .filter(item => 
      item.file.name.toLowerCase().includes(searchDoc.toLowerCase()) ||
      item.teacherName.toLowerCase().includes(searchDoc.toLowerCase()) ||
      item.taskTitle.toLowerCase().includes(searchDoc.toLowerCase())
    );

  // В ведомости: учитель видит только свою строку, администрация видит учителей
  const displayedStaff = isTeacher
    ? staff.filter(s => s.id === currentUser?.id)
    : staff.filter(s => s.role === 'teacher');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Шапка */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-primary-bg)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FolderDown size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {t('navDocs')} • {schoolInfo.shortName}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              СОР/СОЧ графиктері, есептер мен құжаттар мұрағаты
            </div>
          </div>
        </div>

        {/* Индикатор GitHub Storage */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          backgroundColor: 'var(--bg-surface-subtle)',
          padding: '0.5rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.78rem'
        }}>
          <GithubIcon size={18} color="var(--text-primary)" />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              GitHub Repo Storage
            </div>
            <div style={{ color: 'var(--color-success)', fontWeight: 500 }}>
              ● {t('docsStorageNotice')}
            </div>
          </div>
        </div>
      </div>

      {/* Переключатель вида */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface-subtle)',
          padding: '3px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => setActiveSubTab('matrix')}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: activeSubTab === 'matrix' ? 'var(--bg-surface)' : 'transparent',
              color: activeSubTab === 'matrix' ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: activeSubTab === 'matrix' ? 600 : 500,
              boxShadow: activeSubTab === 'matrix' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {t('docsMatrixTab')}
          </button>
          <button
            onClick={() => setActiveSubTab('archive')}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: activeSubTab === 'archive' ? 'var(--bg-surface)' : 'transparent',
              color: activeSubTab === 'archive' ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontWeight: activeSubTab === 'archive' ? 600 : 500,
              boxShadow: activeSubTab === 'archive' ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {t('docsArchiveTab')} ({uploadedFiles.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select 
            value={selectedQuarter} 
            onChange={e => setSelectedQuarter(e.target.value)}
            style={{ width: 'auto', fontSize: '0.85rem' }}
          >
            <option value="q1">1 тоқсан (1 четверть)</option>
            <option value="q2">2 тоқсан (2 четверть)</option>
            <option value="q3">3 тоқсан (3 четверть)</option>
            <option value="q4">4 тоқсан (4 четверть)</option>
            <option value="all">2026/2027 оқу жылы</option>
          </select>
        </div>
      </div>

      {/* ВИД 1: МАТРИЦА СДАЧИ */}
      {activeSubTab === 'matrix' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              Жиынтық ведомость: СОР/СОЧ есептерін тапсыру бақылауы
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Файлды ашу немесе жүктеп алу үшін құжатты басыңыз
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('docsTeacherCol')}</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t('docsSubjectCol')}</th>
                  {fileTasks.slice(0, 3).map(task => (
                    <th key={task.id} style={{ padding: '0.75rem 1rem', fontWeight: 600, maxWidth: '180px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                        до {new Date(task.deadline).toLocaleDateString('ru-RU')}
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>{t('docsStatusCol')}</th>
                </tr>
              </thead>
              <tbody>
                {displayedStaff.map(teacher => {
                  const teacherTasks = tasks.filter(t => t.assignedToId === teacher.id && t.requiresFile && t.status !== 'cancelled');
                  const hasSubmittedAll = teacherTasks.length > 0 && teacherTasks.every(t => t.submittedFile);

                  return (
                    <tr key={teacher.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{teacher.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{teacher.roleTitle}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>{teacher.subject}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)' }}>
                          {teacher.classLeader || '—'}
                        </div>
                      </td>

                      {/* Ячейки по задачам с файлами */}
                      {fileTasks.slice(0, 3).map(task => {
                        const isThisTaskAssigned = task.assignedToId === teacher.id;
                        if (!isThisTaskAssigned) {
                          return (
                            <td key={task.id} style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              —
                            </td>
                          );
                        }

                        if (task.submittedFile) {
                          return (
                            <td key={task.id} style={{ padding: '0.85rem 1rem' }}>
                              <button
                                type="button"
                                onClick={() => triggerFileDownload(task.submittedFile.url, task.submittedFile.name)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  color: 'var(--color-success)',
                                  fontWeight: 600,
                                  backgroundColor: 'var(--color-success-bg)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: 'var(--radius-xs)',
                                  fontSize: '0.75rem'
                                }}
                                title="Скачать сданный файл"
                              >
                                <Download size={13} />
                                {task.submittedFile.name.length > 18 ? task.submittedFile.name.slice(0, 16) + '...' : task.submittedFile.name}
                              </button>
                            </td>
                          );
                        }

                        return (
                          <td key={task.id} style={{ padding: '0.85rem 1rem' }}>
                            {teacher.id === currentUser?.id ? (
                              <button
                                type="button"
                                className="btn-primary btn-sm"
                                onClick={() => onOpenSubmitReport(task)}
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', gap: '0.25rem' }}
                              >
                                <Upload size={12} />
                                Тапсыру
                              </button>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: 'var(--color-danger)',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}>
                                <AlertCircle size={13} />
                                {t('docsNotSubmitted')}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        {hasSubmittedAll ? (
                          <span className="badge badge-success">{t('docsAllSubmitted')}</span>
                        ) : (
                          <span className="badge badge-warning">{t('docsInProgress')}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ВИД 2: АРХИВ */}
      {activeSubTab === 'archive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '350px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Іздеу / Поиск файла..."
                value={searchDoc}
                onChange={e => setSearchDoc(e.target.value)}
                style={{ paddingLeft: '2.1rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div className="grid-cols-auto">
            {uploadedFiles.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem' }}>
                <FolderDown size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem auto' }} />
                <h4>Мұрағат бос / Файлов в архиве пока нет</h4>
              </div>
            ) : (
              uploadedFiles.map((item, idx) => (
                <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {item.category || 'Құжат'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.file.size}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <FileText size={26} color="var(--color-primary-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', wordBreak: 'break-word', color: 'var(--text-primary)' }}>
                          {item.file.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Педагог: <strong>{item.teacherName}</strong>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          Тапсырма: {item.taskTitle}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {item.file.date}
                    </span>

                    <button
                      type="button"
                      onClick={() => triggerFileDownload(item.file.url, item.file.name)}
                      className="btn-primary btn-sm"
                    >
                      <Download size={14} />
                      {t('btnDownload')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
