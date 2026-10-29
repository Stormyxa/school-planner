import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Key, 
  Copy, 
  Check, 
  Printer, 
  Search, 
  Phone, 
  Mail, 
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export default function StaffTab() {
  const { staff, addStaffMember, isDirector } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Форма добавления сотрудника
  const [name, setName] = useState('');
  const [role, setRole] = useState('teacher');
  const [roleTitle, setRoleTitle] = useState('Учитель');
  const [subject, setSubject] = useState('');
  const [classLeader, setClassLeader] = useState('');
  const [login, setLogin] = useState('');
  const [passHint, setPassHint] = useState('');

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
                          member.subject.toLowerCase().includes(search.toLowerCase()) ||
                          member.login.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (roleFilter !== 'all' && member.role !== roleFilter) return false;

    return true;
  });

  const handleCopyCredentials = (member) => {
    const text = `Вход в Школьную Планёрку:\nСайт: school-planner\nЛогин: ${member.login}\nПароль: ${member.passHint}\nФИО: ${member.name}`;
    navigator.clipboard.writeText(text);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrintStaff = () => {
    window.print();
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !login.trim()) return;

    addStaffMember({
      name: name.trim(),
      role,
      roleTitle: roleTitle.trim() || (role === 'teacher' ? 'Учитель' : 'Заместитель директора'),
      subject: subject.trim() || 'Общие дисциплины',
      classLeader: classLeader.trim() || undefined,
      email: `${login.trim()}@school.edu`,
      phone: '+7 (___) ___-__-__',
      login: login.trim().toLowerCase(),
      passHint: passHint.trim() || 'school2026'
    });

    setShowAddModal(false);
    setName('');
    setLogin('');
    setPassHint('');
    setSubject('');
    setClassLeader('');
  };

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
            <Users size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Педагогический коллектив и Доступы
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Администрирование учетных записей учителей и руководства школы
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn-secondary btn-sm hide-on-mobile" onClick={handlePrintStaff}>
            <Printer size={15} />
            Распечатать ведомость паролей
          </button>
          {isDirector && (
            <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <UserPlus size={16} />
              Добавить педагога
            </button>
          )}
        </div>
      </div>

      {/* Панель фильтров */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button 
            onClick={() => setRoleFilter('all')} 
            className={roleFilter === 'all' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            Все сотрудники ({staff.length})
          </button>
          <button 
            onClick={() => setRoleFilter('head_teacher')} 
            className={roleFilter === 'head_teacher' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            Администрация / Завучи
          </button>
          <button 
            onClick={() => setRoleFilter('teacher')} 
            className={roleFilter === 'teacher' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            Учителя
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Поиск по имени, предмету, логину..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.1rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Сетка карточек сотрудников */}
      <div className="grid-cols-auto">
        {filteredStaff.map(member => (
          <div key={member.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div className="avatar">
                    {member.avatar}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                      {member.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary-light)', fontWeight: 500 }}>
                      {member.roleTitle}
                    </div>
                  </div>
                </div>

                {member.role === 'director' ? (
                  <span className="badge badge-primary"><ShieldCheck size={12} /> Директор</span>
                ) : member.role === 'head_teacher' ? (
                  <span className="badge badge-purple">Завуч</span>
                ) : (
                  <span className="badge badge-neutral">Учитель</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.75rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <GraduationCap size={15} color="var(--text-muted)" />
                  <span>{member.subject}</span>
                </div>
                {member.classLeader && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-primary)' }}>
                    <span>🏫 Руководитель: <strong>{member.classLeader}</strong></span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Mail size={15} color="var(--text-muted)" />
                  <span>{member.email}</span>
                </div>
              </div>
            </div>

            {/* Карточка доступов для входа (Логин / Пароль) */}
            <div style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: '0.65rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                <span>Данные для входа:</span>
                <button
                  onClick={() => handleCopyCredentials(member)}
                  className="btn-ghost"
                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.72rem', gap: '0.25rem' }}
                  title="Скопировать логин и пароль учителю"
                >
                  {copiedId === member.id ? (
                    <>
                      <Check size={12} color="var(--color-success)" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Копировать
                    </>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                <span>Логин: <strong>{member.login}</strong></span>
                <span>Пароль: <strong>{member.passHint}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Модалка добавления сотрудника */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Добавить нового сотрудника школы</h2>
              <button className="btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ФИО сотрудника полностью *</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Васильева Екатерина Сергеевна"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (!login && e.target.value.includes(' ')) {
                        const parts = e.target.value.toLowerCase().split(' ');
                        setLogin(`${parts[0]}_${parts[1]?.[0] || 't'}`);
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Роль в системе</label>
                    <select value={role} onChange={e => {
                      setRole(e.target.value);
                      if (e.target.value === 'head_teacher') setRoleTitle('Заместитель директора');
                      else setRoleTitle('Учитель');
                    }}>
                      <option value="teacher">Учитель</option>
                      <option value="head_teacher">Завуч (Администрация)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Должность в школе</label>
                    <input
                      type="text"
                      placeholder="Учитель биологии и химии"
                      value={roleTitle}
                      onChange={e => setRoleTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Предмет(ы)</label>
                    <input
                      type="text"
                      placeholder="Биология, Химия"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Классное руководство (если есть)</label>
                    <input
                      type="text"
                      placeholder="8 «В» класс"
                      value={classLeader}
                      onChange={e => setClassLeader(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.6rem' }}>
                    Создание логина и пароля для учителя:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label">Логин *</label>
                      <input
                        type="text"
                        required
                        placeholder="vasilieva_es"
                        value={login}
                        onChange={e => setLogin(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Пароль для первого входа</label>
                      <input
                        type="text"
                        placeholder="school2026"
                        value={passHint}
                        onChange={e => setPassHint(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary">
                  Сохранить и выдать доступ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
