import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, User, Shield, AlertCircle, Sparkles, GraduationCap, Check } from 'lucide-react';
import { UserRole } from '../types';
import { TermsOfUseModal } from './legal/TermsOfUseModal';

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
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  if (!isOpen) return null;

  // Quick Instant Login for testing and demos
  const handleQuickDemoLogin = async (role: UserRole, name: string, demoEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const demoUser = {
        id: `demo-${role}-${Date.now()}`,
        email: demoEmail,
        user_metadata: { full_name: name, role: role }
      };

      localStorage.setItem('simplest_auth_user', JSON.stringify(demoUser));
      localStorage.setItem('simplest_auth_role', role);

      // Upsert to Supabase if possible
      try {
        await supabase.from('profiles').upsert({
          id: demoUser.id,
          email: demoEmail,
          full_name: name,
          role: role
        });
      } catch (e) {}

      onSuccess(demoUser, role);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
              role: selectedRole
            }
          }
        });

        if (signUpError) {
          throw new Error(signUpError.message || 'فشل إنشاء الحساب، يرجى المحاولة مرة أخرى.');
        }

        if (data.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: email,
              full_name: fullName || email.split('@')[0],
              role: selectedRole
            });
          } catch (e) {
            console.warn('Profile upsert notice:', e);
          }

          localStorage.setItem('simplest_auth_role', selectedRole);
          localStorage.setItem('simplest_auth_user', JSON.stringify(data.user));
          onSuccess(data.user, selectedRole);
          onClose();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          throw new Error('بيانات تسجيل الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور أو إنشاء حساب جديد.');
        }

        if (data.user) {
          let userRole: UserRole = 'student';
          
          try {
            // Read strictly from Supabase profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', data.user.id)
              .maybeSingle();

            if (profile && profile.role) {
              userRole = profile.role as UserRole;
            } else {
              // Profile not in database yet: initialize it with user metadata or fallback
              const metaRole = (data.user.user_metadata?.role as UserRole) || selectedRole || 'student';
              userRole = metaRole;

              await supabase.from('profiles').upsert({
                id: data.user.id,
                email: email,
                full_name: data.user.user_metadata?.full_name || email.split('@')[0],
                role: userRole
              });
            }
          } catch (e) {
            console.warn('Profile sync notice:', e);
          }

          localStorage.setItem('simplest_auth_role', userRole);
          localStorage.setItem('simplest_auth_user', JSON.stringify(data.user));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-fade-in text-right" dir="rtl">
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto text-teal-600 font-black text-2xl shadow-sm">
            ⚡
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            {isSignUp ? 'إنشاء حساب جديد في simplest' : 'تسجيل الدخول إلى simplest'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            منظومة التعليم التفاعلي وإدارة المقررات الذكية
          </p>
        </div>

        {/* 🌟 ROLE SELECTION TABS */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-bold text-slate-700">حدد نوع الحساب والصلاحية:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                selectedRole === 'student'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs font-black'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-teal-600" />
              <span>🎓 طالب</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('instructor')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                selectedRole === 'instructor'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs font-black'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4 text-indigo-600" />
              <span>👨‍🏫 معلّم / محاضر</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                selectedRole === 'admin'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs font-black'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>🛡️ مسؤول نظام</span>
            </button>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* AUTH FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: د. كريم كامل / الطالب أحمد"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
            />
          </div>

          {isSignUp && (
            <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-600">
              <input
                type="checkbox"
                required
                id="terms_agree"
                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <label htmlFor="terms_agree" className="cursor-pointer leading-tight">
                أوافق على{' '}
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="text-sky-600 hover:text-sky-700 underline font-bold"
                >
                  شروط الاستخدام وسياسة الملكية الفكرية
                </button>{' '}
                وإخلاء المسؤولية القانونية للمنصة.
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'جاري التحقق...' : (isSignUp ? 'إنشاء الحساب وتفعيل الصلاحية' : 'تسجيل الدخول')}
          </button>
        </form>

        <TermsOfUseModal
          isOpen={isTermsOpen}
          onClose={() => setIsTermsOpen(false)}
        />


        {/* ⚡ QUICK DEMO ACCESS PROFILES FOR TESTING */}
        <div className="mt-6 pt-5 border-t border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-black text-slate-500">
            <span>⚡ الدخول التجريبي الفوري (1-Click Test):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickDemoLogin('admin', 'مدير عام أوسيرا AI', 'admin@osera.com')}
              className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-[11px] font-black transition text-center cursor-pointer"
            >
              🛡️ أدمن: admin@osera.com
            </button>
            <button
              onClick={() => handleQuickDemoLogin('instructor', 'المعلم المعتمد', 'm01066906132@gmail.com')}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl text-[11px] font-black transition text-center cursor-pointer"
            >
              👨‍🏫 معلم: m01066906132@...
            </button>
            <button
              onClick={() => handleQuickDemoLogin('student', 'طالب متميز', 'student@osera.com')}
              className="p-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-xl text-[11px] font-black transition text-center cursor-pointer"
            >
              🎓 حساب طالب تجريبي
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-bold text-teal-600 hover:underline"
          >
            {isSignUp ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ أنشئ حساباً جديداً'}
          </button>
        </div>
      </div>
    </div>
  );
};
