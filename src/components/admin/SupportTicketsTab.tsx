import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, Search, Filter, CheckCircle2, Clock, AlertCircle, 
  Phone, Mail, User, ShieldAlert, Sparkles, ExternalLink, RefreshCw, 
  Send, Check, X, ChevronDown, FileText, Bug, CreditCard, Lightbulb, 
  AlertTriangle, HelpCircle, Download, ArrowUpRight, MessageCircle
} from 'lucide-react';

export interface SupportTicket {
  id: string;
  full_name: string;
  email: string;
  phone_whatsapp: string;
  category: 'technical' | 'payment_wallet' | 'feature_request' | 'content_report' | 'general';
  priority: 'normal' | 'medium' | 'urgent';
  subject: string;
  message: string;
  attachment_url?: string;
  user_id?: string;
  role?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  admin_notes?: string;
  admin_reply?: string;
  resolved_at?: string;
}

export const SupportTicketsTab: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Selected ticket for details modal
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminNotesText, setAdminNotesText] = useState('');
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/support/tickets');
      if (res.ok) {
        const data = await res.json();
        if (data?.tickets) setTickets(data.tickets);
      }
    } catch (err) {
      console.warn('Could not fetch support tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (selectedStatus !== 'all' && ticket.status !== selectedStatus) return false;
      if (selectedCategory !== 'all' && ticket.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = ticket.id.toLowerCase().includes(q);
        const matchName = ticket.full_name?.toLowerCase().includes(q);
        const matchEmail = ticket.email?.toLowerCase().includes(q);
        const matchPhone = ticket.phone_whatsapp?.toLowerCase().includes(q);
        const matchSubject = ticket.subject?.toLowerCase().includes(q);
        const matchMsg = ticket.message?.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchEmail && !matchPhone && !matchSubject && !matchMsg) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, selectedStatus, selectedCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter(t => t.status === 'pending').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const urgent = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;
    return { total, pending, inProgress, resolved, urgent };
  }, [tickets]);

  // Handle Status Update
  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.ticket) {
          setTickets(prev => prev.map(t => t.id === ticketId ? data.ticket : t));
          if (activeTicket?.id === ticketId) setActiveTicket(data.ticket);
          showToast(`تم تغيير حالة التذكرة إلى (${newStatus})`);
        }
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
  };

  // Handle Admin Reply / Notes Save
  const handleSaveReplyAndNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    setIsSavingReply(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${activeTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_reply: adminReplyText.trim(),
          change_status_to: activeTicket.status === 'pending' ? 'in_progress' : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.ticket) {
          setTickets(prev => prev.map(t => t.id === activeTicket.id ? data.ticket : t));
          setActiveTicket(data.ticket);
          showToast('تم حفظ رد الإدارة بنجاح!');
        }
      }
    } catch (err) {
      console.error('Save reply error:', err);
    } finally {
      setIsSavingReply(false);
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const getCategoryMeta = (cat: string) => {
    switch (cat) {
      case 'technical':
        return { label: 'مشكلة فنية', icon: Bug, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'payment_wallet':
        return { label: 'دفع ومحفظة', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'feature_request':
        return { label: 'اقتراح وتطوير', icon: Lightbulb, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'content_report':
        return { label: 'بلاغ محتوى', icon: AlertTriangle, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      default:
        return { label: 'استفسار عام', icon: HelpCircle, color: 'text-sky-600 bg-sky-50 border-sky-200' };
    }
  };

  const getPriorityMeta = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { label: 'عاجلة 🔴', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'medium':
        return { label: 'متوسطة 🟡', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: 'عادية 🟢', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  };

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'in_progress':
        return { label: 'جاري المتابعة ⏳', color: 'bg-amber-500 text-white' };
      case 'resolved':
        return { label: 'تم الحل بنجاح ✓', color: 'bg-emerald-600 text-white' };
      case 'closed':
        return { label: 'مغلقة 🔒', color: 'bg-slate-500 text-white' };
      default:
        return { label: 'قيد المراجعة 📩', color: 'bg-indigo-600 text-white' };
    }
  };

  const cleanPhoneNumberForWhatsapp = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01') && clean.length === 11) {
      clean = '2' + clean; // Egypt prefix
    }
    return clean;
  };

  return (
    <div className="space-y-6 text-right animate-fade-in" dir="rtl">
      
      {/* SUCCESS TOAST */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 📊 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>إجمالي الشكاوى</span>
            <MessageSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>قيد المراجعة</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600">{stats.pending}</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>جاري المتابعة والحل</span>
            <RefreshCw className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.inProgress}</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>تم الحل والإغلاق</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.resolved}</div>
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold">
            <span>تذاكر عاجلة 🔴</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{stats.urgent}</div>
        </div>
      </div>

      {/* 🔍 FILTERS & CONTROLS */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم التذكرة، الاسم، أو الواتساب..."
            className="w-full pr-9 pl-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Status & Category Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-none cursor-pointer shrink-0"
          >
            <option value="all">كل الحالات ({tickets.length})</option>
            <option value="pending">قيد المراجعة ({stats.pending})</option>
            <option value="in_progress">جاري الحل ({stats.inProgress})</option>
            <option value="resolved">تم الحل ({stats.resolved})</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-none cursor-pointer shrink-0"
          >
            <option value="all">جميع التصنيفات</option>
            <option value="technical">مشاكل فنية</option>
            <option value="payment_wallet">دفع ومحفظة</option>
            <option value="feature_request">اقتراحات وتطوير</option>
            <option value="content_report">بلاغات محتوى</option>
            <option value="general">استفسارات عامة</option>
          </select>

          <button
            onClick={fetchTickets}
            title="تحديث البيانات"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 📋 TICKETS LIST / TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-900">لا توجد شكاوى أو تذاكر دعم مطابقة</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              عند قيام أي طالب أو معلم برفع شكوى أو اقتراح ستظهر هنا فوراً.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">المرجع / التاريخ</th>
                  <th className="p-4">صاحب الشكوى</th>
                  <th className="p-4">التصنيف والأولوية</th>
                  <th className="p-4">الموضوع / التفاصيل</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">الإجراءات والتواصل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const catMeta = getCategoryMeta(ticket.category);
                  const CatIcon = catMeta.icon;
                  const priorityMeta = getPriorityMeta(ticket.priority);
                  const statusMeta = getStatusMeta(ticket.status);
                  const cleanPhone = cleanPhoneNumberForWhatsapp(ticket.phone_whatsapp);
                  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `مرحباً بك ${ticket.full_name}، نتواصل معك من فريق إدارة منصة أوسيرا AI بخصوص تذكرتك رقم (#${ticket.id}): ${ticket.subject}`
                  )}`;

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition">
                      {/* 1. ID & Date */}
                      <td className="p-4 space-y-1 whitespace-nowrap">
                        <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          #{ticket.id}
                        </span>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {new Date(ticket.created_at).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* 2. User Info */}
                      <td className="p-4 space-y-1">
                        <div className="font-black text-slate-900 flex items-center gap-1.5">
                          <span>{ticket.full_name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-slate-100 text-slate-600">
                            {ticket.role === 'instructor' ? 'معلم 👨‍🏫' : 'طالب 🎓'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono" dir="ltr">
                          {ticket.phone_whatsapp}
                        </div>
                        <div className="text-[10px] text-slate-400">{ticket.email}</div>
                      </td>

                      {/* 3. Category & Priority */}
                      <td className="p-4 space-y-1.5 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${catMeta.color}`}>
                          <CatIcon className="w-3 h-3" />
                          <span>{catMeta.label}</span>
                        </div>
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-[9px] font-black ${priorityMeta.color}`}>
                            {priorityMeta.label}
                          </span>
                        </div>
                      </td>

                      {/* 4. Subject & Message Preview */}
                      <td className="p-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{ticket.subject}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {ticket.message}
                        </div>
                        {ticket.admin_reply && (
                          <div className="mt-1.5 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-900 font-medium">
                            💬 رد الإدارة: {ticket.admin_reply}
                          </div>
                        )}
                      </td>

                      {/* 5. Status Badge */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* 6. Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* WhatsApp Chat Button */}
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-sm transition active:scale-95"
                            title="مراسلة على الواتساب مباشرة"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>واتساب</span>
                          </a>

                          {/* Details / Reply Button */}
                          <button
                            onClick={() => {
                              setActiveTicket(ticket);
                              setAdminReplyText(ticket.admin_reply || '');
                              setAdminNotesText(ticket.admin_notes || '');
                            }}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black transition cursor-pointer"
                          >
                            عرض والرد
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔍 TICKET DETAILS & REPLY DRAWER MODAL */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
            
            {/* HEADER */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight">تفاصيل التذكرة #{activeTicket.id}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${getStatusMeta(activeTicket.status).color}`}>
                    {getStatusMeta(activeTicket.status).label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  تاريخ الإنشاء: {new Date(activeTicket.created_at).toLocaleString('ar-EG')}
                </p>
              </div>

              <button
                onClick={() => setActiveTicket(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-5">
              {/* User Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">صاحب التذكرة:</span>
                  <span className="font-black text-slate-900">{activeTicket.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">رقم الواتساب:</span>
                  <span className="font-mono font-bold text-emerald-700">{activeTicket.phone_whatsapp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">البريد الإلكتروني:</span>
                  <span className="font-mono font-bold text-slate-700">{activeTicket.email}</span>
                </div>
              </div>

              {/* Subject & Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900">{activeTicket.subject}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getPriorityMeta(activeTicket.priority).color}`}>
                    أولوية: {getPriorityMeta(activeTicket.priority).label}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {activeTicket.message}
                </div>
                {activeTicket.attachment_url && (
                  <a
                    href={activeTicket.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>عرض المرفق / رابط لقطة الشاشة</span>
                  </a>
                )}
              </div>

              {/* Status Change Fast Buttons */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">تغيير حالة التذكرة سريعاً:</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket.id, 'pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer ${
                      activeTicket.status === 'pending'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    📩 قيد المراجعة
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket.id, 'in_progress')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer ${
                      activeTicket.status === 'in_progress'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    ⏳ جاري المتابعة
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(activeTicket.id, 'resolved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer ${
                      activeTicket.status === 'resolved'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    ✓ تم الحل والإنهاء
                  </button>
                </div>
              </div>

              {/* Admin Reply & Internal Notes Form */}
              <form onSubmit={handleSaveReplyAndNotes} className="space-y-3 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    رد الإدارة الرسمي (يظهر للمستخدم / يتم إرساله):
                  </label>
                  <textarea
                    rows={3}
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder="اكتب رد الإدارة أو الحل المقدم للشكوى..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {/* WhatsApp Direct Link */}
                  <a
                    href={`https://wa.me/${cleanPhoneNumberForWhatsapp(activeTicket.phone_whatsapp)}?text=${encodeURIComponent(
                      `مرحباً بك ${activeTicket.full_name}، رداً على تذكرتك (#${activeTicket.id}): ${adminReplyText || 'نحن نتابع مشكلتك وسنقوم بحلها فوراً.'}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>إرسال الرد عبر واتساب مباشرة 📱</span>
                  </a>

                  <button
                    type="submit"
                    disabled={isSavingReply}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {isSavingReply ? 'جاري الحفظ...' : 'حفظ الرد بالنظام 💾'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
