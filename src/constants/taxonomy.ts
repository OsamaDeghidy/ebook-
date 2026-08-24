export interface CategoryItem {
  id: string;
  label: string;
  description: string;
  iconName: string;
  isAcademic?: boolean;
}

// 1️⃣ 10 Main Categories from Image 3 (أقسام المكتبة والمقررات)
export const MAIN_CATEGORIES: CategoryItem[] = [
  {
    id: 'academic_curriculum',
    label: 'مناهج ومقررات دراسية',
    description: 'المناهج المدرسية، الدبلومات الدولية، والمقررات الجامعية',
    iconName: 'GraduationCap',
    isAcademic: true
  },
  {
    id: 'quiz_bank',
    label: 'بنوك أسئلة وامتحانات',
    description: 'نماذج امتحانات تفاعلية وبنوك أسئلة شاملة مع التصحيح الفوري',
    iconName: 'HelpCircle'
  },
  {
    id: 'training_packages',
    label: 'حقائب تدريبية تفاعلية',
    description: 'حقائب مهنية وكورسات تطبيقية وورش عمل متخصصة',
    iconName: 'Layers'
  },
  {
    id: 'programming_ai',
    label: 'البرمجة والذكاء الاصطناعي',
    description: 'هندسة البرمجيات، الذكاء الاصطناعي، وتحليل البيانات',
    iconName: 'Terminal'
  },
  {
    id: 'self_help',
    label: 'تطوير الذات والمهارات الحياتية',
    description: 'القيادة، الإنتاجية، الذكاء العاطفي، وعادات النجاح',
    iconName: 'Sparkles'
  },
  {
    id: 'languages_translation',
    label: 'اللغات والترجمة',
    description: 'إتقان اللغات الأجنبية، القواعد، المحادثات والترجمة',
    iconName: 'Globe'
  },
  {
    id: 'literature_novels',
    label: 'الأدب والروايات والفكر الإنساني',
    description: 'أمهات الكتب، الروايات العالمية، والفكر الفلسفي والإنساني',
    iconName: 'BookOpen'
  },
  {
    id: 'medicine_health',
    label: 'الطب والعلوم الصحية والصيدلية',
    description: 'المراجع الطبية، الصيدلة، التمريض، والعلوم الصحية',
    iconName: 'Activity'
  },
  {
    id: 'law_political_science',
    label: 'القانون والعلوم السياسية والإدارية',
    description: 'التشريعات، القوانين، الإدارة العامة، والعلوم السياسية',
    iconName: 'Scale'
  },
  {
    id: 'business_marketing',
    label: 'إدارة الأعمال والتسويق والقيادة',
    description: 'ريادة الأعمال، التسويق، التمويل، وإدارة الشركات',
    iconName: 'TrendingUp'
  }
];

// 2️⃣ Education Levels (المرحلة الدراسية: قبل جامعي vs جامعي)
export const EDUCATION_LEVELS = [
  { id: 'pre_university', label: 'قبل جامعي (تعليم مدرسي ودولي)' },
  { id: 'university', label: 'جامعي (تعليم عالي وكليات)' }
];

// 3️⃣ Academic Systems (نوع ومسار التعليم في قبل الجامعي)
export const ACADEMIC_SYSTEMS = [
  { id: 'general_arabic', label: 'تعليم عام (عربي)' },
  { id: 'general_languages', label: 'تعليم عام (لغات / تجريبي / رسمي)' },
  { id: 'international_american', label: 'دولي - الشهادة الأمريكية (American Diploma)' },
  { id: 'international_british', label: 'دولي - الشهادة البريطانية (IGCSE / British)' },
  { id: 'international_french', label: 'دولي - الشهادة الفرنسية (French)' },
  { id: 'technical', label: 'تعليم فني (صناعي / تجاري / زراعي / فندقي)' }
];

// 4️⃣ Grade Levels Mapping (الصفوف والمراحل حسب نوع التعليم)
export const GENERAL_GRADES = [
  // رياض الأطفال
  'أولى حضانة (KG1)',
  'ثانية حضانة (KG2)',
  // الابتدائي
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  // الإعدادي
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  // الثانوي
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي'
];

export const INTERNATIONAL_GRADES = [
  'Grade 1 (Year 1)',
  'Grade 2 (Year 2)',
  'Grade 3 (Year 3)',
  'Grade 4 (Year 4)',
  'Grade 5 (Year 5)',
  'Grade 6 (Year 6)',
  'Grade 7 (Year 7)',
  'Grade 8 (Year 8)',
  'Grade 9 (Year 9)',
  'Grade 10 (Year 10)',
  'Grade 11 (Year 11)',
  'Grade 12 (Year 12)'
];

export const TECHNICAL_GRADES = [
  'الصف الأول الفني',
  'الصف الثاني الفني',
  'الصف الثالث الفني',
  'الصف الرابع الفني (نظام 5 سنوات)',
  'الصف الخامس الفني (نظام 5 سنوات)'
];

export const UNIVERSITY_GRADES = [
  'الفرقة الأولى (السنة الأولى)',
  'الفرقة الثانية',
  'الفرقة الثالثة',
  'الفرقة الرابعة (سنة التخرج)',
  'الفرقة الخامسة / دراسات عليا وماجستير'
];

export const UNIVERSITY_FACULTIES = [
  'الحاسبات والمعلومات والذكاء الاصطناعي',
  'الطب البشري والعلوم الطبية',
  'الهندسة والعلوم التطبيقية',
  'الصيدلة والتكنولوجيا الحيوية',
  'إدارة الأعمال والتجارة والاقتصاد',
  'الحقوق والقانون',
  'الآداب والعلوم الإنسانية واللغات',
  'التربية والعلوم الأساسية'
];

export const ACADEMIC_SUBJECTS = [
  'الرياضيات والإحصاء',
  'العلوم والفيزياء والكيمياء',
  'اللغة العربية واللغويات',
  'اللغة الإنجليزية (English)',
  'اللغات الأجنبية الثانية (فرنسي / ألماني / إيطالي)',
  'الدراسات الاجتماعية والجغرافيا والتاريخ',
  'الأحياء والجيولوجيا',
  'الفلسفة وعلم النفس والمنطق',
  'التربية الوطنية والدينية',
  'تكنولوجيا المعلومات والحاسب الآلي',
  'Mathematics & Statistics (Math)',
  'Physics & Chemistry',
  'Biology & Science',
  'Computer Science & ICT',
  'Business Studies & Economics'
];

export const GENERAL_SUBJECTS = [
  'البرمجة وتطوير البرمجيات',
  'الذكاء الاصطناعي والبيانات',
  'ريادة الأعمال والمشاريع الناشئة',
  'التسويق الرقمي والمبيعات',
  'الإدارة والقيادة المؤسسية',
  'التنمية الذاتية وإدارة الوقت',
  'المالية والاستثمار الشخصي',
  'التصميم وتجربة المستخدم (UI/UX)',
  'الصحة والطب الوقائي',
  'الترجمة واللغويات التطبيقية',
  'الفكر الفلسفي والنقد الأدبي',
  'التشريع والاستشارات القانونية'
];

export const SEMESTERS = [
  'الفصل الدراسي الأول (ترم أول)',
  'الفصل الدراسي الثاني (ترم ثاني)',
  'مقرر سنوي مستمر (كامل السنة)',
  'مقرر صيفي (Summer Course)'
];

export const ACADEMIC_YEARS = [
  'إصدار عام 2026 - 2027',
  'إصدار عام 2025 - 2026',
  'إصدار عام 2024 - 2025',
  'طبعة عامة محدثة'
];

// Helper to get grade list based on level & system
export function getGradesForSystem(educationLevel: string, academicSystem?: string): string[] {
  if (educationLevel === 'university') {
    return UNIVERSITY_GRADES;
  }
  if (academicSystem === 'technical') {
    return TECHNICAL_GRADES;
  }
  if (academicSystem?.startsWith('international_')) {
    return INTERNATIONAL_GRADES;
  }
  return GENERAL_GRADES;
}
