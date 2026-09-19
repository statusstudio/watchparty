import React, { useState, useEffect } from 'react';
import {
  Crown,
  X,
  Users,
  Radio,
  MessageSquare,
  Activity,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Search,
  Send,
  Clock,
  CheckCircle2,
  Lock,
  Globe,
  Bug,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  PlatformStats,
  PlatformUser,
  SupportTicket,
  TicketStatus,
  UserProfile,
} from '../types/index.js';

interface SuperAdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

export const SuperAdminDashboardModal: React.FC<SuperAdminDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'users' | 'tickets'>('overview');
  const [loading, setLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState<PlatformStats>({
    totalOnlineUsers: 0,
    totalRooms: 0,
    totalUsers: 0,
    openTickets: 0,
    serverUptimeSeconds: 0,
  });

  // Data lists
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Filters & Search
  const [roomSearch, setRoomSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | TicketStatus>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Ticket Reply
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchRooms(), fetchUsers(), fetchTickets()]);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/platform/stats');
      const data = await res.json();
      if (data) setStats(data);
    } catch (e) {}
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/platform/rooms');
      const data = await res.json();
      if (Array.isArray(data)) setRooms(data);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/platform/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (e) {}
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTickets(data);
        if (selectedTicket) {
          const updated = data.find((t) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (e) {}
  };

  if (!isOpen) return null;

  // Actions
  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการสั่งปิด/ลบห้อง "${roomName}"?`)) return;

    try {
      const res = await fetch(`/api/platform/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'ห้องถูกปิดโดยเจ้าของเว็บ (Super Admin)' }),
      });
      if (res.ok) {
        onShowToast(`ลบห้อง "${roomName}" สำเร็จ!`, 'success');
        fetchRooms();
        fetchStats();
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการลบห้อง', 'warning');
    }
  };

  const handleToggleSuspendUser = async (userId: string, currentStatus: boolean, userName: string) => {
    const actionText = currentStatus ? 'ปลดระงับ' : 'ระงับการใช้งาน';
    if (!window.confirm(`คุณต้องการ ${actionText} บัญชีของคุณ "${userName}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/platform/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: !currentStatus }),
      });
      if (res.ok) {
        onShowToast(`${actionText} "${userName}" สำเร็จ`, 'success');
        fetchUsers();
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการดำเนินการ', 'warning');
    }
  };

  const handleToggleSuperAdmin = async (userId: string, currentRole: boolean, userName: string) => {
    const actionText = currentRole ? 'ปลดสิทธิ์ Super Admin' : 'แต่งตั้งเป็น Super Admin';
    if (!window.confirm(`คุณต้องการ ${actionText} ของคุณ "${userName}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/platform/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuperAdmin: !currentRole }),
      });
      if (res.ok) {
        onShowToast(`${actionText} ให้ "${userName}" สำเร็จ`, 'success');
        fetchUsers();
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการดำเนินการ', 'warning');
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          isSuperAdmin: true,
          text: adminReplyText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setAdminReplyText('');
        setSelectedTicket(data.ticket);
        fetchTickets();
        fetchStats();
      }
    } catch (err) {
      onShowToast('ส่งข้อความตอบกลับไม่สำเร็จ', 'warning');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) {
        setSelectedTicket(data.ticket);
        fetchTickets();
        fetchStats();
        onShowToast('อัพเดทสถานะคำร้องเรียบร้อย', 'info');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการอัพเดทสถานะ', 'warning');
    }
  };

  const formatUptime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${hours}ชม. ${minutes}นาที ${seconds}วิ`;
  };

  // Filtered lists
  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(roomSearch.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(roomSearch.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredTickets = tickets.filter((t) => {
    if (ticketStatusFilter === 'all') return true;
    return t.status === ticketStatusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#12141c] border border-amber-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0 bg-[#0f1016]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  แดชบอร์ดเจ้าของเว็บ (Platform Owner)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                ระบบบริหารจัดการแพลตฟอร์ม ควบคุมห้อง สมาชิก และตอบรับคำร้องแจ้งปัญหา
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-amber-400 hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-gray-800 bg-[#161823] shrink-0">
          <div className="p-3 bg-[#0f1016] border border-gray-800 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">สมาชิกในระบบ</p>
              <p className="text-base font-bold text-white">{stats.totalUsers} คน</p>
            </div>
          </div>

          <div className="p-3 bg-[#0f1016] border border-gray-800 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">ออนไลน์ทั้งเว็บ</p>
              <p className="text-base font-bold text-emerald-400">{stats.totalOnlineUsers} คน</p>
            </div>
          </div>

          <div className="p-3 bg-[#0f1016] border border-gray-800 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">ห้องปาร์ตี้เปิดอยู่</p>
              <p className="text-base font-bold text-white">{stats.totalRooms} ห้อง</p>
            </div>
          </div>

          <div className="p-3 bg-[#0f1016] border border-gray-800 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">คำร้องรอดำเนินการ</p>
              <p className="text-base font-bold text-amber-400">{stats.openTickets} เรื่อง</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 bg-[#0f1016] px-4 pt-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>ภาพรวม & ระบบ (Overview)</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rooms'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>จัดการห้องทั้งหมด ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>จัดการสมาชิก ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ศูนย์รับเรื่อง & แชทแจ้งปัญหา ({tickets.length})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#161823] border border-gray-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>สถานะเซิร์ฟเวอร์ระบบ (Platform Server Status)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    เซิร์ฟเวอร์เปิดทำงานต่อเนื่องมาแล้ว: <span className="text-amber-300 font-semibold">{formatUptime(stats.serverUptimeSeconds)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-medium">
                    ระบบทำงานปกติ 100%
                  </span>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setActiveTab('rooms')}
                  className="p-4 bg-[#161823] border border-gray-800 hover:border-amber-500/40 rounded-xl cursor-pointer transition-all space-y-1 group"
                >
                  <Radio className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300">ควบคุมห้องปาร์ตี้</h4>
                  <p className="text-[11px] text-gray-400">ดูห้องทั้งหมด สั่งปิดห้องที่ไม่เหมาะสม หรือตรวจสอบรหัสผ่าน</p>
                </div>

                <div
                  onClick={() => setActiveTab('users')}
                  className="p-4 bg-[#161823] border border-gray-800 hover:border-amber-500/40 rounded-xl cursor-pointer transition-all space-y-1 group"
                >
                  <Users className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300">จัดการผู้ใช้งาน</h4>
                  <p className="text-[11px] text-gray-400">ระงับบัญชีคนก่อกวนทั่วทั้งเว็บ หรือแต่งตั้งผู้ช่วย Super Admin</p>
                </div>

                <div
                  onClick={() => setActiveTab('tickets')}
                  className="p-4 bg-[#161823] border border-gray-800 hover:border-amber-500/40 rounded-xl cursor-pointer transition-all space-y-1 group"
                >
                  <MessageSquare className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-300">ตอบกลับคำร้อง ({stats.openTickets})</h4>
                  <p className="text-[11px] text-gray-400">แชทโต้ตอบกับสมาชิกที่แจ้งปัญหา หรือรับฟังข้อเสนอแนะฟีเจอร์ใหม่</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROOMS CONTROL */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    placeholder="ค้นหาชื่อห้อง, ไอดี, หรือเจ้าของห้อง..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#161823] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  พบห้องทั้งหมด <span className="text-white font-bold">{filteredRooms.length}</span> ห้อง
                </p>
              </div>

              <div className="overflow-x-auto border border-gray-800 rounded-xl">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#161823] text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">ห้อง</th>
                      <th className="p-3">สถานะ</th>
                      <th className="p-3">เจ้าของห้อง</th>
                      <th className="p-3">คนออนไลน์</th>
                      <th className="p-3">วิดีโอที่กำลังเล่น</th>
                      <th className="p-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-[#0f1016]">
                    {filteredRooms.map((room) => (
                      <tr key={room.id} className="hover:bg-[#161823]/50 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-white">{room.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{room.id}</p>
                        </td>
                        <td className="p-3">
                          {room.isPrivate ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-medium">
                              <Lock className="w-3 h-3" />
                              <span>ส่วนตัว (รหัส: {room.password || '-'})</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                              <Globe className="w-3 h-3" />
                              <span>สาธารณะ</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="text-gray-300 font-medium">{room.ownerName}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-semibold text-[11px]">
                            {room.onlineCount} คน
                          </span>
                        </td>
                        <td className="p-3 max-w-[200px]">
                          <p className="truncate text-[11px] text-gray-300">{room.currentVideo?.title || 'ไม่ได้เปิดเพลง'}</p>
                          <p className="text-[10px] text-gray-500 font-mono">{room.currentVideo?.videoId}</p>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.name)}
                            className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                            title="สั่งปิดและลบห้องนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="ค้นหาชื่อผู้ใช้, อีเมล, หรือ User ID..."
                    className="w-full pl-9 pr-3 py-1.5 bg-[#161823] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  พบสมาชิกทั้งหมด <span className="text-white font-bold">{filteredUsers.length}</span> คน
                </p>
              </div>

              <div className="overflow-x-auto border border-gray-800 rounded-xl">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#161823] text-gray-400 font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-3">สมาชิก</th>
                      <th className="p-3">อีเมล / ประเภท</th>
                      <th className="p-3">ยศในเว็บ</th>
                      <th className="p-3">สถานะบัญชี</th>
                      <th className="p-3">เข้าใช้งานล่าสุด</th>
                      <th className="p-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 bg-[#0f1016]">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#161823]/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=u'}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-white/10"
                            />
                            <div>
                              <p className="font-bold text-white flex items-center gap-1">
                                {user.name}
                                {user.isSuperAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                              </p>
                              <p className="text-[10px] text-gray-500 font-mono">{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-gray-300">{user.email || '-'}</p>
                          <span className="text-[10px] uppercase font-semibold text-purple-400">{user.provider}</span>
                        </td>
                        <td className="p-3">
                          {user.isSuperAdmin ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                              Super Admin
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[10px]">
                              สมาชิกทั่วไป
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {user.isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                              <ShieldAlert className="w-3 h-3" /> ระงับบัญชี (Suspended)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                              <ShieldCheck className="w-3 h-3" /> ปกติ (Active)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-400 text-[11px]">
                          {new Date(user.lastActiveAt).toLocaleString('th-TH')}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleToggleSuperAdmin(user.id, user.isSuperAdmin, user.name)}
                            disabled={user.id === 'usr-admin-system'}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-20 text-amber-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            {user.isSuperAdmin ? 'ปลด Admin' : 'แต่งตั้ง Admin'}
                          </button>

                          <button
                            onClick={() => handleToggleSuspendUser(user.id, user.isSuspended, user.name)}
                            disabled={user.id === 'usr-admin-system'}
                            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                              user.isSuspended
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                            }`}
                          >
                            {user.isSuspended ? 'ปลดระงับ' : 'ระงับบัญชี'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SUPPORT TICKETS & CHAT */}
          {activeTab === 'tickets' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[62vh] max-h-[520px]">
              {/* Left Column: Tickets List */}
              <div className="md:col-span-5 flex flex-col border border-gray-800 rounded-xl bg-[#0f1016] overflow-hidden">
                <div className="p-3 border-b border-gray-800 bg-[#161823] flex items-center justify-between gap-2 shrink-0">
                  <span className="text-xs font-bold text-white">รายการคำร้อง ({filteredTickets.length})</span>
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                    className="bg-[#0f1016] border border-gray-700 text-xs text-gray-300 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="pending">รอดำเนินการ</option>
                    <option value="in_progress">กำลังแก้ไข</option>
                    <option value="resolved">แก้ไขแล้ว</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60">
                  {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">ไม่พบคำร้อง</div>
                  ) : (
                    filteredTickets.map((t) => {
                      const isSelected = selectedTicket?.id === t.id;

                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicket(t)}
                          className={`p-3 transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-500/15 border-l-4 border-amber-500' : 'hover:bg-[#161823]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-gray-400">{t.userName}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              t.status === 'resolved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : t.status === 'in_progress'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {t.status === 'resolved' ? 'แก้ไขแล้ว' : t.status === 'in_progress' ? 'กำลังแก้' : 'รอดำเนินการ'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white truncate">{t.title}</p>
                          <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                            {t.messages[t.messages.length - 1]?.text}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Ticket Chat Detail */}
              <div className="md:col-span-7 flex flex-col border border-gray-800 rounded-xl bg-[#0f1016] overflow-hidden">
                {selectedTicket ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 border-b border-gray-800 bg-[#161823] flex items-center justify-between gap-3 shrink-0">
                      <div>
                        <h4 className="text-xs font-bold text-white">{selectedTicket.title}</h4>
                        <p className="text-[10px] text-gray-400">
                          จาก: <span className="text-purple-300 font-medium">{selectedTicket.userName}</span>{' '}
                          {selectedTicket.userEmail && `(${selectedTicket.userEmail})`}
                        </p>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400">สถานะ:</span>
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                          className="bg-[#0f1016] border border-gray-700 text-xs text-amber-300 rounded-lg px-2 py-1 focus:outline-none"
                        >
                          <option value="pending">รอดำเนินการ</option>
                          <option value="in_progress">กำลังแก้ไข</option>
                          <option value="resolved">แก้ไขแล้ว</option>
                        </select>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {selectedTicket.messages.map((m) => {
                        const isAdminMsg = m.isSuperAdmin;

                        return (
                          <div
                            key={m.id}
                            className={`flex gap-2.5 ${isAdminMsg ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <img
                              src={m.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                              alt={m.senderName}
                              className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
                            />
                            <div className={`max-w-[80%] space-y-1 ${isAdminMsg ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-1.5 px-1">
                                <span className={`text-[11px] font-semibold ${isAdminMsg ? 'text-amber-400' : 'text-gray-300'}`}>
                                  {m.senderName}
                                </span>
                                {isAdminMsg && (
                                  <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                    คุณ (Super Admin)
                                  </span>
                                )}
                                <span className="text-[9px] text-gray-500">
                                  {new Date(m.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div
                                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                  isAdminMsg
                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-tr-sm shadow-md'
                                    : 'bg-[#161823] border border-gray-800 text-gray-200 rounded-tl-sm'
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{m.text}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Admin Reply Box */}
                    <form onSubmit={handleSendAdminReply} className="p-2 border-t border-gray-800 flex gap-2 shrink-0 bg-[#12141c]">
                      <input
                        type="text"
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder="พิมพ์ข้อความตอบกลับผู้ใช้ในฐานะเจ้าของเว็บ..."
                        className="flex-1 px-3.5 py-2 bg-[#0f1016] border border-gray-700 focus:border-amber-500 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !adminReplyText.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ตอบกลับ</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 space-y-2">
                    <MessageSquare className="w-8 h-8 text-gray-600" />
                    <p className="text-xs">เลือกคำร้องทางด้านซ้ายเพื่อดูข้อความและตอบกลับผู้ใช้</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
