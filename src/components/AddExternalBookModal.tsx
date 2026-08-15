import React, { useState } from 'react';
import { X, Link2, BookOpen, DollarSign, Image as ImageIcon, Tag, User, GraduationCap, BookMarked, Sparkles } from 'lucide-react';
import { BookCategory, BookTrack } from '../types';
import { BOOK_TRACKS, SUBCATEGORIES, GRADE_LEVELS, SEMESTERS, ACADEMIC_YEARS } from './EditBookModal';
import { ACADEMIC_SUBJECTS } from './ContentUploader';

interface AddExternalBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (bookData: {
    title: string;
    description: string;
    authorName: string;
    category: BookCategory;
    track?: BookTrack;
    subcategory?: string;
    grade_level?: string;
    semester?: string;
    academic_year?: string;
    tags: string[];
    price: number;
    externalUrl: string;
    thumbnailUrl: string;
  }) => void;
}

export const AddExternalBookModal: React.FC<AddExternalBookModalProps> = ({
  isOpen,
  onClose,
  onAddBook
}) => {
  const [isAcademicMode, setIsAcademicMode] = useState<boolean>(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('د. كريم كامل');
  const [category, setCategory] = useState<BookCategory>('digital_book');
  const [track, setTrack] = useState<BookTrack>('academic');
  const [subcategory, setSubcategory] = useState(ACADEMIC_SUBJECTS[0]);
  const [gradeLevel, setGradeLevel] = useState('الصف الأول الثانوي');
  const [semester, setSemester] = useState(SEMESTERS[1]);
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0]);
  const [generalTrack, setGeneralTrack] = useState<BookTrack>('self_help');
  const [generalSubcategory, setGeneralSubcategory] = useState(SUBCATEGORIES[0]);
  const [generalAudience, setGeneralAudience] = useState(GRADE_LEVELS[0]);
  const [tagsInput, setTagsInput] = useState('كتاب_رقمي, مرجع_تعليمي');
  const [price, setPrice] = useState<number>(0);
  const [externalUrl, setExternalUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => t.length > 0);

    const activeTrack = isAcademicMode ? 'academic' : generalTrack;
    const activeSubcategory = isAcademicMode ? subcategory : generalSubcategory;
    const activeGrade = isAcademicMode ? gradeLevel : generalAudience;
    const activeSemester = isAcademicMode ? semester : 'كتاب عام مستمر';

    const structuredTags = [
      ...cleanTags,
      `track:${activeTrack}`,
      `sub:${activeSubcategory}`,
      `grade:${activeGrade}`,
      `term:${activeSemester}`,
      `year:${academicYear}`
    ];

    onAddBook({
      title,
      description,
      authorName,
      category: isAcademicMode ? category : 'self_help',
      track: activeTrack,
      subcategory: activeSubcategory,
      grade_level: activeGrade,
      semester: activeSemester,
      academic_year: academicYear,
      tags: structuredTags,
      price,
      externalUrl,
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80'
    });

    // Reset
    setTitle('');
    setDescription('');
    setExternalUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <Link2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900">إضافة ونشر كتاب يدوي / مرجع خارجي</h2>
          <p className="text-xs text-gray-500">
            أضف كتباً رقمية، مقررات دراسية، أو مراجع إثرائية مباشرة في المكتبة الرقمية
          </p>
        </div>

        {/* PROMINENT TOGGLE: ACADEMIC VS GENERAL LIBRARY */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-1.5 mb-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAcademicMode(true);
                setTrack('academic');
              }}
              className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition font-black text-xs ${
                isAcademicMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>مقرر ومنهج دراسي (أكاديمي)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAcademicMode(false);
                setTrack(generalTrack);
              }}
              className={`p-2.5 rounded-xl flex items-center justify-center gap-2 transition font-black text-xs ${
                !isAcademicMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>كتاب عام ومكتبة رقمية (تطوير ذات / أعمال)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">عنوان الكتاب أو المقرر</label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: الرياضيات المتقدمة للصف الأول الثانوي"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">رابط الكتاب أو الملف المباشر (URL)</label>
            <div className="relative">
              <input
                type="url"
                required
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم المؤلف / المحاضر</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">السعر ($0 للمجاني)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* DYNAMIC TAXONOMY */}
          {isAcademicMode ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">المادة الدراسية</label>
                <select
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  {ACADEMIC_SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">الصف / المرحلة</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  {GRADE_LEVELS.filter(g => !g.includes('للقراء') && !g.includes('مبتدئ')).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">الترم</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">السنة</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">المجال / الموضوع</label>
                <select
                  value={generalSubcategory}
                  onChange={(e) => setGeneralSubcategory(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  {SUBCATEGORIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">المستوى والجمهور</label>
                <select
                  value={generalAudience}
                  onChange={(e) => setGeneralAudience(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded-xl text-gray-900 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="عام / للقراء والمهتمين ورواد الأعمال">عام / للقراء والمهتمين ورواد الأعمال</option>
                  <option value="مستوى مبتدئ / تأسيسي">مستوى مبتدئ / تأسيسي</option>
                  <option value="مستوى متوسط وتطبيقي">مستوى متوسط وتطبيقي</option>
                  <option value="مستوى متقدم وتخصصي">مستوى متقدم وتخصصي</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">الوسوم والكلمات الدلالية (مفصولة بفاصلة)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="مثال: رياضيات, تفاضل_وتكامل, ثانوية_عامة"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">وصف ملخص للكتاب</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب نبذة مختصرة عن محتوى الكتاب وما يقدمه للقارئ..."
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-xl shadow-md transition active:scale-98 mt-2"
          >
            نشر الكتاب في المكتبة الرقمية
          </button>
        </form>
      </div>
    </div>
  );
};
