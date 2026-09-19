import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bug,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import {
  UserProfile,
  SupportTicket,
  TicketCategory,
  TicketStatus,
} from '../types/index.js';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'my-tickets'>('create');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);

  // New ticket form state
  const [category, setCategory] = useState<TicketCategory>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState(currentUser.email || '');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMyTickets();
      setUserEmail(currentUser.email || '');
      setSubmitSuccess(false);
    }
  }, [isOpen, currentUser]);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/support/my-tickets?userId=${currentUser.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
        if (selectedTicket) {
          const updated = data.find((t) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/support/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          userEmail: userEmail.trim() || undefined,
          category,
          title: title.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setTitle('');
        setDescription('');
        setSubmitSuccess(true);
        fetchMyTickets();
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveTab('my-tickets');
          setSelectedTicket(data.ticket);
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to submit ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          isSuperAdmin: false,
          text: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setReplyText('');
        setSelectedTicket(data.ticket);
        fetchMyTickets();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const getCategoryBadge = (cat: TicketCategory) => {
    switch (cat) {
      case 'bug':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-medium">
            <Bug className="w-3 h-3" /> แจ้งปัญหา / บั๊ก
          </span>
        );
      case 'report_room':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-medium">
            <AlertTriangle className="w-3 h-3" /> รายงานห้อง
          </span>
        );
      case 'feature':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-medium">
            <Lightbulb className="w-3 h-3" /> แนะนำฟีเจอร์
          </span>
        );
      case 'general':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-medium">
            <HelpCircle className="w-3 h-3" /> สอบถามทั่วไป
          </span>
        );
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium">
            <Clock className="w-3 h-3" /> รอดำเนินการ
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-medium">
            <Sparkles className="w-3 h-3 animate-spin" /> กำลังตรวจสอบ
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-medium">
            <CheckCircle2 className="w-3 h-3" /> แก้ไขแล้ว
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#151722] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0 bg-[#12141c]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                ติดต่อเจ้าของเว็บ & แจ้งปัญหา
              </h2>
              <p className="text-[11px] text-gray-400">
                ส่งข้อความ ข้อเสนอแนะ หรือแจ้งปัญหาการใช้งานกับทีมพัฒนาโดยตรง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-gray-800 bg-[#0f1016] px-4 pt-2 shrink-0">
          <button
            onClick={() => {
              setActiveTab('create');
              setSelectedTicket(null);
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>ส่งเรื่องใหม่ (Submit Issue)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('my-tickets');
              fetchMyTickets();
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my-tickets'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ประวัติการติดต่อของฉัน ({tickets.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateTicket} className="space-y-4 max-w-xl mx-auto">
              {submitSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>ส่งเรื่องเรียบร้อยแล้ว! กำลังนำคุณไปยังหน้าประวัติการติดต่อ...</span>
                </div>
              )}

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  หมวดหมู่เรื่องที่ต้องการแจ้ง *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('bug')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                      category === 'bug'
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-300'
                        : 'bg-[#181a24] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Bug className="w-4 h-4 text-rose-400" />
                    <span className="font-semibold">แจ้งบั๊ก</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('feature')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                      category === 'feature'
                        ? 'bg-purple-500/10 border-purple-500/50 text-purple-300'
                        : 'bg-[#181a24] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold">เสนอฟีเจอร์</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('report_room')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                      category === 'report_room'
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                        : 'bg-[#181a24] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold">รายงานห้อง</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCategory('general')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                      category === 'general'
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-300'
                        : 'bg-[#181a24] border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold">สอบถามทั่วไป</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  หัวข้อเรื่อง *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น เสียงวิดีโอซิงค์ช้า, เสนอให้มีโหมดแชทส่วนตัว..."
                  className="w-full px-3.5 py-2.5 bg-[#0f1016] border border-gray-700 focus:border-purple-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  รายละเอียดปัญหาหรือคำแนะนำ *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="อธิบายเหตุการณ์หรือข้อเสนอแนะอย่างละเอียด เพื่อให้เจ้าของเว็บช่วยตรวจสอบได้รวดเร็วขึ้น..."
                  className="w-full px-3.5 py-2.5 bg-[#0f1016] border border-gray-700 focus:border-purple-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors resize-none"
                  required
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  อีเมลสำหรับติดต่อกลับ (ถ้ามี)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-3.5 py-2 bg-[#0f1016] border border-gray-700 focus:border-purple-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !title.trim() || !description.trim()}
                className="w-full py-2.5 rounded-xl font-medium text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'กำลังส่งข้อมูล...' : 'ส่งเรื่องถึงเจ้าของเว็บ'}
              </button>
            </form>
          ) : selectedTicket ? (
            /* Ticket Chat View */
            <div className="flex flex-col h-[60vh] max-h-[480px]">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  ย้อนกลับรายการ
                </button>
                <div className="flex items-center gap-2">
                  {getCategoryBadge(selectedTicket.category)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>

              {/* Ticket Title Banner */}
              <div className="py-2 px-3 bg-[#0f1016] rounded-xl my-2 border border-gray-800">
                <p className="text-xs font-bold text-white">{selectedTicket.title}</p>
                <p className="text-[10px] text-gray-400">
                  ส่งเมื่อ {new Date(selectedTicket.createdAt).toLocaleString('th-TH')}
                </p>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 p-2">
                {selectedTicket.messages.map((m) => {
                  const isMe = m.senderId === currentUser.id;

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <img
                        src={m.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                        alt={m.senderName}
                        className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
                      />
                      <div className={`max-w-[78%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 px-1">
                          <span className={`text-[11px] font-semibold ${m.isSuperAdmin ? 'text-amber-400' : 'text-gray-300'}`}>
                            {m.senderName}
                          </span>
                          {m.isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                              เจ้าของเว็บ
                            </span>
                          )}
                          <span className="text-[9px] text-gray-500">
                            {new Date(m.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            m.isSuperAdmin
                              ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-100 rounded-tl-sm'
                              : isMe
                              ? 'bg-purple-600 text-white rounded-tr-sm shadow-md'
                              : 'bg-[#181a24] border border-gray-800 text-gray-200 rounded-tl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-2 border-t border-gray-800 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับหรือสอบถามเพิ่มเติม..."
                  className="flex-1 px-3.5 py-2 bg-[#0f1016] border border-gray-700 focus:border-purple-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่ง</span>
                </button>
              </form>
            </div>
          ) : (
            /* Tickets List View */
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-10 text-xs text-gray-400">กำลังโหลดคำร้อง...</div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12 bg-[#0f1016] rounded-xl border border-gray-800/80 p-6 space-y-2">
                  <MessageSquare className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-xs font-medium text-gray-300">ยังไม่มีประวัติการส่งเรื่อง</p>
                  <p className="text-[11px] text-gray-500">
                    คุณยังไม่เคยแจ้งปัญหาหรือส่งข้อเสนอแนะ
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    + ส่งเรื่องใหม่ตอนนี้
                  </button>
                </div>
              ) : (
                tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="p-3 bg-[#13151f] hover:bg-[#191c2b] border border-gray-800 hover:border-purple-500/40 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCategoryBadge(t.category)}
                        {getStatusBadge(t.status)}
                        <span className="text-[10px] text-gray-500">
                          {new Date(t.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                        {t.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 line-clamp-1">
                        {t.messages[t.messages.length - 1]?.text || t.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                        {t.messages.length} ข้อความ
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
