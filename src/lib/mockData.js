// ==========================================================================
// ШКОЛЬНЫЕ ДАННЫЕ ДЛЯ КГУ «СШ № 43» (КАЗАХСТАН)
// ==========================================================================

export const SCHOOL_INFO = {
  name: 'КГУ «Средняя общеобразовательная школа № 43»',
  shortName: 'КГУ «СШ № 43»',
  kazName: '«№ 43 орта жалпы білім беретін мектеп» КММ',
  academicYear: '2026/2027 оқу жылы • 1 тоқсан (четверть)',
  systemJournal: 'Күнделік (Kundelik.kz)'
};

export const INITIAL_STAFF = [
  {
    id: 'user-director-1',
    name: 'Омарова Гульнара Бауржановна',
    role: 'director',
    roleTitle: 'Директор школы / Мектеп басшысы',
    subject: 'Менеджмент в образовании',
    email: 'director.sch43@edu.kz',
    phone: '+7 (777) 123-45-01',
    login: 'director43',
    passHint: 'school43kz',
    avatar: 'ГО',
    category: 'Педагог-шебер (Педагог-мастер)'
  },
  {
    id: 'user-head-1',
    name: 'Садыкова Айнур Касымовна',
    role: 'head_teacher',
    roleTitle: 'Зам. директора по УВР (Оқу ісінің меңгерушісі)',
    subject: 'Учебно-воспитательная работа, СОР/СОЧ',
    email: 'uvr.sch43@edu.kz',
    phone: '+7 (777) 123-45-02',
    login: 'uvr_sadykova',
    passHint: 'uvr43',
    avatar: 'АС',
    category: 'Педагог-зерттеуші'
  },
  {
    id: 'user-head-2',
    name: 'Жумабеков Данияр Ерланович',
    role: 'head_teacher',
    roleTitle: 'Зам. директора по ВР (Тәрбие ісінің меңгерушісі)',
    subject: '«Біртұтас тәрбие» және қауіпсіздік',
    email: 'vr.sch43@edu.kz',
    phone: '+7 (777) 123-45-03',
    login: 'vr_zhumabekov',
    passHint: 'vr43',
    avatar: 'ДЖ',
    category: 'Педагог-сарапшы'
  },
  {
    id: 'user-head-3',
    name: 'Каримов Руслан Серикович',
    role: 'head_teacher',
    roleTitle: 'Зам. директора по цифровизации (Kundelik / ИТ)',
    subject: 'Информатизация и Kundelik.kz',
    email: 'it.sch43@edu.kz',
    phone: '+7 (777) 123-45-04',
    login: 'it_karimov',
    passHint: 'it43',
    avatar: 'РК',
    category: 'Педагог-модератор'
  },
  {
    id: 'user-teacher-1',
    name: 'Абдрахманова Майра Серикбаевна',
    role: 'teacher',
    roleTitle: 'Қазақ тілі мен әдебиеті мұғалімі',
    subject: 'Қазақ тілі, Қазақ әдебиеті',
    classLeader: '7 «А» сыныбы',
    email: 'abdrakhmanova@sch43.kz',
    phone: '+7 (778) 234-56-11',
    login: 'abdrakhmanova_m',
    passHint: 'kaz7a',
    avatar: 'МА',
    category: 'Педагог-зерттеуші'
  },
  {
    id: 'user-teacher-2',
    name: 'Петров Алексей Сергеевич',
    role: 'teacher',
    roleTitle: 'Учитель математики и информатики',
    subject: 'Алгебра, Геометрия',
    classLeader: '9 «Б» класс',
    email: 'petrov.math@sch43.kz',
    phone: '+7 (775) 345-67-12',
    login: 'petrov_as',
    passHint: 'math9b',
    avatar: 'АП',
    category: 'Педагог-сарапшы'
  },
  {
    id: 'user-teacher-3',
    name: 'Смирнова Ольга Владимировна',
    role: 'teacher',
    roleTitle: 'Учитель русского языка и литературы',
    subject: 'Русский язык, Литература',
    classLeader: '10 «А» класс',
    email: 'smirnova.rus@sch43.kz',
    phone: '+7 (771) 456-78-13',
    login: 'smirnova_ov',
    passHint: 'rus10a',
    avatar: 'ОС',
    category: 'Педагог-сарапшы'
  },
  {
    id: 'user-teacher-4',
    name: 'Бауыржанұлы Нұрсұлтан',
    role: 'teacher',
    roleTitle: 'Физика және робототехника пәні мұғалімі',
    subject: 'Физика, Информатика, Робототехника',
    classLeader: '8 «Ә» сыныбы',
    email: 'bauyrzhanuly@sch43.kz',
    phone: '+7 (702) 567-89-14',
    login: 'bauyrzhanuly_n',
    passHint: 'phys8ae',
    avatar: 'НБ',
    category: 'Педагог-модератор'
  },
  {
    id: 'user-teacher-5',
    name: 'Исаева Динара Муратовна',
    role: 'teacher',
    roleTitle: 'Бастауыш сынып мұғалімі',
    subject: 'Начальные классы / Бастауыш сыныптар',
    classLeader: '3 «В» класс',
    email: 'isaeva.primary@sch43.kz',
    phone: '+7 (708) 678-90-15',
    login: 'isaeva_dm',
    passHint: 'prim3v',
    avatar: 'ДИ',
    category: 'Педагог-модератор'
  }
];

export const INITIAL_TASKS = [
  {
    id: 'task-101',
    title: 'Сдать графики проведения СОР и СОЧ (БЖБ/ТЖБ) за 1 четверть',
    description: 'Утвердить единый график проведения суммативного оценивания по параллелям, чтобы исключить проведение более трех СОР/СОЧ в один учебный день. Прикрепить файл утвержденного графика.',
    assignedToId: 'user-head-1',
    assignedToName: 'Садыкова Айнур Касымовна (Завуч УВР)',
    createdById: 'user-director-1',
    createdByName: 'Омарова Г.Б. (Директор КГУ «СШ № 43»)',
    priority: 'urgent',
    deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'in_progress',
    requiresFile: true,
    category: 'СОР и СОЧ',
    submittedFile: null
  },
  {
    id: 'task-102',
    title: 'Мониторинг своевременности ведения электронного журнала Kundelik.kz',
    description: 'Проверить выставление формативного оценивания (баллы 1-10) учителями за прошедшую неделю, заполнение тем уроков и домашних заданий в системе Күнделік.',
    assignedToId: 'user-head-3',
    assignedToName: 'Каримов Руслан Серикович (Завуч по ИТ)',
    createdById: 'user-director-1',
    createdByName: 'Омарова Г.Б. (Директор)',
    priority: 'high',
    deadline: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'submitted',
    requiresFile: true,
    category: 'Kundelik.kz',
    submittedFile: {
      name: 'Справка_мониторинг_Kundelik_октябрь_2026.xlsx',
      size: '1.8 МБ',
      date: 'Сегодня, 11:20',
      url: 'https://raw.githubusercontent.com/Stormyxa/school-archive/main/documents/kundelik_report.xlsx'
    }
  },
  {
    id: 'task-103',
    title: 'Предоставить план воспитательных мероприятий по концепции «Біртұтас тәрбие»',
    description: 'Оформить календарный план классных часов и родительских собраний по ценностям: Тәуелсіздік және отаншылдық, Ар-ұят, Әділдік және жауапкершілік.',
    assignedToId: 'user-teacher-1',
    assignedToName: 'Абдрахманова Майра Серикбаевна',
    createdById: 'user-head-2',
    createdByName: 'Жумабеков Д.Е. (Завуч ВР)',
    priority: 'normal',
    deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'in_progress',
    requiresFile: true,
    category: 'Біртұтас тәрбие',
    submittedFile: null
  },
  {
    id: 'task-104',
    title: 'Сформировать заявки на школьный этап Республиканской олимпиады по предметам',
    description: 'Собрать списки победителей и призеров 8-11 классов по математике, физике, казахскому и русскому языкам для регистрации в районном отделе образования.',
    assignedToId: 'user-teacher-2',
    assignedToName: 'Петров Алексей Сергеевич',
    createdById: 'user-director-1',
    createdByName: 'Омарова Г.Б. (Директор)',
    priority: 'urgent',
    deadline: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0], // просрочено вчера
    status: 'todo',
    requiresFile: true,
    category: 'Олимпиада',
    submittedFile: null
  },
  {
    id: 'task-105',
    title: 'Подготовить анализ суммативного оценивания за раздел (СОР №1) по параллелям 5-9 кл.',
    description: 'Заполнить аналитическую карту типичных затруднений учащихся по уровням мыслительных навыков (знание, понимание, применение, навыки высокого порядка).',
    assignedToId: 'user-teacher-3',
    assignedToName: 'Смирнова Ольга Владимировна',
    createdById: 'user-head-1',
    createdByName: 'Садыкова А.К. (Завуч УВР)',
    priority: 'high',
    deadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'in_progress',
    requiresFile: true,
    category: 'СОР и СОЧ',
    submittedFile: null
  }
];

export const INITIAL_MEETINGS = [
  {
    id: 'meet-1',
    title: 'Аппаратная планёрка администрации КГУ «СШ № 43»',
    type: 'planerka',
    typeLabel: 'Планёрка администрации',
    date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    time: '08:30 – 09:15',
    location: 'Кабинет директора школы (№ 201)',
    leader: 'Омарова Г.Б. (Директор)',
    participants: ['Садыкова А.К.', 'Жумабеков Д.Е.', 'Каримов Р.С.', 'Секретарь'],
    agenda: [
      'Результаты мониторинга своевременности Kundelik.kz',
      'Утверждение графика проведения СОЧ за 1 четверть',
      'Обеспечение безопасности и дежурство учителей по этажам'
    ],
    status: 'scheduled'
  },
  {
    id: 'meet-2',
    title: 'Педагогический совет: «Качество знаний и реализация концепции «Біртұтас тәрбие»',
    type: 'pedsovet',
    typeLabel: 'Педсовет',
    date: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString().split('T')[0],
    time: '15:00 – 16:45',
    location: 'Актовый зал КГУ «СШ № 43»',
    leader: 'Омарова Г.Б. (Директор школы)',
    participants: ['Весь педагогический коллектив школы'],
    agenda: [
      'Доклад директора: цели развития школы на 2026/2027 учебный год',
      'Анализ итогов входных срезов знаний и подготовка к МОДО / ВОУД',
      'Утверждение плана воспитательной работы «Біртұтас тәрбие»'
    ],
    status: 'scheduled'
  },
  {
    id: 'meet-3',
    title: 'Совещание методического совета: подготовка к аттестации педагогов',
    type: 'soveshanie',
    typeLabel: 'Методсовет',
    date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    time: '14:30 – 15:30',
    location: 'Методический кабинет (№ 104)',
    leader: 'Садыкова А.К. (Завуч УВР)',
    participants: ['Руководители методических объединений (ПЦК)'],
    agenda: [
      'Проверка портфолио аттестуемых педагогов (НКТ/ОЗП)',
      'Обобщение передового педагогического опыта',
      'Организация открытых уроков и мастер-классов'
    ],
    status: 'scheduled'
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Поручение от директора КГУ «СШ № 43»',
    message: 'Назначена задача: «Сдать графики проведения СОР и СОЧ за 1 четверть»',
    time: '5 мин назад',
    read: false,
    type: 'task'
  },
  {
    id: 'notif-2',
    title: 'Напоминание о планёрке',
    message: 'Завтра в 08:30 в кабинете директора состоится еженедельная аппаратная планёрка.',
    time: '1 час назад',
    read: false,
    type: 'meeting'
  },
  {
    id: 'notif-3',
    title: 'Справка Kundelik.kz проверена',
    message: 'Директор Омарова Г.Б. приняла аналитический отчет по электронному журналу.',
    time: '2 часа назад',
    read: true,
    type: 'file'
  }
];
