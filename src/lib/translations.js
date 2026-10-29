// ==========================================================================
// СИСТЕМА МНОГОЯЗЫЧНОСТИ (ҚАЗАҚША / РУССКИЙ) — КГУ «СШ № 43»
// ==========================================================================

export const translations = {
  ru: {
    // Общие
    schoolShort: 'КГУ «СШ № 43»',
    schoolFull: 'КГУ «Средняя общеобразовательная школа № 43»',
    schoolSub: 'Мектеп басшысы мен әкімшілігінің кабинеті',
    academicYear: '2026/2027 учебный год • 1 четверть',
    systemStatus: 'Система активна',
    logout: 'Выйти из кабинета',
    loginTitle: 'Вход в школьную планёрку',
    loginSubtitle: 'КГУ «Средняя общеобразовательная школа № 43»',
    loginLabel: 'Логин или Email',
    passwordLabel: 'Пароль',
    loginButton: 'Войти в кабинет',
    loginError: 'Неверный логин или пароль. Обратитесь к директору.',
    kundelikLink: 'Kundelik.kz',

    // Навигация
    navPulse: 'Пульс школы',
    navPlanner: 'Планёрка',
    navTasks: 'Поручения',
    navDocs: 'Сбор отчетов',
    navStaff: 'Педколлектив',
    navSettings: 'Интеграции',

    // Быстрые кнопки
    btnNewTask: 'Дать поручение',
    btnNewMeeting: 'Назначить планёрку',
    btnDeleteMeeting: 'Удалить встречу',
    btnSubmitReport: 'Сдать отчет',
    btnAcceptReport: 'Принять отчет',
    btnRejectReport: 'На доработку',
    btnCancelTask: 'Отменить поручение',
    btnConfirmCancel: 'Подтвердить отмену',
    btnSave: 'Сохранить',
    btnCancel: 'Отмена',
    btnClose: 'Закрыть',
    btnDownload: 'Скачать',
    btnPrintPasswords: 'Распечатать ведомость паролей',
    btnAddStaff: 'Добавить педагога',
    btnTestDb: 'Проверить связь с базой Supabase',
    btnEnablePush: 'Включить пуши',

    // Статусы задач
    statusTodo: 'К исполнению',
    statusInProgress: 'В работе',
    statusSubmitted: 'На проверке',
    statusCompleted: 'Принято',
    statusRevision: 'Доработка',
    statusCancelled: 'Отменено',

    // Приоритеты
    priorityNormal: 'Обычный',
    priorityHigh: 'Высокий',
    priorityUrgent: 'Срочно (Приказ)',

    // Дашборд
    dashGreeting: 'Здравствуйте',
    dashPendingReview: 'Сдано на проверку',
    dashUrgent: 'Срочно / Просрочено',
    dashTotalTasks: 'Всего поручений',
    dashDiscipline: 'Исполнительская дисциплина',
    dashActiveTasksTitle: 'Поручения на контроле',
    dashMyTasksTitle: 'Мои текущие задачи',
    dashMeetingsTitle: 'Планёрки и совещания',
    dashAllTasksBtn: 'Все поручения',
    dashAllMeetingsBtn: 'Расписание',

    // Задачи и фильтры
    filterAll: 'Все поручения',
    filterMy: 'Мои задачи',
    filterPending: 'На проверке',
    filterUrgent: 'Срочные / Просрочка',
    filterCompleted: 'Завершенные',
    filterCancelled: 'Отмененные',
    searchTaskPlaceholder: 'Поиск по теме или учителю...',

    // Отмена поручения
    cancelTaskModalTitle: 'Отмена поручения',
    cancelReasonLabel: 'Укажите причину отмены поручения *',
    cancelReasonPlaceholder: 'Например: Вопрос рассмотрен на совещании / Снято с контроля директором...',
    taskCancelledNotice: 'Данное поручение отменено постановщиком',
    cancellationReason: 'Причина отмены',
    confirmDeleteMeeting: 'Удалить эту планёрку / совещание?',

    // Сбор документов
    docsMatrixTab: '📋 Матрица сдачи по учителям',
    docsArchiveTab: '📁 Архив всех файлов',
    docsStorageNotice: 'Безлимитное хранение (экономия квоты Supabase)',
    docsTeacherCol: 'Педагог / Должность',
    docsSubjectCol: 'Предмет / Класс',
    docsStatusCol: 'Статус',
    docsAllSubmitted: 'Всё сдано',
    docsInProgress: 'В процессе',
    docsNotSubmitted: 'Не сдан',

    // Педколлектив
    staffCredentials: 'Данные для входа',
    staffLogin: 'Логин',
    staffPassword: 'Пароль',
    staffCopy: 'Копировать',
    staffCopied: 'Скопировано',

    // Календарь
    calendarWeek: 'Неделя',
    calendarMonth: 'Месяц',
    calendarAgenda: 'Все встречи'
  },

  kk: {
    // Общие
    schoolShort: '«№ 43 ОМ» КММ',
    schoolFull: '«№ 43 орта жалпы білім беретін мектеп» КММ',
    schoolSub: 'Мектеп басшысы мен әкімшілігінің кабинеті',
    academicYear: '2026/2027 оқу жылы • 1 тоқсан',
    systemStatus: 'Жүйе белсенді',
    logout: 'Кабинеттен шығу',
    loginTitle: 'Мектеп планеркасына кіру',
    loginSubtitle: '«№ 43 орта жалпы білім беретін мектеп» КММ',
    loginLabel: 'Логин немесе Email',
    passwordLabel: 'Құпия сөз',
    loginButton: 'Кабинетке кіру',
    loginError: 'Қате логин немесе құпия сөз. Мектеп басшысына хабарласыңыз.',
    kundelikLink: 'Kundelik.kz',

    // Навигация
    navPulse: 'Мектеп тынысы',
    navPlanner: 'Жоспарлау',
    navTasks: 'Тапсырмалар',
    navDocs: 'Есептер жинағы',
    navStaff: 'Педагогтар',
    navSettings: 'Баптаулар',

    // Быстрые кнопки
    btnNewTask: 'Тапсырма беру',
    btnNewMeeting: 'Жиналыс белгілеу',
    btnDeleteMeeting: 'Жиналысты жою',
    btnSubmitReport: 'Есепті тапсыру',
    btnAcceptReport: 'Есепті қабылдау',
    btnRejectReport: 'Қайта өңдеуге',
    btnCancelTask: 'Тапсырманың күшін жою',
    btnConfirmCancel: 'Күшін жоюды растау',
    btnSave: 'Сақтау',
    btnCancel: 'Бас тарту',
    btnClose: 'Жабу',
    btnDownload: 'Жүктеп алу',
    btnPrintPasswords: 'Құпия сөздер тізімін басып шығару',
    btnAddStaff: 'Педагогті қосу',
    btnTestDb: 'Supabase базасымен байланысты тексеру',
    btnEnablePush: 'Хабарламаны қосу',

    // Статусы задач
    statusTodo: 'Орындауға',
    statusInProgress: 'Жұмыста',
    statusSubmitted: 'Тексерілуде',
    statusCompleted: 'Қабылданды',
    statusRevision: 'Қайта қарауда',
    statusCancelled: 'Күші жойылды',

    // Приоритеты
    priorityNormal: 'Қалыпты',
    priorityHigh: 'Жоғары',
    priorityUrgent: 'Шұғыл (Бұйрық)',

    // Дашборд
    dashGreeting: 'Қайырлы күн',
    dashPendingReview: 'Тексерілудегі есептер',
    dashUrgent: 'Шұғыл / Мерзімі өткен',
    dashTotalTasks: 'Барлық тапсырма',
    dashDiscipline: 'Орындау тәртібі',
    dashActiveTasksTitle: 'Бақылаудағы тапсырмалар',
    dashMyTasksTitle: 'Менің тапсырмаларым',
    dashMeetingsTitle: 'Жиналыстар мен планеркалар',
    dashAllTasksBtn: 'Барлық тапсырмалар',
    dashAllMeetingsBtn: 'Кесте',

    // Задачи и фильтры
    filterAll: 'Барлық тапсырма',
    filterMy: 'Менің тапсырмаларым',
    filterPending: 'Тексерілуде',
    filterUrgent: 'Шұғыл / Мерзімі өткен',
    filterCompleted: 'Аяқталған',
    filterCancelled: 'Күші жойылған',
    searchTaskPlaceholder: 'Тақырып немесе мұғалім бойынша іздеу...',

    // Отмена поручения
    cancelTaskModalTitle: 'Тапсырманың күшін жою',
    cancelReasonLabel: 'Тапсырманың күшін жою себебін көрсетіңіз *',
    cancelReasonPlaceholder: 'Мысалы: Жиналыста қаралды / Директор шешімімен алынды...',
    taskCancelledNotice: 'Бұл тапсырманың күші тапсырма беруші тарапынан жойылған',
    cancellationReason: 'Күшін жою себебі',
    confirmDeleteMeeting: 'Бұл жиналысты өшіргіңіз келетініне сенімдісіз бе?',

    // Сбор документов
    docsMatrixTab: '📋 Мұғалімдер бойынша тапсыру кестесі',
    docsArchiveTab: '📁 Барлық файлдар мұрағаты',
    docsStorageNotice: 'Шексіз сақтау (Supabase квотасын үнемдеу)',
    docsTeacherCol: 'Педагог / Қызметі',
    docsSubjectCol: 'Пән / Сынып',
    docsStatusCol: 'Күйі',
    docsAllSubmitted: 'Барлығы тапсырылды',
    docsInProgress: 'Орындалуда',
    docsNotSubmitted: 'Тапсырылмады',

    // Педколлектив
    staffCredentials: 'Кіру деректері',
    staffLogin: 'Логин',
    staffPassword: 'Құпия сөз',
    staffCopy: 'Көшіру',
    staffCopied: 'Көшірілді',

    // Календарь
    calendarWeek: 'Апта',
    calendarMonth: 'Ай',
    calendarAgenda: 'Барлық кездесулер'
  }
};
