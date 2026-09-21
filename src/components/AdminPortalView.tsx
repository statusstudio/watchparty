import React, { useState, useEffect } from 'react';
import {
  Crown,
  Lock,
  KeyRound,
  Mail,
  Shield,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sliders,
  Image as ImageIcon,
  Users,
  Radio,
  Megaphone,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Save,
  UserCheck,
} from 'lucide-react';
import { UserProfile, PlatformConfig, DEFAULT_PLATFORM_CONFIG, PlatformStats, PlatformAnalytics, PlatformUser, SupportTicket } from '../types/index.js';
import { AdPopupModal } from './AdPopupModal.js';
import { compressChatImage } from '../services/imageCompressor.js';

interface AdminPortalViewProps {
  onNavigateHome: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  onNavigateHome,
  onShowToast,
}) => {
  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('watchparty_superadmin') === 'true';
  });
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin888');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Account Credentials State
  const [adminCredentials, setAdminCredentials] = useState<{ username: string; email: string; updatedAt?: number }>({
    username: 'admin',
    email: 'admin@pleng.online',
  });
  const [editEmail, setEditEmail] = useState('');
  const [editCurrentPass, setEditCurrentPass] = useState('');
  const [editNewPass, setEditNewPass] = useState('');
  const [editConfirmPass, setEditConfirmPass] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Backoffice State & Tabs
  const [activeTab, setActiveTab] = useState<
    'account' | 'overview' | 'widgets' | 'ad_popup' | 'users' | 'rooms' | 'announcements' | 'tickets'
  >('account');
  const [loading, setLoading] = useState(false);

  // Data
  const [stats, setStats] = useState<PlatformStats>({
    totalOnlineUsers: 0,
    totalRooms: 0,
    totalUsers: 0,
    openTickets: 0,
    serverUptimeSeconds: 0,
  });
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [config, setConfig] = useState<PlatformConfig>({ ...DEFAULT_PLATFORM_CONFIG });
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Ad popup form state
  const [adEnabled, setAdEnabled] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adOpenInNewTab, setAdOpenInNewTab] = useState(true);
  const [isUploadingAd, setIsUploadingAd] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Announcements form state
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'alert'>('info');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);

  // Fetch admin credentials on mount
  const fetchAdminCredentials = async () => {
    try {
      const res = await fetch('/api/admin/credentials');
      if (res.ok) {
        const data = await res.json();
        setAdminCredentials(data);
        setEditEmail(data.email || 'admin@pleng.online');
      }
    } catch (e) {}
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAdminCredentials(),
        fetchStats(),
        fetchAnalytics(),
        fetchConfig(),
        fetchUsers(),
        fetchRooms(),
        fetchTickets(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAllData();
    }
  }, [isAdminAuthenticated]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/platform/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {}
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/platform/analytics');
      if (res.ok) setAnalytics(await res.json());
    } catch (e) {}
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/platform/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data.adPopup) {
          setAdEnabled(!!data.adPopup.enabled);
          setAdTitle(data.adPopup.title || '');
          setAdImageUrl(data.adPopup.imageUrl || '');
          setAdLinkUrl(data.adPopup.linkUrl || '');
          setAdOpenInNewTab(data.adPopup.openInNewTab !== false);
        }
        if (data.announcementBanner) {
          setAnnouncementEnabled(!!data.announcementBanner.enabled);
          setAnnouncementText(data.announcementBanner.text || '');
          setAnnouncementType(data.announcementBanner.type || 'info');
        }
      }
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/platform/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/platform/rooms');
      if (res.ok) setRooms(await res.json());
    } catch (e) {}
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) setTickets(await res.json());
    } catch (e) {}
  };

  // Login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('watchparty_superadmin', 'true');
        setIsAdminAuthenticated(true);
        onShowToast('เข้าสู่ระบบผู้ดูแลระบบสำเร็จ 👑', 'success');
      } else {
        setLoginError(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setLoginError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleAdminLogout = () => {
    localStorage.removeItem('watchparty_superadmin');
    setIsAdminAuthenticated(false);
    onShowToast('ออกจากระบบผู้ดูแลระบบแล้ว', 'info');
  };

  // Update Account credentials handler
  const handleUpdateAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCurrentPass.trim()) {
      onShowToast('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนแปลง', 'warning');
      return;
    }

    if (editNewPass) {
      if (editNewPass.length < 6) {
        onShowToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'warning');
        return;
      }
      if (editNewPass !== editConfirmPass) {
        onShowToast('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน', 'warning');
        return;
      }
    }

    setSavingAccount(true);
    try {
      const res = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: editCurrentPass.trim(),
          newEmail: editEmail.trim(),
          newPassword: editNewPass.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAdminCredentials({
          username: data.credentials?.username || adminCredentials.username,
          email: data.credentials?.email || editEmail.trim(),
        });
        setEditCurrentPass('');
        setEditNewPass('');
        setEditConfirmPass('');
        onShowToast('บันทึกข้อมูลบัญชีแอดมินเรียบร้อยแล้ว 🔐', 'success');
      } else {
        onShowToast(data.error || 'ไม่สามารถบันทึกข้อมูลได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'warning');
    } finally {
      setSavingAccount(false);
    }
  };

  // Global config save
  const handleSaveConfig = async (patch: Partial<PlatformConfig>) => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/platform/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        onShowToast('อัพเดทการตั้งค่าระบบเรียบร้อย ⚙️', 'success');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการบันทึก', 'warning');
    } finally {
      setSavingConfig(false);
    }
  };

  // Ad Popup Save
  const handleSaveAdPopup = async () => {
    if (adEnabled && !adImageUrl.trim()) {
      onShowToast('กรุณาอัปโหลดรูปภาพโฆษณาก่อนเปิดใช้งาน', 'warning');
      return;
    }
    await handleSaveConfig({
      adPopup: {
        enabled: adEnabled,
        title: adTitle.trim(),
        imageUrl: adImageUrl.trim(),
        linkUrl: adLinkUrl.trim(),
        openInNewTab: adOpenInNewTab,
        updatedAt: Date.now(),
      },
    });
  };

  // Ad Image Upload
  const handleAdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAd(true);
    try {
      const dataUri = await compressChatImage(file, 1000, 0.85);
      setAdImageUrl(dataUri);
      onShowToast('อัปโหลดรูปภาพโฆษณาเรียบร้อย 🖼️', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ', 'warning');
    } finally {
      setIsUploadingAd(false);
    }
  };

  // Announcement Save
  const handleSaveAnnouncement = async () => {
    await handleSaveConfig({
      announcementBanner: {
        enabled: announcementEnabled,
        text: announcementText.trim(),
        type: announcementType,
      },
    });
  };

  // Suspend User
  const handleSuspendUser = async (userId: string, isSuspended: boolean, userName: string) => {
    const actionText = isSuspended ? 'ปลดการระงับ' : 'ระงับการใช้งาน';
    if (!window.confirm(`คุณต้องการ "${actionText}" บัญชีของ "${userName}" หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/platform/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: !isSuspended }),
      });
      if (res.ok) {
        onShowToast(`${actionText} สำเร็จ`, 'success');
        fetchUsers();
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการระงับผู้ใช้', 'warning');
    }
  };

  // IF NOT LOGGED IN: Render Admin Login Gate
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#f6f5f4] flex flex-col items-center justify-center p-4 text-[#31302e]">
        <div className="w-full max-w-md bg-white border border-[#e6e6e6] rounded-2xl shadow-notion-modal overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[#e6e6e6] text-center relative bg-gradient-to-b from-amber-500/5 to-transparent">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shadow-xs mb-3">
              <Crown className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-[#000000] tracking-tight">
              pleng.online Admin Portal 👑
            </h1>
            <p className="text-xs text-[#615d59] mt-1">
              เข้าสู่ระบบเฉพาะเจ้าของเว็บไซต์และผู้ดูแลระบบสูงสุด
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono">
              <span>เริ่มต้น: user: <strong>admin</strong> | pass: <strong>admin888</strong></span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#000000]">
                ชื่อผู้ใช้หรืออีเมลแอดมิน (Username / Email)
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="เช่น admin หรือ admin@pleng.online"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 transition-all font-medium shadow-xs"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#000000]">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านแอดมิน..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 transition-all font-mono shadow-xs"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Crown className="w-4 h-4" />
              <span>{isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบหลังบ้าน (Sign In as Admin)'}</span>
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="px-6 py-3.5 bg-[#f6f5f4] border-t border-[#e6e6e6] text-center">
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs text-[#615d59] hover:text-[#000000] inline-flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าหลัก pleng.online</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN ADMIN PORTAL DASHBOARD
  return (
    <div className="min-h-screen w-full bg-[#f6f5f4] flex flex-col text-[#31302e]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#e6e6e6] sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shadow-xs">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#000000] tracking-tight">
                pleng.online Admin Portal
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/20">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-[#615d59]">
              ผู้ดูแลระบบ: <strong>{adminCredentials.username}</strong> ({adminCredentials.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={loadAllData}
            disabled={loading}
            title="รีเฟรชข้อมูล"
            className="p-2 rounded-xl bg-white hover:bg-[#f6f5f4] text-[#615d59] border border-[#e6e6e6] transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0075de]' : ''}`} />
          </button>

          <button
            onClick={onNavigateHome}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เปิดหน้าเว็บหลัก</span>
          </button>

          <button
            onClick={handleAdminLogout}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-[#e6e6e6] rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-[#615d59] font-medium uppercase">คนเข้าเว็บสด</p>
              <p className="text-xl font-bold text-emerald-600">
                {analytics ? analytics.onlineVisitors : stats.totalOnlineUsers} คน
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#e6e6e6] rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#0075de]/10 text-[#0075de] flex items-center justify-center shrink-0 border border-[#0075de]/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-[#615d59] font-medium uppercase">สมาชิกในระบบ</p>
              <p className="text-xl font-bold text-[#000000]">
                {users.length} คน
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#e6e6e6] rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-[#615d59] font-medium uppercase">ห้องที่กำลังเปิด</p>
              <p className="text-xl font-bold text-[#000000]">
                {rooms.length} ห้อง
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#e6e6e6] rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-[#615d59] font-medium uppercase">ผู้ดูแลระบบสูงสุด</p>
              <p className="text-sm font-bold text-amber-600 truncate">
                {adminCredentials.username} 👑
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#e6e6e6] bg-white rounded-2xl p-1.5 shadow-xs overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('account')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-amber-500/10 text-amber-700 font-bold'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>🔐 บัญชีแอดมิน & รหัสผ่าน</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#0075de]/10 text-[#0075de] font-bold'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>สถิติ & สุขภาพระบบ</span>
          </button>

          <button
            onClick={() => setActiveTab('widgets')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'widgets'
                ? 'bg-[#0075de]/10 text-[#0075de] font-bold'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ควบคุมโมดูล & Widget</span>
          </button>

          <button
            onClick={() => setActiveTab('ad_popup')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ad_popup'
                ? 'bg-[#0075de]/10 text-[#0075de] font-bold'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>ป๊อปอัพโฆษณา (Ad Popup)</span>
            {config.adPopup?.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-[#0075de]/10 text-[#0075de] font-bold'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>จัดการสมาชิก ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'rooms'
                ? 'bg-[#0075de]/10 text-[#0075de] font-bold'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>จัดการห้อง ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-[#0075de]/10 text-[#0075de] font-bold'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>ประกาศข่าวด่วน</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'bg-[#0075de]/10 text-[#0075de] font-bold'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Support ({tickets.length})</span>
          </button>
        </div>

        {/* TAB 1: ADMIN ACCOUNT MANAGEMENT */}
        {activeTab === 'account' && (
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#e6e6e6] pb-4">
              <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>จัดการบัญชีผู้ดูแลระบบหลัก (Admin Account Management)</span>
              </h2>
              <p className="text-xs text-[#615d59] mt-1">
                คุณสามารถเปลี่ยน Email หลักสำหรับการดูแลระบบ และเปลี่ยนรหัสผ่านแอดมินได้ตลอดเวลา
              </p>
            </div>

            {/* Current Account Details Card */}
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-[#615d59] uppercase font-semibold">ชื่อบัญชีผู้ดูแลระบบ (Username)</span>
                <p className="text-sm font-bold text-[#000000] mt-0.5">{adminCredentials.username}</p>
              </div>
              <div>
                <span className="text-[11px] text-[#615d59] uppercase font-semibold">อีเมลหลักปัจจุบัน (Current Primary Email)</span>
                <p className="text-sm font-bold text-amber-700 mt-0.5">{adminCredentials.email}</p>
              </div>
            </div>

            {/* Edit Account Form */}
            <form onSubmit={handleUpdateAdminAccount} className="space-y-4 max-w-xl">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">
                  อีเมลหลักใหม่ (New Primary Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="เช่น admin@pleng.online หรือ your-email@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#e6e6e6]">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#000000]">
                    รหัสผ่านใหม่ (New Password) <span className="text-gray-400 font-normal">(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={editNewPass}
                      onChange={(e) => setEditNewPass(e.target.value)}
                      placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#000000]">
                    ยืนยันรหัสผ่านใหม่ (Confirm New Password)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={editConfirmPass}
                      onChange={(e) => setEditConfirmPass(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-[#e6e6e6]">
                <label className="block text-xs font-semibold text-[#000000] flex items-center justify-between">
                  <span>รหัสผ่านปัจจุบัน (Current Password) *</span>
                  <span className="text-[11px] text-amber-600 font-normal">จำเป็นต้องระบุเพื่อความปลอดภัย</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={editCurrentPass}
                    onChange={(e) => setEditCurrentPass(e.target.value)}
                    placeholder="กรอกรหัสผ่านปัจจุบันของคุณ (เริ่มต้นคือ admin888)"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingAccount || !editCurrentPass.trim()}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingAccount ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลงบัญชีแอดมิน'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#e6e6e6] pb-4">
              <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#0075de]" />
                <span>สุขภาพระบบ & สถิติการใช้งาน Real-time</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <span className="text-[11px] text-[#615d59] uppercase font-semibold">Memory Usage</span>
                <p className="text-xl font-bold text-[#000000] mt-1">
                  {analytics?.memoryUsageMb || 0} MB
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <span className="text-[11px] text-[#615d59] uppercase font-semibold">Server Uptime</span>
                <p className="text-xl font-bold text-[#000000] mt-1">
                  {Math.floor(stats.serverUptimeSeconds / 3600)} ชม. {Math.floor((stats.serverUptimeSeconds % 3600) / 60)} นาที
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <span className="text-[11px] text-[#615d59] uppercase font-semibold">ตั๋วรอการดูแล</span>
                <p className="text-xl font-bold text-amber-600 mt-1">
                  {stats.openTickets} รายการ
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WIDGETS TOGGLE */}
        {activeTab === 'widgets' && (
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#e6e6e6] pb-4">
              <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#0075de]" />
                <span>ควบคุมการเปิด/ปิด โมดูลระดับส่วนกลาง (Global Feature Flags)</span>
              </h2>
              <p className="text-xs text-[#615d59] mt-1">
                การเปิดหรือปิดที่นี่จะมีผลกับทุกห้องทั่วทั้งเว็บไซต์ทันที
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              {/* Voice Stage Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <div>
                  <h3 className="text-xs font-bold text-[#000000]">โมดูลเวทีไมค์สด 9 ที่นั่ง (Voice Stage)</h3>
                  <p className="text-[11px] text-[#615d59]">อนุญาตให้ผู้ใช้เปิดไมค์และขึ้นเวทีสนทนา</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.globalWidgets.enableVoiceStage !== false}
                  onChange={(e) =>
                    handleSaveConfig({
                      globalWidgets: { ...config.globalWidgets, enableVoiceStage: e.target.checked },
                    })
                  }
                  className="w-5 h-5 rounded accent-[#0075de] cursor-pointer"
                />
              </div>

              {/* Live Chat Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <div>
                  <h3 className="text-xs font-bold text-[#000000]">โมดูลแชทสด (Live Chat)</h3>
                  <p className="text-[11px] text-[#615d59]">อนุญาตให้ผู้ใช้พิมพ์ข้อความและส่งสติกเกอร์ในห้อง</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.globalWidgets.enableChat !== false}
                  onChange={(e) =>
                    handleSaveConfig({
                      globalWidgets: { ...config.globalWidgets, enableChat: e.target.checked },
                    })
                  }
                  className="w-5 h-5 rounded accent-[#0075de] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AD POPUP */}
        {activeTab === 'ad_popup' && (
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#e6e6e6] pb-4">
              <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0075de]" />
                <span>ระบบป๊อปอัพโฆษณาหน้าแรก (Banner Ad Popup)</span>
              </h2>
              <p className="text-xs text-[#615d59] mt-1">
                ป๊อปอัพแสดงเมื่อผู้ใช้เข้าเว็บ สามารถอัปโหลดรูปภาพและใส่ลิงก์เปิดแท็บใหม่ได้
              </p>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <div>
                  <h3 className="text-xs font-bold text-[#000000]">เปิดใช้งาน Ad Popup</h3>
                  <p className="text-[11px] text-[#615d59]">แสดงป๊อปอัพโฆษณานี้แก่ผู้เข้าชมทุกคน</p>
                </div>
                <input
                  type="checkbox"
                  checked={adEnabled}
                  onChange={(e) => setAdEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#0075de] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">หัวข้อโฆษณา</label>
                <input
                  type="text"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="เช่น โปรโมชั่นพิเศษ หรือ ติดตามเรา"
                  className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">รูปภาพโฆษณา</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAdImageUpload}
                    disabled={isUploadingAd}
                    className="text-xs file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#0075de]/10 file:text-[#0075de] file:font-semibold file:cursor-pointer cursor-pointer"
                  />
                  {isUploadingAd && <span className="text-xs text-[#615d59]">กำลังประมวลผลรูป...</span>}
                </div>
                {adImageUrl && (
                  <div className="mt-2 w-48 aspect-video rounded-xl overflow-hidden border border-[#e6e6e6]">
                    <img src={adImageUrl} alt="Ad Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">URL ปลายทางเมื่อคลิก (Link URL)</label>
                <input
                  type="url"
                  value={adLinkUrl}
                  onChange={(e) => setAdLinkUrl(e.target.value)}
                  placeholder="เช่น https://example.com"
                  className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAdPopup}
                disabled={savingConfig}
                className="py-2.5 px-5 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                บันทึกการตั้งค่าป๊อปอัพ
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#e6e6e6] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0075de]" />
                  <span>จัดการสมาชิก ({users.length})</span>
                </h2>
                <p className="text-xs text-[#615d59] mt-1">
                  รายชื่อสมาชิกทั้งหมดที่ลงทะเบียนในระบบ
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e6e6e6] text-[#615d59] font-semibold">
                    <th className="py-2.5 px-3">ผู้ใช้</th>
                    <th className="py-2.5 px-3">อีเมล</th>
                    <th className="py-2.5 px-3">สถานะ</th>
                    <th className="py-2.5 px-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e6e6]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f6f5f4]/50 transition-colors">
                      <td className="py-3 px-3 flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border" />
                        <div>
                          <p className="font-bold text-[#000000]">{u.name}</p>
                          <span className="text-[10px] text-gray-400 font-mono">{u.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#615d59]">{u.email || '-'}</td>
                      <td className="py-3 px-3">
                        {u.isSuperAdmin ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold">
                            👑 Super Admin
                          </span>
                        ) : u.isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                            ระงับการใช้งาน
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                            ปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!u.isSuperAdmin && (
                          <button
                            onClick={() => handleSuspendUser(u.id, !!u.isSuspended, u.name)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                              u.isSuspended
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                          >
                            {u.isSuspended ? 'ปลดระงับ' : 'ระงับบัญชี'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: ROOMS MANAGEMENT */}
        {activeTab === 'rooms' && (
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#e6e6e6] pb-4">
              <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#0075de]" />
                <span>จัดการห้อง ({rooms.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-[#e6e6e6] bg-[#f6f5f4] space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-[#000000]">{r.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                      {r.onlineCount} คน
                    </span>
                  </div>
                  <p className="text-[11px] text-[#615d59]">{r.description || 'ไม่มีคำอธิบาย'}</p>
                  <p className="text-[10px] text-gray-400 font-mono">ID: {r.id} | สร้างโดย: {r.ownerName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#e6e6e6] pb-4">
              <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#0075de]" />
                <span>ประกาศข่าวด่วนประจำเว็บไซต์</span>
              </h2>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                <div>
                  <h3 className="text-xs font-bold text-[#000000]">เปิดใช้งานแถบประกาศด้านบน</h3>
                  <p className="text-[11px] text-[#615d59]">แสดงข้อความประกาศให้ผู้ใช้ทุกคนเห็น</p>
                </div>
                <input
                  type="checkbox"
                  checked={announcementEnabled}
                  onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="w-5 h-5 rounded accent-[#0075de] cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">ข้อความประกาศ</label>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  rows={3}
                  placeholder="พิมพ์ข้อความประกาศ..."
                  className="w-full p-3 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000000]">ประเภทการแจ้งเตือน</label>
                <select
                  value={announcementType}
                  onChange={(e) => setAnnouncementType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs cursor-pointer"
                >
                  <option value="info">ข้อมูลทั่วไป (สีฟ้า)</option>
                  <option value="warning">คำเตือน (สีส้ม)</option>
                  <option value="alert">แจ้งเหตุด่วน (สีแดง)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSaveAnnouncement}
                disabled={savingConfig}
                className="py-2.5 px-5 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                บันทึกประกาศ
              </button>
            </div>
          </div>
        )}

        {/* TAB 8: TICKETS */}
        {activeTab === 'tickets' && (
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-[#e6e6e6] pb-4">
              <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#0075de]" />
                <span>ศูนย์แจ้งปัญหาและข้อเสนอแนะ ({tickets.length})</span>
              </h2>
            </div>

            <div className="space-y-3">
              {tickets.length === 0 ? (
                <p className="text-xs text-[#615d59] py-8 text-center">ยังไม่มีข้อความแจ้งปัญหาในระบบ</p>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-[#e6e6e6] bg-[#f6f5f4] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#000000]">{t.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#e6e6e6] text-[#615d59]">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#615d59]">{t.description}</p>
                    <p className="text-[10px] text-gray-400">จาก: {t.userName} ({t.userEmail || 'ไม่มีอีเมล'})</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AdminPortalView;
