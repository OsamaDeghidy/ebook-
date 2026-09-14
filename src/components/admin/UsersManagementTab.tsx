import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, Filter, Shield, ShieldAlert, ShieldCheck, UserCheck, UserX, 
  Wallet, BookOpen, GraduationCap, DollarSign, Award, Clock, ArrowUpDown, 
  Download, RefreshCw, CheckCircle2, XCircle, AlertCircle, Eye, Edit, Trash2, 
  Plus, Minus, ArrowUpRight, ArrowDownLeft, ChevronDown, Check, Smartphone, 
  Mail, Calendar, Lock, Unlock, Layers, Sparkles, FileText, ExternalLink
} from 'lucide-react';
import { MarketplaceBook } from '../../types';

export interface DetailedUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'student' | 'instructor' | 'admin';
  wallet_balance: number;
  is_blocked: boolean;
  created_at: string;
  last_active: string;
  purchasedBooks: Array<{
    bookId: string;
    title: string;
    amount: number;
    date: string;
    paymentMethod: string;
  }>;
  authoredBooks: Array<{
    id: string;
    title: string;
    price: number;
    category?: string;
    is_published: boolean;
    is_blocked: boolean;
    salesCount: number;
    revenue: number;
    created_at: string;
  }>;
  quizAttempts: Array<{
    id: string;
    bookId: string;
    score: number;
    totalQuestions: number;
    passed: boolean;
    date: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    description: string;
    date: string;
  }>;
  vouchersRedeemed: number;
  vouchersGenerated: number;
  aiUsage: {
    usedCount: number;
    history: any[];
  };
  totalSpent: number;
  totalTeacherEarnings: number;
}

interface UsersManagementTabProps {
  books: MarketplaceBook[];
  onLaunchBook?: (id: string) => void;
  onRefreshData?: () => void;
}

export const UsersManagementTab: React.FC<UsersManagementTabProps> = ({
  books,
  onLaunchBook,
  onRefreshData
}) => {
  const [users, setUsers] = useState<DetailedUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'instructor' | 'student' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [selectedUser, setSelectedUser] = useState<DetailedUser | null>(null);
  const [userModalTab, setUserModalTab] = useState<'overview' | 'content' | 'wallet' | 'quizzes' | 'ai'>('overview');

  // Quick Wallet Adjust State
  const [walletModalUser, setWalletModalUser] = useState<DetailedUser | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState<string>('تعديل رصيد إداري');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState<boolean>(false);

  // Status message banner
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Fetch detailed users list from API
  const loadDetailedUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users-detailed');
      if (res.ok) {
        const data = await res.json();
        if (data?.users) {
          setUsers(data.users);
          // Update selected user in view if modal is open
          if (selectedUser) {
            const updated = data.users.find((u: DetailedUser) => u.id === selectedUser.id);
            if (updated) setSelectedUser(updated);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load detailed users:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetailedUsers();
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Role filter
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === 'active' && user.is_blocked) return false;
      if (statusFilter === 'blocked' && !user.is_blocked) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = user.full_name?.toLowerCase().includes(query);
        const matchesEmail = user.email?.toLowerCase().includes(query);
        const matchesPhone = user.phone?.includes(query);
        const matchesId = user.id?.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesPhone || matchesId;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  // Statistics calculation
  const totalInstructors = useMemo(() => users.filter(u => u.role === 'instructor').length, [users]);
  const totalStudents = useMemo(() => users.filter(u => u.role === 'student').length, [users]);
  const totalBlocked = useMemo(() => users.filter(u => u.is_blocked).length, [users]);
  const totalBalancesInSystem = useMemo(() => users.reduce((sum, u) => sum + (u.wallet_balance || 0), 0), [users]);

  // Toggle User Block/Unblock
  const handleToggleBlockUser = async (user: DetailedUser) => {
    const actionText = user.is_blocked ? 'إلغاء حظر' : 'حظر';
    if (!confirm(`هل أنت متأكد من ${actionText} حساب (${user.full_name || user.email})؟`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/toggle-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !user.is_blocked })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
        await loadDetailedUsers();
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        alert(data.message || 'فشلت العملية');
      }
    } catch (e) {
      alert('حدث خطأ أثناء تغيير حالة الحساب');
    }
  };

  // Change User Role
  const handleChangeRole = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/change-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
        await loadDetailedUsers();
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        alert(data.message || 'فشل تغيير الرتبة');
      }
    } catch (e) {
      alert('حدث خطأ أثناء تغيير الرتبة');
    }
  };

  // Toggle Block Book Content
  const handleToggleBlockBook = async (bookId: string, currentBlocked: boolean, bookTitle: string) => {
    const actionText = currentBlocked ? 'إلغاء حظر وإتاحة' : 'حظر وإيقاف نشر';
    if (!confirm(`هل أنت متأكد من ${actionText} المقرر (${bookTitle})؟`)) return;

    try {
      const res = await fetch(`/api/admin/books/${bookId}/toggle-block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: !currentBlocked })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
        await loadDetailedUsers();
        if (onRefreshData) onRefreshData();
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        alert(data.message || 'فشلت العملية');
      }
    } catch (e) {
      alert('حدث خطأ أثناء حظر/فك حظر المقرر');
    }
  };

  // Submit Wallet Adjust
  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalUser) return;

    setIsSubmittingAdjust(true);
    try {
      const res = await fetch('/api/admin/wallet/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: walletModalUser.id,
          amount: adjustAmount,
          type: adjustType,
          reason: adjustReason
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
        setWalletModalUser(null);
        await loadDetailedUsers();
        setTimeout(() => setStatusMsg(null), 5000);
      } else {
        alert(data.message || 'فشل تعديل الرصيد');
      }
    } catch (e) {
      alert('حدث خطأ أثناء تعديل الرصيد');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['المعرف', 'الاسم', 'البريد الإلكتروني', 'الرتبة', 'الرصيد (ج.م)', 'الحالة', 'تاريخ الانضمام'];
    const rows = filteredUsers.map(u => [
      u.id,
      `"${u.full_name || ''}"`,
      u.email,
      u.role === 'instructor' ? 'معلم' : u.role === 'student' ? 'طالب' : 'مسؤول',
      u.wallet_balance || 0,
      u.is_blocked ? 'محظور' : 'نشط',
      new Date(u.created_at).toLocaleDateString('ar-EG')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* STATUS BANNER */}
      {statusMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">إجمالي الحسابات المسجلة</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{users.length}</div>
          <div className="text-[10px] text-gray-400">كافة الطلاب والمعلمين والمشرفين</div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">المعلمون والسناتر 👨‍🏫</span>
            <GraduationCap className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">{totalInstructors}</div>
          <div className="text-[10px] text-teal-600 font-bold">صانعو المقررات والكروت</div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">الطلاب والمتعلمون 🎓</span>
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700">{totalStudents}</div>
          <div className="text-[10px] text-sky-600 font-bold">المشتركون في المقررات</div>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">إجمالي أموال المحافظ 💰</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{totalBalancesInSystem.toLocaleString()} ج.م</div>
          <div className="text-[10px] text-emerald-600 font-bold">أرصدة حية داخل المنصة</div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* SEARCH INPUT */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، البريد الإلكتروني، رقم الهاتف، أو المعرف..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>

        {/* ROLE TABS */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              roleFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌟 الكل ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('instructor')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              roleFilter === 'instructor' ? 'bg-white text-teal-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👨‍🏫 المعلمون ({totalInstructors})
          </button>
          <button
            onClick={() => setRoleFilter('student')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              roleFilter === 'student' ? 'bg-white text-sky-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎓 الطلاب ({totalStudents})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              roleFilter === 'admin' ? 'bg-white text-amber-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛡️ المشرفون ({users.filter(u => u.role === 'admin').length})
          </button>
        </div>

        {/* STATUS FILTER & ACTIONS */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">كل الحالات</option>
            <option value="active">النشطون فقط ✓</option>
            <option value="blocked">المحظورون فقط 🚫 ({totalBlocked})</option>
          </select>

          <button
            onClick={loadDetailedUsers}
            disabled={isLoading}
            title="تحديث البيانات"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            title="تصدير لملف CSV"
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs font-bold text-slate-500">جاري تجميع وفحص بيانات وأنشطة الحسابات...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <UserX className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">لا يوجد مستخدمون مطابقون لمعايير البحث</h4>
            <p className="text-xs text-slate-400">جرب تغيير كلمات البحث أو الفلاتر المحددة أعلاه.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-200 text-[11px] font-black text-slate-600">
                  <th className="py-3.5 px-4">المستخدم والبريد</th>
                  <th className="py-3.5 px-4">الرتبة</th>
                  <th className="py-3.5 px-4">رصيد المحفظة</th>
                  <th className="py-3.5 px-4">ملخص الأنشطة والمحتوى</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    
                    {/* USER INFO */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs ${
                          user.role === 'instructor' 
                            ? 'bg-gradient-to-tr from-teal-600 to-indigo-600' 
                            : user.role === 'admin' 
                              ? 'bg-gradient-to-tr from-amber-500 to-rose-600' 
                              : 'bg-gradient-to-tr from-sky-500 to-indigo-500'
                        }`}>
                          {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="space-y-0.5 max-w-[200px] truncate">
                          <div className="font-black text-slate-900 truncate">{user.full_name || 'مستخدم بدون اسم'}</div>
                          <div className="text-[10px] text-slate-500 truncate" dir="ltr">{user.email}</div>
                          {user.phone && <div className="text-[10px] text-slate-400">{user.phone}</div>}
                        </div>
                      </div>
                    </td>

                    {/* ROLE BADGE */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        user.role === 'instructor'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : user.role === 'admin'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                      }`}>
                        {user.role === 'instructor' ? '👨‍🏫 معلم / سنتر' : user.role === 'admin' ? '🛡️ مشرف عام' : '🎓 طالب'}
                      </span>
                    </td>

                    {/* WALLET BALANCE */}
                    <td className="py-3 px-4">
                      <div className="font-black text-emerald-700 text-sm">
                        {user.wallet_balance || 0} <span className="text-[10px] text-slate-500">ج.م</span>
                      </div>
                      <button
                        onClick={() => {
                          setWalletModalUser(user);
                          setAdjustAmount(50);
                          setAdjustType('credit');
                          setAdjustReason('تعديل رصيد إداري');
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline mt-0.5 cursor-pointer"
                      >
                        تعديل الرصيد ✍️
                      </button>
                    </td>

                    {/* ACTIVITY SUMMARY */}
                    <td className="py-3 px-4">
                      {user.role === 'instructor' ? (
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-slate-800 font-bold">
                            📚 رفع <strong className="text-indigo-600">{user.authoredBooks.length}</strong> مقرر ({user.authoredBooks.filter(b => b.is_blocked).length > 0 ? <span className="text-rose-600">{user.authoredBooks.filter(b => b.is_blocked).length} محظور</span> : 'الكل متاح'})
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            🛒 حقق <strong className="text-emerald-600">{user.authoredBooks.reduce((sum, b) => sum + b.salesCount, 0)}</strong> مبيعة | أرباح: {user.totalTeacherEarnings} ج.م
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-slate-800 font-bold">
                            📚 اشترى <strong className="text-sky-600">{user.purchasedBooks.length}</strong> مقرر | أنفق: {user.totalSpent} ج.م
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            📝 أجرى <strong className="text-indigo-600">{user.quizAttempts.length}</strong> اختبار تفاعلي
                          </div>
                        </div>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                        user.is_blocked
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {user.is_blocked ? (
                          <>
                            <UserX className="w-3 h-3 text-rose-600" />
                            <span>محظور 🚫</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>نشط ✓</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* VIEW FULL DETAILS */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setUserModalTab('overview');
                          }}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-black flex items-center gap-1 transition cursor-pointer"
                          title="عرض ملف الأنشطة الكامل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>الملف والأنشطة</span>
                        </button>

                        {/* TOGGLE BLOCK BUTTON */}
                        <button
                          onClick={() => handleToggleBlockUser(user)}
                          className={`p-1.5 rounded-xl text-[11px] font-black transition cursor-pointer ${
                            user.is_blocked
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                          }`}
                          title={user.is_blocked ? 'إلغاء حظر الحساب' : 'حظر الحساب'}
                        >
                          {user.is_blocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🌟 USER FULL DETAIL MODAL (DRAWER) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto" dir="rtl">
          <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative my-auto custom-scrollbar space-y-6">
            
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition"
            >
              <XCircle className="w-6 h-6" />
            </button>

            {/* MODAL USER HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0)?.toUpperCase()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900">{selectedUser.full_name || 'مستخدم بدون اسم'}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      selectedUser.role === 'instructor' ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-sky-50 text-sky-800 border-sky-200'
                    }`}>
                      {selectedUser.role === 'instructor' ? '👨‍🏫 معلم' : '🎓 طالب'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      selectedUser.is_blocked ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {selectedUser.is_blocked ? 'محظور 🚫' : 'نشط ✓'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono" dir="ltr">{selectedUser.email}</div>
                </div>
              </div>

              {/* QUICK CONTROL BUTTONS */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setWalletModalUser(selectedUser);
                    setAdjustAmount(50);
                    setAdjustType('credit');
                    setAdjustReason('تعديل رصيد إداري');
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>تعديل الرصيد ({selectedUser.wallet_balance} ج.م)</span>
                </button>

                <button
                  onClick={() => handleToggleBlockUser(selectedUser)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                    selectedUser.is_blocked
                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {selectedUser.is_blocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{selectedUser.is_blocked ? 'إلغاء حظر الحساب' : 'حظر الحساب'}</span>
                </button>
              </div>
            </div>

            {/* MODAL NAVIGATION TABS */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setUserModalTab('overview')}
                className={`px-3.5 py-2 rounded-xl transition ${
                  userModalTab === 'overview' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 نظرة عامة
              </button>
              <button
                onClick={() => setUserModalTab('content')}
                className={`px-3.5 py-2 rounded-xl transition ${
                  userModalTab === 'content' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {selectedUser.role === 'instructor' 
                  ? `📚 المقررات المرفوعة (${selectedUser.authoredBooks.length})` 
                  : `📚 المقررات المشتراة (${selectedUser.purchasedBooks.length})`}
              </button>
              <button
                onClick={() => setUserModalTab('wallet')}
                className={`px-3.5 py-2 rounded-xl transition ${
                  userModalTab === 'wallet' ? 'bg-white text-emerald-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💳 كشف حساب المحفظة ({selectedUser.transactions.length})
              </button>
              {selectedUser.role === 'student' && (
                <button
                  onClick={() => setUserModalTab('quizzes')}
                  className={`px-3.5 py-2 rounded-xl transition ${
                    userModalTab === 'quizzes' ? 'bg-white text-sky-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 نتائج الاختبارات ({selectedUser.quizAttempts.length})
                </button>
              )}
              {selectedUser.role === 'instructor' && (
                <button
                  onClick={() => setUserModalTab('ai')}
                  className={`px-3.5 py-2 rounded-xl transition ${
                    userModalTab === 'ai' ? 'bg-white text-purple-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🤖 استخدام الـ AI ({selectedUser.aiUsage?.usedCount || 0})
                </button>
              )}
            </div>

            {/* TAB CONTENT: 1. OVERVIEW */}
            {userModalTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold">تاريخ إنشاء الحساب</span>
                    <div className="text-xs font-black text-slate-800">
                      {new Date(selectedUser.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold">آخر نشاط مسجل</span>
                    <div className="text-xs font-black text-slate-800">
                      {new Date(selectedUser.last_active).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold">الرصيد المتاح الحالي</span>
                    <div className="text-base font-black text-emerald-700">{selectedUser.wallet_balance} ج.م</div>
                  </div>
                </div>

                {/* ROLE CHANGER */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-slate-800">تغيير رتبة وصلاحيات المستخدم:</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleChangeRole(selectedUser.id, 'student')}
                      disabled={selectedUser.role === 'student'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                        selectedUser.role === 'student' ? 'bg-sky-600 text-white' : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      🎓 تعيين كطالب
                    </button>
                    <button
                      onClick={() => handleChangeRole(selectedUser.id, 'instructor')}
                      disabled={selectedUser.role === 'instructor'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                        selectedUser.role === 'instructor' ? 'bg-teal-600 text-white' : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      👨‍🏫 ترقية لمعلم / سنتر
                    </button>
                    <button
                      onClick={() => handleChangeRole(selectedUser.id, 'admin')}
                      disabled={selectedUser.role === 'admin'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                        selectedUser.role === 'admin' ? 'bg-amber-600 text-white' : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-100'
                      }`}
                    >
                      🛡️ تعيين كمسؤول نظام
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. CONTENT (BOOKS & COURSES) */}
            {userModalTab === 'content' && (
              <div className="space-y-3">
                {selectedUser.role === 'instructor' ? (
                  selectedUser.authoredBooks.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-gray-100 text-xs text-slate-400">
                      لم يقم هذا المعلم برفع أي مذكرات حتى الآن.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedUser.authoredBooks.map((b) => (
                        <div key={b.id} className="p-3.5 bg-slate-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-xs text-slate-900">{b.title}</h4>
                              {b.is_blocked ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full border border-rose-300">
                                  محظور إدارياً 🚫
                                </span>
                              ) : b.is_published ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-300">
                                  منشور متاح ✓
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-black rounded-full">
                                  مسودة / غير منشور
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-bold flex items-center gap-3">
                              <span>السعر: {b.price} ج.م</span>
                              <span>•</span>
                              <span>المبيعات: {b.salesCount} طالب</span>
                              <span>•</span>
                              <span>العائد: {b.revenue} ج.م</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {onLaunchBook && (
                              <button
                                onClick={() => onLaunchBook(b.id)}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>معاينة</span>
                              </button>
                            )}

                            {/* BLOCK / UNBLOCK BOOK BUTTON */}
                            <button
                              onClick={() => handleToggleBlockBook(b.id, b.is_blocked, b.title)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                                b.is_blocked
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                              }`}
                            >
                              {b.is_blocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              <span>{b.is_blocked ? 'فك حظر المقرر ✓' : 'حظر المقرر 🚫'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  selectedUser.purchasedBooks.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-gray-100 text-xs text-slate-400">
                      لم يقم هذا الطالب بشراء أي مقررات حتى الآن.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedUser.purchasedBooks.map((pb, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-black text-xs text-slate-900">{pb.title}</h4>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              المبلغ: {pb.amount} ج.م • طريقة الدفع: {pb.paymentMethod} • التاريخ: {new Date(pb.date).toLocaleDateString('ar-EG')}
                            </div>
                          </div>
                          {onLaunchBook && (
                            <button
                              onClick={() => onLaunchBook(pb.bookId)}
                              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>فتح المقرر</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* TAB CONTENT: 3. WALLET & TRANSACTIONS */}
            {userModalTab === 'wallet' && (
              <div className="space-y-3">
                {selectedUser.transactions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-gray-100 text-xs text-slate-400">
                    لا توجد حركات مالية مسجلة لهذا الحساب.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.transactions.map((tx) => (
                      <div key={tx.id} className="p-3 bg-slate-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800">{tx.description || tx.type}</div>
                          <div className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleString('ar-EG')}</div>
                        </div>
                        <div className="text-left font-black">
                          <div className={tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} ج.م
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal">الرصيد بعدها: {tx.balance_after} ج.م</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 4. QUIZZES */}
            {userModalTab === 'quizzes' && (
              <div className="space-y-3">
                {selectedUser.quizAttempts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-gray-100 text-xs text-slate-400">
                    لم يقم الطالب بإجراء أي اختبارات تفاعلية.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.quizAttempts.map((q) => (
                      <div key={q.id} className="p-3 bg-slate-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">اختبار تفاعلي لمقرر #{q.bookId}</div>
                          <div className="text-[10px] text-slate-400">{new Date(q.date).toLocaleString('ar-EG')}</div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                          q.passed ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          الدرجة: {q.score}% ({q.passed ? 'ناجح ✓' : 'راسب ✕'})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 5. AI USAGE */}
            {userModalTab === 'ai' && (
              <div className="space-y-3">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-purple-900">إجمالي المذكرات المولدة بالذكاء الاصطناعي:</span>
                    <p className="text-[10px] text-purple-700">أول 5 مذكرات مجانية، وما بعدها يتم خصمها من المحفظة.</p>
                  </div>
                  <div className="text-xl font-black text-purple-800">{selectedUser.aiUsage?.usedCount || 0} مذكرة</div>
                </div>

                {selectedUser.aiUsage?.history?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-black text-slate-700">سجل عمليات التوليد:</h5>
                    {selectedUser.aiUsage.history.map((h: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{h.title || 'مذكرة دراسية'}</div>
                          <div className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleString('ar-EG')}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          h.isFree ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-sky-100 text-sky-800 border-sky-300'
                        }`}>
                          {h.isFree ? 'مجاناً 🎁' : `${h.cost} ج.م`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* 💰 QUICK WALLET ADJUST MODAL */}
      {walletModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4" dir="rtl">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>تعديل رصيد المحفظة يدوياً</span>
              </h3>
              <button onClick={() => setWalletModalUser(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="text-slate-500 font-bold">الحساب المستهدف:</div>
              <div className="font-black text-slate-900">{walletModalUser.full_name} ({walletModalUser.email})</div>
              <div className="text-emerald-700 font-bold">الرصيد الحالي: {walletModalUser.wallet_balance} ج.م</div>
            </div>

            <form onSubmit={handleWalletAdjustSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    adjustType === 'credit'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إيداع / زيادة (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    adjustType === 'debit'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>خصم / إنقاص (-)</span>
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">المبلغ (ج.م):</label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-black text-slate-900 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">سبب أو بيان العملية (يظهر للمستخدم في كشف الحساب):</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="مثال: مكافأة تفوق، تسوية مالية، شحن نقدي..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingAdjust || adjustAmount <= 0}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAdjust ? 'جاري تطبيق العملية...' : `تأكيد ${adjustType === 'credit' ? 'الإيداع' : 'الخصم'} فورياً`}
                </button>
                <button
                  type="button"
                  onClick={() => setWalletModalUser(null)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
