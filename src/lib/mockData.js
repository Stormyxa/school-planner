// ==========================================================================
// ШКОЛЬНЫЕ НАЧАЛЬНЫЕ ДАННЫЕ (ДЕМО И РЕЗЕРВНЫЙ РЕЖИМ)
// ==========================================================================

export const INITIAL_STAFF = [
  {
    id: 'user-director-1',
    name: 'Иванова Елена Николаевна',
    role: 'director', // 'director' | 'head_teacher' | 'teacher'
    roleTitle: 'Директор школы',
    subject: 'Управление школой',
    email: 'director@school.edu',
    phone: '+7 (912) 345-67-01',
    login: 'director',
    passHint: 'school2026',
    avatar: 'ЕН'
  },
  {
    id: 'user-head-1',
    name: 'Смирнова Ольга Владимировна',
    role: 'head_teacher',
    roleTitle: 'Зам. директора по УВР',
    subject: 'Учебно-воспитательная работа',
    email: 'uvr@school.edu',
    phone: '+7 (912) 345-67-02',
    login: 'uvr_smirnova',
    passHint: 'uvr1234',
    avatar: 'ОВ'
  },
  {
    id: 'user-head-2',
    name: 'Ковалев Андрей Дмитриевич',
    role: 'head_teacher',
    roleTitle: 'Зам. директора по ВР',
    subject: 'Воспитательная работа и безопасность',
    email: 'vr@school.edu',
    phone: '+7 (912) 345-67-03',
    login: 'vr_kovalev',
    passHint: 'vr1234',
    avatar: 'АК'
  },
  {
    id: 'user-teacher-1',
    name: 'Петров Алексей Сергеевич',
    role: 'teacher',
    roleTitle: 'Учитель математики',
    subject: 'Алгебра, Геометрия',
    classLeader: '9 «А» класс',
    email: 'petrov.math@school.edu',
    phone: '+7 (912) 345-67-11',
    login: 'petrov_as',
    passHint: 'math9a',
    avatar: 'АП'
  },
  {
    id: 'user-teacher-2',
    name: 'Кузнецова Анна Михайловна',
    role: 'teacher',
    roleTitle: 'Учитель русского языка и лит-ры',
    subject: 'Русский язык, Литература',
    classLeader: '11 «Б» класс',
    email: 'kuznetsova.rus@school.edu',
    phone: '+7 (912) 345-67-12',
    login: 'kuznetsova_am',
    passHint: 'rus11b',
    avatar: 'АК'
  },
  {
    id: 'user-teacher-3',
    name: 'Морозов Сергей Павлович',
    role: 'teacher',
    roleTitle: 'Учитель физики и информатики',
    subject: 'Физика, Информатика',
    classLeader: '10 «А» класс',
    email: 'morozov.physics@school.edu',
    phone: '+7 (912) 345-67-13',
    login: 'morozov_sp',
    passHint: 'phys10',
    avatar: 'СМ'
  },
  {
    id: 'user-teacher-4',
    name: 'Белова Татьяна Ивановна',
    role: 'teacher',
    roleTitle: 'Учитель начальных классов',
    subject: 'Начальная школа',
    classLeader: '3 «В» класс',
    email: 'belova.primary@school.edu',
    phone: '+7 (912) 345-67-14',
    login: 'belova_ti',
    passHint: 'prim3v',
    avatar: 'ТБ'
  }
];

export const INITIAL_TASKS = [
  {
    id: 'task-101',
    title: 'Сдать сводный отчет по успеваемости за 1 четверть',
    description: 'Заполнить стандартную форму успеваемости по классам: количество отличников, хорошистов, качество знаний и СОУ. Прикрепить файл Excel по утвержденной форме УВР.',
    assignedToId: 'user-teacher-1',
    assignedToName: 'Петров Алексей Сергеевич',
    createdById: 'user-director-1',
    createdByName: 'Иванова Е.Н. (Директор)',
    priority: 'urgent', // 'normal' | 'high' | 'urgent'
    deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0], // через 2 дня
    status: 'in_progress', // 'todo' | 'in_progress' | 'submitted' | 'completed' | 'revision'
    requiresFile: true,
    category: 'Отчетность',
    submittedFile: null
  },
  {
    id: 'task-102',
    title: 'Предоставить скорректированные рабочие программы по ФГОС-3',
    description: 'Внести изменения в календарно-тематическое планирование с учетом обновленных требований Минпросвещения.',
    assignedToId: 'user-teacher-2',
    assignedToName: 'Кузнецова Анна Михайловна',
    createdById: 'user-head-1',
    createdByName: 'Смирнова О.В. (Завуч УВР)',
    priority: 'high',
    deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'submitted',
    requiresFile: true,
    category: 'Учебные программы',
    submittedFile: {
      name: 'РП_Русский_Язык_11кл_Кузнецова.docx',
      size: '2.4 МБ',
      date: 'Сегодня, 10:15',
      url: 'https://raw.githubusercontent.com/Stormyxa/school-archive-demo/main/docs/RP_11kl.docx'
    }
  },
  {
    id: 'task-103',
    title: 'Провести классные часы по антитеррористической защищенности',
    description: 'Провести инструктаж во всех закрепленных классах. Сделать отметку в журнале и сдать лист ознакомления с подписями учащихся старше 14 лет.',
    assignedToId: 'user-teacher-3',
    assignedToName: 'Морозов Сергей Павлович',
    createdById: 'user-head-2',
    createdByName: 'Ковалев А.Д. (Завуч ВР)',
    priority: 'high',
    deadline: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'completed',
    requiresFile: false,
    category: 'Безопасность',
    submittedFile: null
  },
  {
    id: 'task-104',
    title: 'Сформировать списки на школьный этап Всероссийской олимпиады (ВсОШ)',
    description: 'Собрать согласия родителей и внести участников в электронную систему тестирования.',
    assignedToId: 'user-teacher-1',
    assignedToName: 'Петров Алексей Сергеевич',
    createdById: 'user-director-1',
    createdByName: 'Иванова Е.Н. (Директор)',
    priority: 'urgent',
    deadline: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0], // вчера (демо просрочки)
    status: 'todo',
    requiresFile: true,
    category: 'Олимпиады',
    submittedFile: null
  },
  {
    id: 'task-105',
    title: 'Подготовить аналитическую справку по входным контрольным работам',
    description: 'Обобщить результаты входного контроля по математике и русскому языку в 5-х и 9-х классах. Выделить группу риска.',
    assignedToId: 'user-head-1',
    assignedToName: 'Смирнова Ольга Владимировна',
    createdById: 'user-director-1',
    createdByName: 'Иванова Е.Н. (Директор)',
    priority: 'high',
    deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'in_progress',
    requiresFile: true,
    category: 'Мониторинг',
    submittedFile: null
  }
];

export const INITIAL_MEETINGS = [
  {
    id: 'meet-1',
    title: 'Еженедельная планёрка администрации школы',
    type: 'planerka', // 'planerka' | 'pedsovet' | 'soveshanie' | 'shkola'
    typeLabel: 'Планёрка администрации',
    date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    time: '08:30 – 09:15',
    location: 'Кабинет директора (№ 201)',
    leader: 'Иванова Е.Н. (Директор)',
    participants: ['Смирнова О.В.', 'Ковалев А.Д.', 'Завхоз', 'Секретарь'],
    agenda: [
      'Готовность школы к отопительному сезону',
      'График проведения ВПР и пробных ОГЭ/ЕГЭ',
      'Исполнительская дисциплина по сдаче отчетов учителями'
    ],
    status: 'scheduled'
  },
  {
    id: 'meet-2',
    title: 'Педагогический совет: «Преемственность начальной и основной школы»',
    type: 'pedsovet',
    typeLabel: 'Педсовет',
    date: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString().split('T')[0],
    time: '15:00 – 16:30',
    location: 'Актовый зал школы',
    leader: 'Иванова Е.Н. (Директор)',
    participants: ['Весь педагогический коллектив'],
    agenda: [
      'Доклад завуча УВР по адаптации 5-х классов',
      'Выступление психолога: результаты входящего тестирования',
      'Разное: согласование графика осенних каникул'
    ],
    status: 'scheduled'
  },
  {
    id: 'meet-3',
    title: 'Оперативное совещание с классными руководителями 9-х и 11-х классов',
    type: 'soveshanie',
    typeLabel: 'Совещание',
    date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    time: '14:20 – 15:00',
    location: 'Методический кабинет (№ 105)',
    leader: 'Смирнова О.В. (Завуч УВР)',
    participants: ['Классные руководители выпускных классов', 'Соцпедагог'],
    agenda: [
      'Предварительный выбор предметов для сдачи ОГЭ/ЕГЭ',
      'Работа со слабоуспевающими учащимися',
      'Информирование родителей о процедуре ГИА'
    ],
    status: 'scheduled'
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Новое поручение от директора',
    message: 'Вам назначена задача: «Сдать сводный отчет по успеваемости за 1 четверть» до ' + new Date(Date.now() + 2 * 24 * 3600 * 1000).toLocaleDateString('ru-RU'),
    time: '10 мин назад',
    read: false,
    type: 'task'
  },
  {
    id: 'notif-2',
    title: 'Напоминание о планёрке',
    message: 'Завтра в 08:30 в кабинете директора состоится еженедельная планёрка.',
    time: '1 час назад',
    read: false,
    type: 'meeting'
  },
  {
    id: 'notif-3',
    title: 'Файл отчета проверен',
    message: 'Завуч Смирнова О.В. приняла ваш отчет по рабочим программам.',
    time: '3 часа назад',
    read: true,
    type: 'file'
  }
];
