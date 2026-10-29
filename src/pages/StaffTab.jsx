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
  Mail, 
  GraduationCap,
  ShieldCheck,
  Send,
  X,
  CreditCard
} from 'lucide-react';

export default function StaffTab() {
  const { staff, addStaffMember, isDirector, t, schoolInfo } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Форма добавления сотрудника
  const [name, setName] = useState('');
  const [role, setRole] = useState('teacher');
  const [roleTitle, setRoleTitle] = useState('Мұғалім / Учитель');
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
    const text = `КГУ «СШ № 43» — Вход в Школьную Планёрку:\nЛогин: ${member.login}\nПароль: ${member.passHint}\nПедагог: ${member.name} (${member.roleTitle})`;
    navigator.clipboard.writeText(text);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Копирование всего списка для цифровой рассылки в WhatsApp / Telegram
  const handleCopyAllForMessengers = () => {
    const header = `🏫 *${schoolInfo.shortName}* — Доступы к Школьной Планёрке:\n`;
    const list = staff.map((m, idx) => 
      `${idx + 1}. *${m.name}* (${m.roleTitle})\n   👤 Логин: \`${m.login}\`\n   🔑 Пароль: \`${m.passHint}\``
    ).join('\n\n');

    navigator.clipboard.writeText(header + '\n' + list);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handlePrintCards = () => {
    window.print();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !login.trim()) return;

    await addStaffMember({
      name: name.trim(),
      role,
      roleTitle: roleTitle.trim() || (role === 'teacher' ? 'Учитель' : 'Заместитель директора'),
      subject: subject.trim() || 'Общие дисциплины',
      classLeader: classLeader.trim() || undefined,
      email: `${login.trim()}@sch43.kz`,
      phone: '+7 (7__) ___-__-__',
      login: login.trim().toLowerCase(),
      passHint: passHint.trim() || 'school43kz'
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
      <div className="card no-print" style={{
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
              {t('navStaff')} • {schoolInfo.shortName}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Администрирование учетных записей педагогов и руководства школы
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Кнопка копирования для WhatsApp/Telegram */}
          <button 
            className="btn-secondary btn-sm" 
            onClick={handleCopyAllForMessengers}
            title="Скопировать все логины и пароли для отправки в WhatsApp / Telegram"
            style={{ gap: '0.4rem', color: '#059669', borderColor: '#a7f3d0' }}
          >
            {copiedAll ? <Check size={15} color="var(--color-success)" /> : <Send size={15} />}
            {copiedAll ? 'Список скопирован!' : 'Список для WhatsApp / Telegram'}
          </button>

          {/* Карточки для печати */}
          <button 
            className="btn-secondary btn-sm" 
            onClick={() => setShowCardsModal(true)}
            style={{ gap: '0.4rem' }}
          >
            <CreditCard size={15} />
            Карточки паролей
          </button>

          {isDirector && (
            <button className="btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
              <UserPlus size={16} />
              {t('btnAddStaff')}
            </button>
          )}
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button 
            onClick={() => setRoleFilter('all')} 
            className={roleFilter === 'all' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            Барлығы ({staff.length})
          </button>
          <button 
            onClick={() => setRoleFilter('head_teacher')} 
            className={roleFilter === 'head_teacher' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            Әкімшілік (Завучтер)
          </button>
          <button 
            onClick={() => setRoleFilter('teacher')} 
            className={roleFilter === 'teacher' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
          >
            Мұғалімдер
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Іздеу / Поиск педагога..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.1rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Сетка карточек сотрудников */}
      <div className="grid-cols-auto no-print">
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
                  <span className="badge badge-neutral">Мұғалім</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.75rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <GraduationCap size={15} color="var(--text-muted)" />
                  <span>{member.subject}</span>
                </div>
                {member.classLeader && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-primary)' }}>
                    <span>🏫 Сынып жетекшісі: <strong>{member.classLeader}</strong></span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Mail size={15} color="var(--text-muted)" />
                  <span>{member.email}</span>
                </div>
              </div>
            </div>

            {/* Карточка доступов для входа */}
            <div style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              padding: '0.65rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                <span>{t('staffCredentials')}:</span>
                <button
                  onClick={() => handleCopyCredentials(member)}
                  className="btn-ghost"
                  style={{ padding: '0.15rem 0.4rem', fontSize: '0.72rem', gap: '0.25rem' }}
                  title="Скопировать логин и пароль учителю"
                >
                  {copiedId === member.id ? (
                    <>
                      <Check size={12} color="var(--color-success)" />
                      {t('staffCopied')}
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      {t('staffCopy')}
                    </>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                <span>{t('staffLogin')}: <strong>{member.login}</strong></span>
                <span>{t('staffPassword')}: <strong>{member.passHint}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* МОДАЛЬНОЕ ОКНО ПЕЧАТИ ТАЛОНОВ / КАРТОЧЕК ДОСТУПА */}
      {showCardsModal && (
        <div className="modal-backdrop" onClick={() => setShowCardsModal(false)}>
          <div className="modal-content" style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CreditCard size={20} color="var(--color-primary)" />
                <h2 className="modal-title">Талоны доступа для педагогов (для разрезания)</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn-primary btn-sm" onClick={handlePrintCards}>
                  <Printer size={15} />
                  Печать на принтер (A4)
                </button>
                <button className="btn-ghost btn-icon" onClick={() => setShowCardsModal(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '12px'
              }}>
                {staff.map(member => (
                  <div
                    key={member.id}
                    style={{
                      border: '2px dashed #94a3b8',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '12px',
                      pageBreakInside: 'avoid',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '11px', color: '#0284c7' }}>
                          {schoolInfo.shortName}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>ТАЛОН</span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px', color: '#0f172a' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                        {member.roleTitle}
                      </div>

                      <div style={{ backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '12px' }}>
                        <div>Логин: <strong>{member.login}</strong></div>
                        <div>Пароль: <strong>{member.passHint}</strong></div>
                      </div>
                    </div>

                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
                      ✂️ Линия отреза • Вход в Школьную Планёрку
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn-secondary" onClick={() => setShowCardsModal(false)}>
                {t('btnClose')}
              </button>
              <button className="btn-primary" onClick={handlePrintCards}>
                <Printer size={15} />
                Печать карточек
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка добавления сотрудника */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Жаңа педагогті қосу / Добавить сотрудника</h2>
              <button className="btn-ghost btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ФИО педагога толығымен *</label>
                  <input
                    type="text"
                    required
                    placeholder="Мысалы: Төлеубаева Жанар Серікқызы"
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
                    <label className="form-label">Рөлі / Роль</label>
                    <select value={role} onChange={e => {
                      setRole(e.target.value);
                      if (e.target.value === 'head_teacher') setRoleTitle('Заместитель директора');
                      else setRoleTitle('Учитель');
                    }}>
                      <option value="teacher">Мұғалім (Учитель)</option>
                      <option value="head_teacher">Оқу ісінің меңгерушісі (Завуч)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Лауазымы / Должность</label>
                    <input
                      type="text"
                      placeholder="Қазақ тілі мен әдебиеті мұғалімі"
                      value={roleTitle}
                      onChange={e => setRoleTitle(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Пәні / Предмет(ы)</label>
                    <input
                      type="text"
                      placeholder="Қазақ тілі, Қазақ әдебиеті"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Сынып жетекшілігі / Класс</label>
                    <input
                      type="text"
                      placeholder="6 «Ә» сыныбы"
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
                    Мұғалімге арналған кіру логині мен құпия сөзі:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label className="form-label">Логин *</label>
                      <input
                        type="text"
                        required
                        placeholder="toleubaeva_zh"
                        value={login}
                        onChange={e => setLogin(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">Құпия сөз / Пароль</label>
                      <input
                        type="text"
                        placeholder="school43kz"
                        value={passHint}
                        onChange={e => setPassHint(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  {t('btnCancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('btnSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
