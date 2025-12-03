import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'fr' | 'en' | 'ar' | 'es' | 'pt' | 'zh' | 'ja' | 'hi';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export type TranslationKeys = {
  // General
  home: string;
  settings: string;
  cancel: string;
  save: string;
  delete: string;
  confirm: string;
  yes: string;
  no: string;
  ok: string;
  retry: string;
  loading: string;
  error: string;

  // Navigation
  alarms: string;
  worldClock: string;
  stopwatch: string;
  timer: string;

  // Alarms
  myAlarms: string;
  noAlarms: string;
  addFirstAlarm: string;
  deleteAlarm: string;
  deleteAlarmConfirm: string;
  everyDay: string;

  // World Clock
  worldClockTitle: string;
  addCity: string;
  searchCity: string;
  today: string;
  tomorrow: string;
  yesterday: string;

  // Stopwatch
  stopwatchTitle: string;
  ready: string;
  running: string;
  stopped: string;
  reset: string;
  lap: string;
  lapsRecorded: string;
  lapNumber: string;
  lapTime: string;
  totalTime: string;

  // Timer
  timerTitle: string;
  quickDurations: string;
  alarmSound: string;
  timeUp: string;
  timerFinished: string;
  tapToModify: string;

  // Weather
  loadingWeather: string;
  locationDenied: string;
  tapToRetry: string;
  humidity: string;
  wind: string;

  // AI Assistant
  aiAssistant: string;
  poweredBy: string;
  hello: string;
  aiWelcome: string;
  writeMessage: string;
  errorOccurred: string;

  // Clock Selector
  chooseClock: string;
  selectClockStyle: string;
  digital: string;
  holographic: string;
  fluid: string;
  flapDark: string;
  flapLight: string;
  classicWorldClock: string;
  futuristicHUD: string;
  cyanFluidStyle: string;
  retroSplitFlapDark: string;
  retroSplitFlapLight: string;
  choiceSaved: string;

  // Language
  language: string;
  selectLanguage: string;
};

const translations: Record<Language, TranslationKeys> = {
  fr: {
    // General
    home: 'Accueil',
    settings: 'Paramètres',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    yes: 'Oui',
    no: 'Non',
    ok: 'OK',
    retry: 'Réessayer',
    loading: 'Chargement...',
    error: 'Erreur',

    // Navigation
    alarms: 'Alarmes',
    worldClock: 'Horloge',
    stopwatch: 'Chrono',
    timer: 'Minuteur',

    // Alarms
    myAlarms: 'Mes Alarmes',
    noAlarms: 'Aucune alarme configurée',
    addFirstAlarm: 'Appuyez sur + pour ajouter votre première alarme',
    deleteAlarm: 'Supprimer l\'alarme',
    deleteAlarmConfirm: 'Êtes-vous sûr de vouloir supprimer cette alarme ?',
    everyDay: 'Tous les jours',

    // World Clock
    worldClockTitle: 'Horloge Mondiale',
    addCity: 'Ajouter une ville',
    searchCity: 'Rechercher une ville...',
    today: 'Aujourd\'hui',
    tomorrow: 'Demain',
    yesterday: 'Hier',

    // Stopwatch
    stopwatchTitle: 'Chronomètre',
    ready: 'Prêt',
    running: 'En cours...',
    stopped: 'Arrêté',
    reset: 'Reset',
    lap: 'Tour',
    lapsRecorded: 'Tours enregistrés',
    lapNumber: 'Tour',
    lapTime: 'Temps du tour',
    totalTime: 'Temps total',

    // Timer
    timerTitle: 'Minuteur',
    quickDurations: 'Durées rapides',
    alarmSound: 'Son d\'alarme',
    timeUp: '⏰ Temps écoulé !',
    timerFinished: 'Votre minuteur est terminé.',
    tapToModify: 'Appuyez pour modifier',

    // Weather
    loadingWeather: 'Chargement de la météo...',
    locationDenied: 'Permission de géolocalisation refusée',
    tapToRetry: 'Appuyez pour réessayer',
    humidity: 'Humidité',
    wind: 'Vent',

    // AI Assistant
    aiAssistant: 'Assistant IA',
    poweredBy: 'Propulsé par Groq',
    hello: 'Bonjour !',
    aiWelcome: 'Je suis votre assistant IA. Posez-moi des questions sur l\'heure, les alarmes, la productivité ou discutons simplement !',
    writeMessage: 'Écrivez votre message...',
    errorOccurred: 'Désolé, une erreur est survenue. Veuillez réessayer.',

    // Clock Selector
    chooseClock: 'Choisir une horloge',
    selectClockStyle: 'Sélectionnez le style d\'horloge qui vous convient',
    digital: 'Digitale',
    holographic: 'Holographique',
    fluid: 'Fluide',
    flapDark: 'Flip-Flap Sombre',
    flapLight: 'Flip-Flap Clair',
    classicWorldClock: 'Horloge mondiale classique',
    futuristicHUD: 'Horloge HUD futuriste avec anneaux',
    cyanFluidStyle: 'Style cyan avec animations fluides',
    retroSplitFlapDark: 'Style rétro split-flap sombre',
    retroSplitFlapLight: 'Style rétro split-flap clair',
    choiceSaved: 'Votre choix sera sauvegardé automatiquement',

    // Language
    language: 'Langue',
    selectLanguage: 'Sélectionner la langue',
  },

  en: {
    // General
    home: 'Home',
    settings: 'Settings',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    retry: 'Retry',
    loading: 'Loading...',
    error: 'Error',

    // Navigation
    alarms: 'Alarms',
    worldClock: 'Clock',
    stopwatch: 'Stopwatch',
    timer: 'Timer',

    // Alarms
    myAlarms: 'My Alarms',
    noAlarms: 'No alarms configured',
    addFirstAlarm: 'Tap + to add your first alarm',
    deleteAlarm: 'Delete Alarm',
    deleteAlarmConfirm: 'Are you sure you want to delete this alarm?',
    everyDay: 'Every day',

    // World Clock
    worldClockTitle: 'World Clock',
    addCity: 'Add a city',
    searchCity: 'Search for a city...',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',

    // Stopwatch
    stopwatchTitle: 'Stopwatch',
    ready: 'Ready',
    running: 'Running...',
    stopped: 'Stopped',
    reset: 'Reset',
    lap: 'Lap',
    lapsRecorded: 'Recorded laps',
    lapNumber: 'Lap',
    lapTime: 'Lap time',
    totalTime: 'Total time',

    // Timer
    timerTitle: 'Timer',
    quickDurations: 'Quick durations',
    alarmSound: 'Alarm sound',
    timeUp: '⏰ Time\'s up!',
    timerFinished: 'Your timer has finished.',
    tapToModify: 'Tap to modify',

    // Weather
    loadingWeather: 'Loading weather...',
    locationDenied: 'Location permission denied',
    tapToRetry: 'Tap to retry',
    humidity: 'Humidity',
    wind: 'Wind',

    // AI Assistant
    aiAssistant: 'AI Assistant',
    poweredBy: 'Powered by Groq',
    hello: 'Hello!',
    aiWelcome: 'I\'m your AI assistant. Ask me about time, alarms, productivity, or let\'s just chat!',
    writeMessage: 'Write your message...',
    errorOccurred: 'Sorry, an error occurred. Please try again.',

    // Clock Selector
    chooseClock: 'Choose a clock',
    selectClockStyle: 'Select the clock style that suits you',
    digital: 'Digital',
    holographic: 'Holographic',
    fluid: 'Fluid',
    flapDark: 'Flip-Flap Dark',
    flapLight: 'Flip-Flap Light',
    classicWorldClock: 'Classic world clock',
    futuristicHUD: 'Futuristic HUD clock with rings',
    cyanFluidStyle: 'Cyan style with fluid animations',
    retroSplitFlapDark: 'Retro split-flap dark style',
    retroSplitFlapLight: 'Retro split-flap light style',
    choiceSaved: 'Your choice will be saved automatically',

    // Language
    language: 'Language',
    selectLanguage: 'Select language',
  },

  ar: {
    // General
    home: 'الرئيسية',
    settings: 'الإعدادات',
    cancel: 'إلغاء',
    save: 'حفظ',
    delete: 'حذف',
    confirm: 'تأكيد',
    yes: 'نعم',
    no: 'لا',
    ok: 'حسناً',
    retry: 'إعادة المحاولة',
    loading: 'جاري التحميل...',
    error: 'خطأ',

    // Navigation
    alarms: 'المنبهات',
    worldClock: 'الساعة',
    stopwatch: 'ساعة إيقاف',
    timer: 'مؤقت',

    // Alarms
    myAlarms: 'منبهاتي',
    noAlarms: 'لا توجد منبهات',
    addFirstAlarm: 'اضغط + لإضافة أول منبه',
    deleteAlarm: 'حذف المنبه',
    deleteAlarmConfirm: 'هل أنت متأكد من حذف هذا المنبه؟',
    everyDay: 'كل يوم',

    // World Clock
    worldClockTitle: 'الساعة العالمية',
    addCity: 'إضافة مدينة',
    searchCity: 'البحث عن مدينة...',
    today: 'اليوم',
    tomorrow: 'غداً',
    yesterday: 'أمس',

    // Stopwatch
    stopwatchTitle: 'ساعة الإيقاف',
    ready: 'جاهز',
    running: 'قيد التشغيل...',
    stopped: 'متوقف',
    reset: 'إعادة تعيين',
    lap: 'دورة',
    lapsRecorded: 'الدورات المسجلة',
    lapNumber: 'دورة',
    lapTime: 'وقت الدورة',
    totalTime: 'الوقت الإجمالي',

    // Timer
    timerTitle: 'المؤقت',
    quickDurations: 'مدد سريعة',
    alarmSound: 'صوت المنبه',
    timeUp: '⏰ انتهى الوقت!',
    timerFinished: 'انتهى المؤقت.',
    tapToModify: 'اضغط للتعديل',

    // Weather
    loadingWeather: 'جاري تحميل الطقس...',
    locationDenied: 'تم رفض إذن الموقع',
    tapToRetry: 'اضغط للمحاولة مرة أخرى',
    humidity: 'الرطوبة',
    wind: 'الرياح',

    // AI Assistant
    aiAssistant: 'مساعد الذكاء الاصطناعي',
    poweredBy: 'مدعوم من Groq',
    hello: 'مرحباً!',
    aiWelcome: 'أنا مساعدك الذكي. اسألني عن الوقت أو المنبهات أو الإنتاجية أو دعنا نتحدث!',
    writeMessage: 'اكتب رسالتك...',
    errorOccurred: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',

    // Clock Selector
    chooseClock: 'اختر ساعة',
    selectClockStyle: 'اختر نمط الساعة الذي يناسبك',
    digital: 'رقمية',
    holographic: 'هولوغرافية',
    fluid: 'سائلة',
    flapDark: 'فليب فلاب داكن',
    flapLight: 'فليب فلاب فاتح',
    classicWorldClock: 'ساعة عالمية كلاسيكية',
    futuristicHUD: 'ساعة HUD مستقبلية مع حلقات',
    cyanFluidStyle: 'نمط سماوي مع رسوم متحركة سائلة',
    retroSplitFlapDark: 'نمط سبليت فلاب ريترو داكن',
    retroSplitFlapLight: 'نمط سبليت فلاب ريترو فاتح',
    choiceSaved: 'سيتم حفظ اختيارك تلقائياً',

    // Language
    language: 'اللغة',
    selectLanguage: 'اختر اللغة',
  },

  es: {
    // General
    home: 'Inicio',
    settings: 'Ajustes',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    yes: 'Sí',
    no: 'No',
    ok: 'OK',
    retry: 'Reintentar',
    loading: 'Cargando...',
    error: 'Error',

    // Navigation
    alarms: 'Alarmas',
    worldClock: 'Reloj',
    stopwatch: 'Cronómetro',
    timer: 'Temporizador',

    // Alarms
    myAlarms: 'Mis Alarmas',
    noAlarms: 'No hay alarmas configuradas',
    addFirstAlarm: 'Toca + para añadir tu primera alarma',
    deleteAlarm: 'Eliminar Alarma',
    deleteAlarmConfirm: '¿Estás seguro de que quieres eliminar esta alarma?',
    everyDay: 'Todos los días',

    // World Clock
    worldClockTitle: 'Reloj Mundial',
    addCity: 'Añadir ciudad',
    searchCity: 'Buscar ciudad...',
    today: 'Hoy',
    tomorrow: 'Mañana',
    yesterday: 'Ayer',

    // Stopwatch
    stopwatchTitle: 'Cronómetro',
    ready: 'Listo',
    running: 'En marcha...',
    stopped: 'Detenido',
    reset: 'Reiniciar',
    lap: 'Vuelta',
    lapsRecorded: 'Vueltas registradas',
    lapNumber: 'Vuelta',
    lapTime: 'Tiempo de vuelta',
    totalTime: 'Tiempo total',

    // Timer
    timerTitle: 'Temporizador',
    quickDurations: 'Duraciones rápidas',
    alarmSound: 'Sonido de alarma',
    timeUp: '⏰ ¡Tiempo!',
    timerFinished: 'Tu temporizador ha terminado.',
    tapToModify: 'Toca para modificar',

    // Weather
    loadingWeather: 'Cargando el clima...',
    locationDenied: 'Permiso de ubicación denegado',
    tapToRetry: 'Toca para reintentar',
    humidity: 'Humedad',
    wind: 'Viento',

    // AI Assistant
    aiAssistant: 'Asistente IA',
    poweredBy: 'Impulsado por Groq',
    hello: '¡Hola!',
    aiWelcome: 'Soy tu asistente de IA. Pregúntame sobre la hora, alarmas, productividad o simplemente charlemos.',
    writeMessage: 'Escribe tu mensaje...',
    errorOccurred: 'Lo siento, ocurrió un error. Por favor, inténtalo de nuevo.',

    // Clock Selector
    chooseClock: 'Elegir un reloj',
    selectClockStyle: 'Selecciona el estilo de reloj que te convenga',
    digital: 'Digital',
    holographic: 'Holográfico',
    fluid: 'Fluido',
    flapDark: 'Flip-Flap Oscuro',
    flapLight: 'Flip-Flap Claro',
    classicWorldClock: 'Reloj mundial clásico',
    futuristicHUD: 'Reloj HUD futurista con anillos',
    cyanFluidStyle: 'Estilo cian con animaciones fluidas',
    retroSplitFlapDark: 'Estilo retro split-flap oscuro',
    retroSplitFlapLight: 'Estilo retro split-flap claro',
    choiceSaved: 'Tu elección se guardará automáticamente',

    // Language
    language: 'Idioma',
    selectLanguage: 'Seleccionar idioma',
  },

  pt: {
    // General
    home: 'Início',
    settings: 'Configurações',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    confirm: 'Confirmar',
    yes: 'Sim',
    no: 'Não',
    ok: 'OK',
    retry: 'Tentar novamente',
    loading: 'Carregando...',
    error: 'Erro',

    // Navigation
    alarms: 'Alarmes',
    worldClock: 'Relógio',
    stopwatch: 'Cronômetro',
    timer: 'Timer',

    // Alarms
    myAlarms: 'Meus Alarmes',
    noAlarms: 'Nenhum alarme configurado',
    addFirstAlarm: 'Toque em + para adicionar seu primeiro alarme',
    deleteAlarm: 'Excluir Alarme',
    deleteAlarmConfirm: 'Tem certeza de que deseja excluir este alarme?',
    everyDay: 'Todos os dias',

    // World Clock
    worldClockTitle: 'Relógio Mundial',
    addCity: 'Adicionar cidade',
    searchCity: 'Pesquisar cidade...',
    today: 'Hoje',
    tomorrow: 'Amanhã',
    yesterday: 'Ontem',

    // Stopwatch
    stopwatchTitle: 'Cronômetro',
    ready: 'Pronto',
    running: 'Rodando...',
    stopped: 'Parado',
    reset: 'Reiniciar',
    lap: 'Volta',
    lapsRecorded: 'Voltas registradas',
    lapNumber: 'Volta',
    lapTime: 'Tempo da volta',
    totalTime: 'Tempo total',

    // Timer
    timerTitle: 'Timer',
    quickDurations: 'Durações rápidas',
    alarmSound: 'Som do alarme',
    timeUp: '⏰ Tempo esgotado!',
    timerFinished: 'Seu timer terminou.',
    tapToModify: 'Toque para modificar',

    // Weather
    loadingWeather: 'Carregando clima...',
    locationDenied: 'Permissão de localização negada',
    tapToRetry: 'Toque para tentar novamente',
    humidity: 'Umidade',
    wind: 'Vento',

    // AI Assistant
    aiAssistant: 'Assistente IA',
    poweredBy: 'Desenvolvido por Groq',
    hello: 'Olá!',
    aiWelcome: 'Sou seu assistente de IA. Pergunte-me sobre horários, alarmes, produtividade ou vamos conversar!',
    writeMessage: 'Escreva sua mensagem...',
    errorOccurred: 'Desculpe, ocorreu um erro. Por favor, tente novamente.',

    // Clock Selector
    chooseClock: 'Escolher um relógio',
    selectClockStyle: 'Selecione o estilo de relógio que combina com você',
    digital: 'Digital',
    holographic: 'Holográfico',
    fluid: 'Fluido',
    flapDark: 'Flip-Flap Escuro',
    flapLight: 'Flip-Flap Claro',
    classicWorldClock: 'Relógio mundial clássico',
    futuristicHUD: 'Relógio HUD futurista com anéis',
    cyanFluidStyle: 'Estilo ciano com animações fluidas',
    retroSplitFlapDark: 'Estilo retro split-flap escuro',
    retroSplitFlapLight: 'Estilo retro split-flap claro',
    choiceSaved: 'Sua escolha será salva automaticamente',

    // Language
    language: 'Idioma',
    selectLanguage: 'Selecionar idioma',
  },

  zh: {
    // General
    home: '首页',
    settings: '设置',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    confirm: '确认',
    yes: '是',
    no: '否',
    ok: '确定',
    retry: '重试',
    loading: '加载中...',
    error: '错误',

    // Navigation
    alarms: '闹钟',
    worldClock: '时钟',
    stopwatch: '秒表',
    timer: '计时器',

    // Alarms
    myAlarms: '我的闹钟',
    noAlarms: '没有设置闹钟',
    addFirstAlarm: '点击 + 添加您的第一个闹钟',
    deleteAlarm: '删除闹钟',
    deleteAlarmConfirm: '您确定要删除这个闹钟吗？',
    everyDay: '每天',

    // World Clock
    worldClockTitle: '世界时钟',
    addCity: '添加城市',
    searchCity: '搜索城市...',
    today: '今天',
    tomorrow: '明天',
    yesterday: '昨天',

    // Stopwatch
    stopwatchTitle: '秒表',
    ready: '准备',
    running: '运行中...',
    stopped: '已停止',
    reset: '重置',
    lap: '圈',
    lapsRecorded: '已记录的圈数',
    lapNumber: '圈',
    lapTime: '单圈时间',
    totalTime: '总时间',

    // Timer
    timerTitle: '计时器',
    quickDurations: '快速时长',
    alarmSound: '闹钟铃声',
    timeUp: '⏰ 时间到！',
    timerFinished: '您的计时器已结束。',
    tapToModify: '点击修改',

    // Weather
    loadingWeather: '加载天气中...',
    locationDenied: '位置权限被拒绝',
    tapToRetry: '点击重试',
    humidity: '湿度',
    wind: '风速',

    // AI Assistant
    aiAssistant: 'AI 助手',
    poweredBy: '由 Groq 提供支持',
    hello: '你好！',
    aiWelcome: '我是您的 AI 助手。问我关于时间、闹钟、生产力的问题，或者我们聊聊天！',
    writeMessage: '输入您的消息...',
    errorOccurred: '抱歉，发生错误。请重试。',

    // Clock Selector
    chooseClock: '选择时钟',
    selectClockStyle: '选择适合您的时钟样式',
    digital: '数字',
    holographic: '全息',
    fluid: '流体',
    flapDark: '翻页深色',
    flapLight: '翻页浅色',
    classicWorldClock: '经典世界时钟',
    futuristicHUD: '带环形的未来派 HUD 时钟',
    cyanFluidStyle: '带流体动画的青色风格',
    retroSplitFlapDark: '复古翻页深色风格',
    retroSplitFlapLight: '复古翻页浅色风格',
    choiceSaved: '您的选择将自动保存',

    // Language
    language: '语言',
    selectLanguage: '选择语言',
  },

  ja: {
    // General
    home: 'ホーム',
    settings: '設定',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    confirm: '確認',
    yes: 'はい',
    no: 'いいえ',
    ok: 'OK',
    retry: '再試行',
    loading: '読み込み中...',
    error: 'エラー',

    // Navigation
    alarms: 'アラーム',
    worldClock: '時計',
    stopwatch: 'ストップウォッチ',
    timer: 'タイマー',

    // Alarms
    myAlarms: 'マイアラーム',
    noAlarms: 'アラームが設定されていません',
    addFirstAlarm: '+ をタップして最初のアラームを追加',
    deleteAlarm: 'アラームを削除',
    deleteAlarmConfirm: 'このアラームを削除してもよろしいですか？',
    everyDay: '毎日',

    // World Clock
    worldClockTitle: '世界時計',
    addCity: '都市を追加',
    searchCity: '都市を検索...',
    today: '今日',
    tomorrow: '明日',
    yesterday: '昨日',

    // Stopwatch
    stopwatchTitle: 'ストップウォッチ',
    ready: '準備完了',
    running: '計測中...',
    stopped: '停止',
    reset: 'リセット',
    lap: 'ラップ',
    lapsRecorded: '記録されたラップ',
    lapNumber: 'ラップ',
    lapTime: 'ラップタイム',
    totalTime: '合計時間',

    // Timer
    timerTitle: 'タイマー',
    quickDurations: 'クイック設定',
    alarmSound: 'アラーム音',
    timeUp: '⏰ 時間です！',
    timerFinished: 'タイマーが終了しました。',
    tapToModify: 'タップして変更',

    // Weather
    loadingWeather: '天気を読み込み中...',
    locationDenied: '位置情報の許可が拒否されました',
    tapToRetry: 'タップして再試行',
    humidity: '湿度',
    wind: '風速',

    // AI Assistant
    aiAssistant: 'AIアシスタント',
    poweredBy: 'Groq搭載',
    hello: 'こんにちは！',
    aiWelcome: '私はあなたのAIアシスタントです。時間、アラーム、生産性について質問するか、おしゃべりしましょう！',
    writeMessage: 'メッセージを入力...',
    errorOccurred: '申し訳ございません、エラーが発生しました。もう一度お試しください。',

    // Clock Selector
    chooseClock: '時計を選択',
    selectClockStyle: 'お好みの時計スタイルを選択してください',
    digital: 'デジタル',
    holographic: 'ホログラフィック',
    fluid: 'フルイド',
    flapDark: 'フリップフラップ ダーク',
    flapLight: 'フリップフラップ ライト',
    classicWorldClock: 'クラシック世界時計',
    futuristicHUD: 'リング付き未来派HUD時計',
    cyanFluidStyle: 'フルイドアニメーション付きシアンスタイル',
    retroSplitFlapDark: 'レトロスプリットフラップ ダークスタイル',
    retroSplitFlapLight: 'レトロスプリットフラップ ライトスタイル',
    choiceSaved: '選択は自動的に保存されます',

    // Language
    language: '言語',
    selectLanguage: '言語を選択',
  },

  hi: {
    // General
    home: 'होम',
    settings: 'सेटिंग्स',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    delete: 'हटाएं',
    confirm: 'पुष्टि करें',
    yes: 'हाँ',
    no: 'नहीं',
    ok: 'ठीक है',
    retry: 'पुनः प्रयास करें',
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',

    // Navigation
    alarms: 'अलार्म',
    worldClock: 'घड़ी',
    stopwatch: 'स्टॉपवॉच',
    timer: 'टाइमर',

    // Alarms
    myAlarms: 'मेरे अलार्म',
    noAlarms: 'कोई अलार्म सेट नहीं है',
    addFirstAlarm: 'अपना पहला अलार्म जोड़ने के लिए + दबाएं',
    deleteAlarm: 'अलार्म हटाएं',
    deleteAlarmConfirm: 'क्या आप वाकई इस अलार्म को हटाना चाहते हैं?',
    everyDay: 'हर दिन',

    // World Clock
    worldClockTitle: 'विश्व घड़ी',
    addCity: 'शहर जोड़ें',
    searchCity: 'शहर खोजें...',
    today: 'आज',
    tomorrow: 'कल',
    yesterday: 'कल',

    // Stopwatch
    stopwatchTitle: 'स्टॉपवॉच',
    ready: 'तैयार',
    running: 'चल रहा है...',
    stopped: 'रुका हुआ',
    reset: 'रीसेट',
    lap: 'लैप',
    lapsRecorded: 'रिकॉर्ड किए गए लैप',
    lapNumber: 'लैप',
    lapTime: 'लैप समय',
    totalTime: 'कुल समय',

    // Timer
    timerTitle: 'टाइमर',
    quickDurations: 'त्वरित अवधि',
    alarmSound: 'अलार्म ध्वनि',
    timeUp: '⏰ समय समाप्त!',
    timerFinished: 'आपका टाइमर समाप्त हो गया।',
    tapToModify: 'बदलने के लिए टैप करें',

    // Weather
    loadingWeather: 'मौसम लोड हो रहा है...',
    locationDenied: 'स्थान अनुमति अस्वीकृत',
    tapToRetry: 'पुनः प्रयास के लिए टैप करें',
    humidity: 'आर्द्रता',
    wind: 'हवा',

    // AI Assistant
    aiAssistant: 'AI सहायक',
    poweredBy: 'Groq द्वारा संचालित',
    hello: 'नमस्ते!',
    aiWelcome: 'मैं आपका AI सहायक हूं। मुझसे समय, अलार्म, उत्पादकता के बारे में पूछें या बस बातचीत करें!',
    writeMessage: 'अपना संदेश लिखें...',
    errorOccurred: 'क्षमा करें, एक त्रुटि हुई। कृपया पुनः प्रयास करें।',

    // Clock Selector
    chooseClock: 'घड़ी चुनें',
    selectClockStyle: 'अपने लिए उपयुक्त घड़ी शैली चुनें',
    digital: 'डिजिटल',
    holographic: 'होलोग्राफिक',
    fluid: 'फ्लूइड',
    flapDark: 'फ्लिप-फ्लैप डार्क',
    flapLight: 'फ्लिप-फ्लैप लाइट',
    classicWorldClock: 'क्लासिक विश्व घड़ी',
    futuristicHUD: 'रिंग के साथ फ्यूचरिस्टिक HUD घड़ी',
    cyanFluidStyle: 'फ्लूइड एनिमेशन के साथ सियान शैली',
    retroSplitFlapDark: 'रेट्रो स्प्लिट-फ्लैप डार्क शैली',
    retroSplitFlapLight: 'रेट्रो स्प्लिट-फ्लैप लाइट शैली',
    choiceSaved: 'आपकी पसंद स्वचालित रूप से सहेजी जाएगी',

    // Language
    language: 'भाषा',
    selectLanguage: 'भाषा चुनें',
  },
};

const LANGUAGE_STORAGE_KEY = 'app_language';

export const getTranslation = (language: Language): TranslationKeys => {
  return translations[language] || translations.fr;
};

export const t = (key: keyof TranslationKeys, language: Language): string => {
  return translations[language]?.[key] || translations.fr[key] || key;
};

export const saveLanguage = async (language: Language): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export const loadLanguage = async (): Promise<Language> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && isValidLanguage(saved)) {
      return saved as Language;
    }
  } catch (error) {
    console.error('Error loading language:', error);
  }
  return 'fr';
};

const isValidLanguage = (lang: string): lang is Language => {
  return ['fr', 'en', 'ar', 'es', 'pt', 'zh', 'ja', 'hi'].includes(lang);
};
