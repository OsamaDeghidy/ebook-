export interface AvatarPreset {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'robot' | 'mascot' | 'academic' | 'egyptian';
  primaryColor: string;
  accentColor: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'ai_robot',
    name: 'روبي',
    title: 'رفيق الذكاء الاصطناعي التفاعلي',
    description: 'روبوت ذكي حركي، بشاشة OLED ديناميكية للتعبير عن المشاعر، وأذرع ذكية تشير وتشرح وتتفاعل لحظياً مع الكلام.',
    category: 'robot',
    primaryColor: '#06b6d4',
    accentColor: '#38bdf8'
  },
  {
    id: 'fatin_owl',
    name: 'فَطِن',
    title: 'البومة الذكية ورفيقك التعليمي',
    description: 'تميمة بومة ثلاثية الأبعاد بأسلوب بيكسار، ترتدي قبعة التخرج ونظارة ذكية.',
    category: 'mascot',
    primaryColor: '#0ea5e9',
    accentColor: '#f59e0b'
  },

  {
    id: 'egyptian_scholar',
    name: 'حكيم',
    title: 'المعلم المصري المعاصر',
    description: 'شخصية حكيم مصري قديم يرتدي نظارة ذكية معاصرة ورداء فرعوني ملكي، يشرح المفاهيم بحكمة وتفاعل حي.',
    category: 'egyptian',
    primaryColor: '#eab308',
    accentColor: '#06b6d4'
  },
  {
    id: 'alexandria_sage',
    name: 'سيرين',
    title: 'باحثة مكتبة الإسكندرية',
    description: 'عالمة وباحثة تجمع بين علوم البردية والتقنيات الرقمية الحديثة.',
    category: 'academic',
    primaryColor: '#10b981',
    accentColor: '#8b5cf6'
  }
];

export const getAvatarPreset = (id: string): AvatarPreset => {
  return AVATAR_PRESETS.find(a => a.id === id) || AVATAR_PRESETS[0];
};

