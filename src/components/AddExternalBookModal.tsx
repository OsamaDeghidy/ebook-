import React, { useState } from 'react';
import { X, Link2, BookOpen, DollarSign, Image as ImageIcon, Tag, User } from 'lucide-react';
import { BookCategory } from '../types';

interface AddExternalBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (bookData: {
    title: string;
    description: string;
    authorName: string;
    category: BookCategory;
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('د. كريم كامل');
  const [category, setCategory] = useState<BookCategory>('digital_book');
  const [tagsInput, setTagsInput] = useState('كتاب_تفاعلي, كيمياء_عضوية');
  const [price, setPrice] = useState<number>(0);
  const [externalUrl, setExternalUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onAddBook({
      title,
      description,
      authorName,
      category,
      tags,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <Link2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900">إضافة رابط كتاب / مرجع خارجي</h2>
          <p className="text-xs text-gray-500">
            أضف كتباً رقمية، امتحانات جاهزة، أو روابط مباشرة لتظهر في المتجر الأكاديمي
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">عنوان الكتاب أو الحزمة</label>
            <div className="relative">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="أطلس تشريح الإنسان ووظائف الأعضاء التفاعلي"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-indigo-500 pr-10"
              />
              <BookOpen className="w-4 h-4 text-slate-500 absolute top-3.5 right-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">الرابط الخارجي (Direct URL / Drive Link)</label>
            <div className="relative">
              <input
                type="url"
                required
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com/human_anatomy_interactive.zip"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-indigo-500 pr-10"
              />
              <Link2 className="w-4 h-4 text-slate-500 absolute top-3.5 right-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">اسم المحاضر / المؤلف</label>
              <div className="relative">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500 pr-9"
                />
                <User className="w-3.5 h-3.5 text-slate-500 absolute top-3 right-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">السعر ($0 للمجاني)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500 pr-9"
                />
                <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute top-3 right-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">القسم الأكاديمي</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BookCategory)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="digital_book">كتب رقمية ومقررات</option>
                <option value="training_kit">حقائب تدريبية تفاعلية</option>
                <option value="quiz_bank">امتحانات وبنوك أسئلة</option>
                <option value="academic_paper">أوراق ودراسات أكاديمية</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">صورة الغلاف (Image URL)</label>
              <div className="relative">
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500 pr-9"
                />
                <ImageIcon className="w-3.5 h-3.5 text-slate-500 absolute top-3 right-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">الوسوم والتخصصات (مفصولة بفواصل)</label>
            <div className="relative">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="كيمياء_عضوية, امتحان_تفاعلي, فارماكولوجي"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500 pr-9"
              />
              <Tag className="w-3.5 h-3.5 text-slate-500 absolute top-3 right-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">وصف ملخص للحزمة أو الكتاب</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر لمحتوى المقرر أو بنك الأسئلة والحلول المتاحة..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition active:scale-98 mt-2"
          >
            نشر الرابط في المتجر الأكاديمي
          </button>
        </form>
      </div>
    </div>
  );
};

