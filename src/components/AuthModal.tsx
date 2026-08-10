import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, User, Shield, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role
            }
          }
        });

        if (signUpError) throw signUpError;
        if (data.user) {
          // Insert profile into database
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: role
          });

          onSuccess(data.user, role);
          onClose();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        if (data.user) {
          // Fetch profile role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          const userRole = (profile?.role as UserRole) || 'student';
          onSuccess(data.user, userRole);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المصادقة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول للمنصة'}
          </h2>
          <p className="text-xs text-gray-500">
            {isSignUp ? 'انضم إلى منصة المقررات الأكاديمية والكتب التفاعلية' : 'ادخل بحسابك لتصفح وتشغيل كتبك التفاعلية'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">الاسم الكامل</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="د. كريم كامل"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-indigo-500 pr-10"
                />
                <User className="w-4 h-4 text-slate-500 absolute top-3.5 right-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-indigo-500 pr-10"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute top-3.5 right-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:border-indigo-500 pr-10"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 right-3" />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">نوع الحساب</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    role === 'student'
                      ? 'bg-indigo-600 border-indigo-500 text-gray-900'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>طالب / باحث</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    role === 'admin'
                      ? 'bg-amber-600 border-amber-500 text-gray-900'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>مسؤول / محاضر</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-gray-900 font-bold text-sm rounded-xl shadow-lg transition active:scale-98 disabled:opacity-50 mt-2"
          >
            {loading ? 'جاري التحقق...' : isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500 pt-4 border-t border-gray-200/80">
          {isSignUp ? 'لديك حساب بالفعل؟ ' : 'ليس لديك حساب؟ '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-400 font-bold hover:underline"
          >
            {isSignUp ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </button>
        </div>
      </div>
    </div>
  );
};

