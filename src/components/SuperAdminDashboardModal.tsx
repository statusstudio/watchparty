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
  Sliders,
  Megaphone,
  Music,
  Server,
  Zap,
  Check,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  Mail,
  KeyRound,
  Save,
  EyeOff,
  Copy,
} from 'lucide-react';
import {
  PlatformStats,
  PlatformUser,
  SupportTicket,
  TicketStatus,
  UserProfile,
  PlatformConfig,
  DEFAULT_PLATFORM_CONFIG,
  PlatformAnalytics,
  SmtpConfig,
  DEFAULT_SMTP_CONFIG,
  EmailLogEntry,
} from '../types/index.js';
import { compressChatImage } from '../services/imageCompressor.js';
import { AdPopupModal } from './AdPopupModal.js';

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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'widgets' | 'ad_popup' | 'users' | 'rooms' | 'announcements' | 'tickets' | 'admin_account' | 'smtp'
  >('overview');
  const [loading, setLoading] = useState(false);

  // Admin Account Credentials State
  const [adminCreds, setAdminCreds] = useState<{ username: string; email: string }>({
    username: 'admin',
    email: 'admin@pleng.online',
  });
  const [adminEditEmail, setAdminEditEmail] = useState('');
  const [adminCurrentPass, setAdminCurrentPass] = useState('');
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [savingAdminAccount, setSavingAdminAccount] = useState(false);

  // SMTP Configuration & Email Logs State
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({ ...DEFAULT_SMTP_CONFIG });
  const [smtpHasPass, setSmtpHasPass] = useState(false);
  const [smtpShowPass, setSmtpShowPass] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);

  // Ad Popup State
  const [adEnabled, setAdEnabled] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adOpenInNewTab, setAdOpenInNewTab] = useState(true);
  const [isUploadingAd, setIsUploadingAd] = useState(false);
  const [previewTestPopup, setPreviewTestPopup] = useState(false);

  // Stats & Analytics
  const [stats, setStats] = useState<PlatformStats>({
    totalOnlineUsers: 0,
    totalRooms: 0,
    totalUsers: 0,
    openTickets: 0,
    serverUptimeSeconds: 0,
  });
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);

  // Global Config
  const [config, setConfig] = useState<PlatformConfig>({ ...DEFAULT_PLATFORM_CONFIG });
  const [savingConfig, setSavingConfig] = useState(false);

  // Data lists
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Filters & Search
  const [roomSearch, setRoomSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'active' | 'suspended' | 'admin'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | TicketStatus>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Ticket Reply
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Announcement Form
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'alert'>('info');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAdminCreds(),
        fetchSmtpConfig(),
        fetchEmailLogs(),
        fetchStats(),
        fetchAnalytics(),
        fetchConfig(),
        fetchRooms(),
        fetchUsers(),
        fetchTickets(),
      ]);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminCreds = async () => {
    try {
      const res = await fetch('/api/admin/credentials');
      if (res.ok) {
        const data = await res.json();
        setAdminCreds(data);
        setAdminEditEmail(data.email || 'admin@pleng.online');
      }
    } catch (e) {}
  };

  const fetchSmtpConfig = async () => {
    try {
      const res = await fetch('/api/admin/smtp');
      if (res.ok) {
        const data = await res.json();
        setSmtpConfig({
          ...DEFAULT_SMTP_CONFIG,
          ...data,
          pass: '',
        });
        setSmtpHasPass(!!data.hasPass);
      }
    } catch (e) {}
  };

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch('/api/admin/email-logs');
      if (res.ok) {
        setEmailLogs(await res.json());
      }
    } catch (e) {}
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/admin/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast('บันทึกการตั้งค่าระบบส่งอีเมล (SMTP) สำเร็จ 🎉', 'success');
        if (data.config) {
          setSmtpConfig((prev) => ({ ...prev, ...data.config, pass: '' }));
          setSmtpHasPass(!!data.config.hasPass);
        }
      } else {
        onShowToast(data.error || 'ไม่สามารถบันทึกการตั้งค่าได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า SMTP', 'warning');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpTestEmail.trim() || !smtpTestEmail.includes('@')) {
      onShowToast('กรุณากรอกอีเมลผู้รับสำหรับการทดสอบ', 'warning');
      return;
    }

    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/admin/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: smtpTestEmail.trim(),
          customConfig: smtpConfig,
        }),
      });
      const data = await res.json();
      setSmtpTestResult(data);
      if (res.ok && data.success) {
        onShowToast('ส่งอีเมลทดสอบสำเร็จ! เช็คกล่องข้อความได้เลย 📩', 'success');
      } else {
        onShowToast(data.message || 'ทดสอบส่งอีเมลล้มเหลว', 'warning');
      }
      fetchEmailLogs();
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อทดสอบส่งอีเมลได้',
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const applySmtpPreset = (preset: 'gmail' | 'brevo' | 'resend' | 'custom_domain') => {
    if (preset === 'gmail') {
      setSmtpConfig((prev) => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        fromName: 'pleng.online 🎧',
        fromEmail: prev.user || 'admin@pleng.online',
      }));
      onShowToast('เลือกพรีเซ็ต Gmail (ใช้ App Password 16 ตัวอักษร)', 'info');
    } else if (preset === 'brevo') {
      setSmtpConfig((prev) => ({
        ...prev,
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        fromName: 'pleng.online 🎧',
      }));
      onShowToast('เลือกพรีเซ็ต Brevo / Sendinblue (พอร์ต 587)', 'info');
    } else if (preset === 'resend') {
      setSmtpConfig((prev) => ({
        ...prev,
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        user: 'resend',
        fromName: 'pleng.online 🎧',
        fromEmail: 'onboarding@resend.dev',
      }));
      onShowToast('เลือกพรีเซ็ต Resend SMTP', 'info');
    } else if (preset === 'custom_domain') {
      setSmtpConfig((prev) => ({
        ...prev,
        host: 'mail.pleng.online',
        port: 465,
        secure: true,
        user: 'admin@pleng.online',
        fromName: 'pleng.online 🎧',
        fromEmail: 'admin@pleng.online',
      }));
      onShowToast('เลือกพรีเซ็ตโดเมน pleng.online', 'info');
    }
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedLogId(id);
    onShowToast(`คัดลอกรหัส OTP ${code} แล้ว`, 'success');
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const handleSaveAdminAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCurrentPass.trim()) {
      onShowToast('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการแก้ไข', 'warning');
      return;
    }
    if (adminNewPass) {
      if (adminNewPass.length < 6) {
        onShowToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'warning');
        return;
      }
      if (adminNewPass !== adminConfirmPass) {
        onShowToast('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน', 'warning');
        return;
      }
    }
    setSavingAdminAccount(true);
    try {
      const res = await fetch('/api/admin/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: adminCurrentPass.trim(),
          newEmail: adminEditEmail.trim(),
          newPassword: adminNewPass.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminCreds({
          username: data.credentials?.username || adminCreds.username,
          email: data.credentials?.email || adminEditEmail.trim(),
        });
        setAdminCurrentPass('');
        setAdminNewPass('');
        setAdminConfirmPass('');
        onShowToast('บันทึกข้อมูลบัญชีแอดมินเรียบร้อยแล้ว 🔐', 'success');
      } else {
        onShowToast(data.error || 'ไม่สามารถบันทึกข้อมูลได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'warning');
    } finally {
      setSavingAdminAccount(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/platform/stats');
      const data = await res.json();
      if (data) setStats(data);
    } catch (e) {}
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/platform/analytics');
      const data = await res.json();
      if (data) setAnalytics(data);
    } catch (e) {}
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/platform/config');
      const data = await res.json();
      if (data) {
        setConfig(data);
        if (data.announcementBanner) {
          setAnnouncementText(data.announcementBanner.text || '');
          setAnnouncementType(data.announcementBanner.type || 'info');
        }
        if (data.adPopup) {
          setAdEnabled(!!data.adPopup.enabled);
          setAdTitle(data.adPopup.title || '');
          setAdImageUrl(data.adPopup.imageUrl || '');
          setAdLinkUrl(data.adPopup.linkUrl || '');
          setAdOpenInNewTab(data.adPopup.openInNewTab !== false);
        }
      }
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
  const handleSaveGlobalConfig = async (patch: Partial<PlatformConfig>) => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/platform/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated.config || updated);
        onShowToast('อัพเดทการตั้งค่าระดับระบบสำเร็จ! ⚙️', 'success');
      } else {
        onShowToast('ไม่สามารถบันทึกการตั้งค่าได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'warning');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAd(true);
    try {
      const dataUri = await compressChatImage(file, 1000, 0.85);
      setAdImageUrl(dataUri);
      onShowToast('อัปโหลดรูปภาพโฆษณาเรียบร้อย 🖼️', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 'warning');
    } finally {
      setIsUploadingAd(false);
    }
  };

  const handleSaveAdPopup = async () => {
    if (adEnabled && !adImageUrl.trim()) {
      onShowToast('กรุณาอัปโหลดรูปภาพโฆษณาก่อนเปิดใช้งาน', 'warning');
      return;
    }
    setSavingConfig(true);
    try {
      await handleSaveGlobalConfig({
        adPopup: {
          enabled: adEnabled,
          title: adTitle.trim(),
          imageUrl: adImageUrl.trim(),
          linkUrl: adLinkUrl.trim(),
          openInNewTab: adOpenInNewTab,
          updatedAt: Date.now(),
        },
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!announcementText.trim()) {
      onShowToast('กรุณาระบุข้อความประกาศ', 'warning');
      return;
    }
    setSendingBroadcast(true);
    try {
      // 1. Send WebSocket instant popup to all
      const res = await fetch('/api/platform/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: announcementText.trim(),
          announcementType,
        }),
      });

      // 2. Also save as top banner
      await handleSaveGlobalConfig({
        announcementBanner: {
          enabled: true,
          text: announcementText.trim(),
          type: announcementType,
        },
      });

      if (res.ok) {
        onShowToast('ส่งประกาศด่วนถึงสมาชิกทุกคนเรียบร้อยแล้ว! 📢', 'success');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการส่งประกาศ', 'warning');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleClearBanner = async () => {
    await handleSaveGlobalConfig({
      announcementBanner: {
        enabled: false,
        text: '',
        type: 'info',
      },
    });
    setAnnouncementText('');
    onShowToast('ปิดแถบประกาศด้านบนเรียบร้อยแล้ว', 'info');
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    const reason = window.prompt(`คุณแน่ใจหรือไม่ว่าต้องการสั่งปิด/ลบห้อง "${roomName}"? กรุณาระบุเหตุผล:`, 'ห้องถูกปิดโดยเจ้าของเว็บ (Super Admin)');
    if (reason === null) return;

    try {
      const res = await fetch(`/api/platform/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || 'ห้องถูกปิดโดยเจ้าของเว็บ (Super Admin)' }),
      });
      if (res.ok) {
        onShowToast(`สั่งปิดห้อง "${roomName}" สำเร็จ!`, 'success');
        fetchRooms();
        fetchStats();
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการลบห้อง', 'warning');
    }
  };

  const handleToggleSuspendUser = async (userId: string, currentStatus: boolean, userName: string) => {
    const actionText = currentStatus ? 'ปลดระงับ' : 'ระงับบัญชี (แบน)';
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการ "${actionText}" ของ "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/platform/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended: !currentStatus }),
      });
      if (res.ok) {
        onShowToast(`${actionText} ของ "${userName}" เรียบร้อยแล้ว!`, 'success');
        fetchUsers();
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการระงับผู้ใช้', 'warning');
    }
  };

  const handleToggleSuperAdmin = async (userId: string, currentRole: boolean, userName: string) => {
    const actionText = currentRole ? 'ปลดสิทธิ์ Super Admin' : 'แต่งตั้งเป็น Super Admin 👑';
    if (!window.confirm(`คุณต้องการ "${actionText}" ให้ "${userName}" หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/platform/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuperAdmin: !currentRole }),
      });
      if (res.ok) {
        onShowToast(`${actionText} ให้ "${userName}" สำเร็จ!`, 'success');
        fetchUsers();
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์', 'warning');
    }
  };

  const handleSendReply = async (ticketId: string) => {
    if (!adminReplyText.trim()) return;
    setSendingReply(true);

    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name + ' (Admin)',
          senderAvatar: currentUser.avatar,
          isSuperAdmin: true,
          text: adminReplyText.trim(),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket(updated);
        setAdminReplyText('');
        fetchTickets();
        fetchStats();
        onShowToast('ส่งข้อความตอบกลับสำเร็จ!', 'success');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการส่งข้อความ', 'warning');
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedTicket(updated);
        fetchTickets();
        fetchStats();
        onShowToast(`อัพเดทสถานะตั๋วเป็น "${newStatus}" แล้ว`, 'success');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', 'warning');
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d} วัน ${h} ชม. ${m} นาที`;
    if (h > 0) return `${h} ชม. ${m} นาที`;
    return `${m} นาที`;
  };

  // Filtered lists
  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(roomSearch.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(roomSearch.toLowerCase())
  );

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (userRoleFilter === 'active') return !u.isSuspended;
    if (userRoleFilter === 'suspended') return u.isSuspended;
    if (userRoleFilter === 'admin') return u.isSuperAdmin;
    return true;
  });

  const filteredTickets = tickets.filter((t) => {
    if (ticketStatusFilter === 'all') return true;
    return t.status === ticketStatusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-fade-in text-[#31302e]">
      <div className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-5xl h-[92vh] max-h-[920px] flex flex-col shadow-notion-modal overflow-hidden">
        {/* Header - Notion Style */}
        <div className="px-6 py-3.5 border-b border-[#e6e6e6] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#000000] tracking-tight">
                  ระบบหลังบ้าน & ผู้ดูแลระบบ (Backoffice)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/20">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-[#615d59] mt-0.5">
                ศูนย์กลางควบคุมแพลตฟอร์ม จัดการโมดูล Widget และสถิติคนใช้งานแบบ Real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              disabled={loading}
              title="รีเฟรชข้อมูล"
              className="p-2 rounded-lg bg-white hover:bg-[#f6f5f4] text-[#615d59] border border-[#e6e6e6] transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0075de]' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white hover:bg-[#f6f5f4] text-[#615d59] hover:text-[#000000] border border-[#e6e6e6] transition-all cursor-pointer shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Metric Cards - Notion Clean Design */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-[#e6e6e6] bg-[#f6f5f4] shrink-0">
          {/* Real-time Online Visitors */}
          <div className="p-3 bg-white border border-[#e6e6e6] rounded-xl flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-[#615d59] font-medium uppercase">คนเข้าเว็บสด</p>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-base font-bold text-emerald-600">
                {analytics ? analytics.onlineVisitors : stats.totalOnlineUsers} คน
              </p>
            </div>
          </div>

          {/* Registered Users */}
          <div className="p-3 bg-white border border-[#e6e6e6] rounded-xl flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-[#0075de]/10 text-[#0075de] flex items-center justify-center shrink-0 border border-[#0075de]/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#615d59] font-medium uppercase">สมาชิกทั้งหมด</p>
              <p className="text-base font-bold text-[#000000]">
                {analytics ? analytics.totalUsers : stats.totalUsers} คน
              </p>
            </div>
          </div>

          {/* Active Rooms */}
          <div className="p-3 bg-white border border-[#e6e6e6] rounded-xl flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#615d59] font-medium uppercase">ห้องที่กำลังเปิด</p>
              <p className="text-base font-bold text-[#000000]">
                {analytics ? analytics.activeRooms : stats.totalRooms} ห้อง
              </p>
            </div>
          </div>

          {/* Widget Status / Open Tickets */}
          <div className="p-3 bg-white border border-[#e6e6e6] rounded-xl flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#615d59] font-medium uppercase">โมดูลไมค์ / แชท</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[11px] font-bold ${
                    config.globalWidgets.enableVoiceStage ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {config.globalWidgets.enableVoiceStage ? 'ไมค์: เปิด' : 'ไมค์: ปิด'}
                </span>
                <span className="text-[#a39e98]">•</span>
                <span
                  className={`text-[11px] font-bold ${
                    config.globalWidgets.enableChat ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {config.globalWidgets.enableChat ? 'แชท: เปิด' : 'แชท: ปิด'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Notion Style */}
        <div className="flex border-b border-[#e6e6e6] bg-white px-4 pt-1.5 shrink-0 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#0075de]/10 text-[#0075de]'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>สถิติ & สุขภาพระบบ (Analytics)</span>
          </button>

          <button
            onClick={() => setActiveTab('widgets')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'widgets'
                ? 'bg-[#0075de]/10 text-[#0075de]'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ควบคุมโมดูล & Widget</span>
          </button>

          <button
            onClick={() => setActiveTab('ad_popup')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ad_popup'
                ? 'bg-[#0075de]/10 text-[#0075de]'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>ป๊อปอัพโฆษณา (Ad Popup)</span>
            {config.adPopup?.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="กำลังเปิดใช้งาน" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-[#0075de]/10 text-[#0075de]'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>จัดการสมาชิก ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rooms'
                ? 'bg-[#0075de]/10 text-[#0075de]'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>จัดการห้อง ({rooms.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'bg-[#0075de]/10 text-[#0075de]'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>ประกาศข่าวด่วน</span>
            {config.announcementBanner?.enabled && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'bg-[#0075de]/10 text-[#0075de]'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ศูนย์ร้องเรียน & Feedback ({tickets.length})</span>
            {stats.openTickets > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold font-mono">
                {stats.openTickets}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('admin_account')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'admin_account'
                ? 'bg-amber-500/10 text-amber-700 font-bold'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>🔐 บัญชีแอดมิน & รหัสผ่าน</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('smtp');
              fetchSmtpConfig();
              fetchEmailLogs();
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'smtp'
                ? 'bg-[#0075de]/10 text-[#0075de]'
                : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#0075de]" />
            <span>📧 ตั้งค่าส่งอีเมล (SMTP)</span>
            {smtpConfig.enabled ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="กำลังเปิดใช้งาน" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="โหมดจำลอง (Console)" />
            )}
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          {/* TAB 0: ADMIN ACCOUNT MANAGEMENT */}
          {activeTab === 'admin_account' && (
            <div className="space-y-6 max-w-2xl">
              <div className="border-b border-[#e6e6e6] pb-4">
                <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span>จัดการบัญชีผู้ดูแลระบบ (Admin Account Settings)</span>
                </h2>
                <p className="text-xs text-[#615d59] mt-1">
                  แก้ไข Email หลักและรหัสผ่านสำหรับเข้าสู่ระบบหลังบ้าน (เริ่มต้น: user: admin, pass: admin888)
                </p>
              </div>

              {/* Current Info */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-[#615d59] uppercase font-semibold">ชื่อบัญชีผู้ดูแลระบบ (Username)</span>
                  <p className="text-sm font-bold text-[#000000] mt-0.5">{adminCreds.username}</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#615d59] uppercase font-semibold">อีเมลหลักปัจจุบัน</span>
                  <p className="text-sm font-bold text-amber-700 mt-0.5">{adminCreds.email}</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveAdminAccount} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#000000]">
                    อีเมลหลักใหม่ (New Primary Email)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={adminEditEmail}
                      onChange={(e) => setAdminEditEmail(e.target.value)}
                      placeholder="เช่น admin@pleng.online หรือ your-email@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#e6e6e6]">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000000]">
                      รหัสผ่านใหม่ <span className="text-gray-400 font-normal">(เว้นว่างหากไม่เปลี่ยน)</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={adminNewPass}
                        onChange={(e) => setAdminNewPass(e.target.value)}
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000000]">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={adminConfirmPass}
                        onChange={(e) => setAdminConfirmPass(e.target.value)}
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
                      value={adminCurrentPass}
                      onChange={(e) => setAdminCurrentPass(e.target.value)}
                      placeholder="กรอกรหัสผ่านปัจจุบันของคุณ (เริ่มต้น: admin888)"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-amber-500 transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingAdminAccount || !adminCurrentPass.trim()}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingAdminAccount ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลงบัญชีแอดมิน'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 0.5: SMTP MAIL SETTINGS */}
          {activeTab === 'smtp' && (
            <div className="space-y-6 max-w-3xl">
              {/* Header */}
              <div className="border-b border-[#e6e6e6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#0075de]" />
                    <span>ตั้งค่าระบบส่งอีเมล (SMTP Mail Gateway)</span>
                  </h2>
                  <p className="text-xs text-[#615d59] mt-1">
                    เชื่อมต่อระบบส่งอีเมลจริงสำหรับรหัสยืนยัน OTP สมัครสมาชิกและรีเซ็ตรหัสผ่าน
                  </p>
                </div>
                <div>
                  {smtpConfig.enabled ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      เปิดใช้งาน (ส่งอีเมลจริง)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      โหมดจำลอง (Console Log)
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-[#615d59] uppercase tracking-wider block mb-2">
                  ⚡ เลือกพรีเซ็ตด่วน (Quick Presets):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('gmail')}
                    className="p-3 text-left rounded-xl border border-[#e6e6e6] hover:border-[#0075de] hover:bg-[#0075de]/5 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-[#000000] group-hover:text-[#0075de]">🟣 Gmail</p>
                    <p className="text-[11px] text-[#615d59] mt-0.5">App Password (ฟรี)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applySmtpPreset('brevo')}
                    className="p-3 text-left rounded-xl border border-[#e6e6e6] hover:border-[#0075de] hover:bg-[#0075de]/5 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-[#000000] group-hover:text-[#0075de]">🟠 Brevo</p>
                    <p className="text-[11px] text-[#615d59] mt-0.5">300 เมล/วัน ฟรี</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applySmtpPreset('resend')}
                    className="p-3 text-left rounded-xl border border-[#e6e6e6] hover:border-[#0075de] hover:bg-[#0075de]/5 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-[#000000] group-hover:text-[#0075de]">🔵 Resend</p>
                    <p className="text-[11px] text-[#615d59] mt-0.5">3,000 เมล/เดือน</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applySmtpPreset('custom_domain')}
                    className="p-3 text-left rounded-xl border border-[#e6e6e6] hover:border-[#0075de] hover:bg-[#0075de]/5 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-[#000000] group-hover:text-[#0075de]">🟢 pleng.online</p>
                    <p className="text-[11px] text-[#615d59] mt-0.5">Mail Server โดเมน</p>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveSmtp} className="space-y-4">
                {/* Enable Switch */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                  <div>
                    <span className="text-xs font-bold text-[#000000] block">
                      เปิดใช้งานการส่งอีเมลจริงผ่าน SMTP (Enable SMTP Delivery)
                    </span>
                    <span className="text-[11px] text-[#615d59]">
                      หากเปิดใช้งาน สมาชิกจะได้รับอีเมลยืนยันตัวตนใน Inbox จริง
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpConfig.enabled}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000000]">SMTP Host / Server</label>
                    <input
                      type="text"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      placeholder="เช่น smtp.gmail.com"
                      className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#000000]">พอร์ต (Port)</label>
                      <input
                        type="number"
                        value={smtpConfig.port}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value, 10) || 587 })}
                        placeholder="465 หรือ 587"
                        className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                        required
                      />
                    </div>
                    <div className="flex flex-col justify-end pb-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#31302e]">
                        <input
                          type="checkbox"
                          checked={smtpConfig.secure}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                          className="rounded border-[#e6e6e6] text-[#0075de]"
                        />
                        <span>SSL (465)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000000]">SMTP User / Email</label>
                    <input
                      type="text"
                      value={smtpConfig.user}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                      placeholder="เช่น your-email@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000000] flex items-center justify-between">
                      <span>SMTP Password / App Password</span>
                      {smtpHasPass && (
                        <span className="text-[10px] text-emerald-600">✓ บันทึกรหัสไว้แล้ว</span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={smtpShowPass ? 'text' : 'password'}
                        value={smtpConfig.pass}
                        onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                        placeholder={smtpHasPass ? '•••••••••••••••• (เว้นว่างเพื่อคงรหัสเดิม)' : 'กรอกรหัสผ่าน SMTP 16 หลัก'}
                        className="w-full px-3.5 pr-9 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setSmtpShowPass(!smtpShowPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a39e98] hover:text-[#000000]"
                      >
                        {smtpShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000000]">ชื่อผู้ส่ง (Sender Name)</label>
                    <input
                      type="text"
                      value={smtpConfig.fromName}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                      placeholder="เช่น pleng.online 🎧"
                      className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000000]">อีเมลผู้ส่ง (Sender Email)</label>
                    <input
                      type="email"
                      value={smtpConfig.fromEmail}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                      placeholder="เช่น admin@pleng.online"
                      className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={smtpSaving}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0075de] to-[#005fb8] hover:from-[#0065c0] hover:to-[#004f9e] text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{smtpSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า SMTP'}</span>
                  </button>
                </div>
              </form>

              {/* Test Box */}
              <div className="p-4 rounded-xl border border-[#e6e6e6] bg-[#fcfbf9] space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-[#000000] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[#0075de]" />
                    <span>ทดสอบส่งอีเมลทันที (Test SMTP Delivery)</span>
                  </h4>
                  <p className="text-[11px] text-[#615d59] mt-0.5">
                    ส่งเมลทดสอบเพื่อตรวจสอบว่ารหัสผ่านและ Server ใช้งานได้จริงก่อนเปิดระบบ
                  </p>
                </div>

                <form onSubmit={handleTestSmtp} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={smtpTestEmail}
                    onChange={(e) => setSmtpTestEmail(e.target.value)}
                    placeholder="ใส่อีเมลของคุณเพื่อรับข้อความทดสอบ..."
                    className="flex-1 px-3.5 py-2 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={smtpTesting || !smtpTestEmail.trim()}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{smtpTesting ? 'กำลังส่ง...' : 'ส่งทดสอบ'}</span>
                  </button>
                </form>

                {smtpTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      smtpTestResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <p className="font-bold">{smtpTestResult.success ? '✓ ส่งสำเร็จ!' : '✗ การส่งล้มเหลว:'}</p>
                    <p className="text-[11px] font-mono mt-0.5 break-all">{smtpTestResult.message}</p>
                  </div>
                )}
              </div>

              {/* Logs Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#000000]">
                    📋 ประวัติการขอ OTP &amp; การส่งอีเมลล่าสุด ({emailLogs.length})
                  </h4>
                  <button
                    type="button"
                    onClick={fetchEmailLogs}
                    className="px-2.5 py-1 rounded-lg border border-[#e6e6e6] hover:bg-[#f6f5f4] text-[11px] font-semibold text-[#615d59] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>รีเฟรช</span>
                  </button>
                </div>

                {emailLogs.length === 0 ? (
                  <div className="text-center py-6 text-[#a39e98] text-xs">
                    ยังไม่มีประวัติการส่งอีเมลหรือขอรหัส OTP ในรอบนี้
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[#e6e6e6] rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f6f5f4] border-b border-[#e6e6e6] text-[#615d59] text-[10px] font-semibold uppercase">
                        <tr>
                          <th className="p-2.5">เวลา</th>
                          <th className="p-2.5">รายการ</th>
                          <th className="p-2.5">อีเมลผู้รับ</th>
                          <th className="p-2.5">รหัส OTP</th>
                          <th className="p-2.5">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0efee]">
                        {emailLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#fcfbf9]">
                            <td className="p-2.5 text-[#615d59] font-mono text-[10px] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                            </td>
                            <td className="p-2.5 font-medium">
                              {log.type === 'register_otp' && 'สมัครสมาชิก'}
                              {log.type === 'reset_password_otp' && 'ลืมรหัสผ่าน'}
                              {log.type === 'test' && 'เมลทดสอบ'}
                            </td>
                            <td className="p-2.5 font-mono text-[#0075de]">{log.email}</td>
                            <td className="p-2.5">
                              {log.code ? (
                                <div className="inline-flex items-center gap-1 bg-[#f6f5f4] px-1.5 py-0.5 rounded border border-[#e6e6e6]">
                                  <span className="font-mono font-bold text-xs">{log.code}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(log.id, log.code!)}
                                    className="text-[#a39e98] hover:text-[#0075de] cursor-pointer"
                                  >
                                    {copiedLogId === log.id ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="p-2.5">
                              {log.status === 'sent_smtp' && (
                                <span className="text-emerald-700 font-semibold text-[10px]">✓ ส่งผ่าน SMTP</span>
                              )}
                              {log.status === 'console_fallback' && (
                                <span className="text-amber-700 font-semibold text-[10px]">โหมดจำลอง (Console)</span>
                              )}
                              {log.status === 'failed' && (
                                <span className="text-rose-600 font-semibold text-[10px]" title={log.errorMessage}>
                                  ✗ ล้มเหลว
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: ANALYTICS & OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Server Health Card */}
              <div className="p-4 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#0075de]" />
                    <span>สถานะเซิร์ฟเวอร์ระบบ (Server Health)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h3>
                  <p className="text-xs text-[#615d59] mt-0.5">
                    เซิร์ฟเวอร์เปิดทำงานต่อเนื่องมาแล้ว:{' '}
                    <span className="text-[#0075de] font-semibold">
                      {formatUptime(stats.serverUptimeSeconds)}
                    </span>
                    {analytics?.memoryUsageMb ? ` • หน่วยความจำ (RSS): ${analytics.memoryUsageMb} MB` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs rounded-full font-medium">
                    ระบบทำงานปกติ 100%
                  </span>
                </div>
              </div>

              {/* Members Breakdown & Live Visitors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-[#615d59] uppercase tracking-wider">
                    ช่องทางการเข้าสู่ระบบ (Auth Providers)
                  </h4>
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-[#31302e]">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Google Accounts:
                      </span>
                      <span className="font-bold text-[#000000]">
                        {analytics?.usersByProvider.google ?? 0} คน
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-[#31302e]">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Facebook Accounts:
                      </span>
                      <span className="font-bold text-[#000000]">
                        {analytics?.usersByProvider.facebook ?? 0} คน
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-[#31302e]">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Guest (ผู้เยี่ยมชม):
                      </span>
                      <span className="font-bold text-[#000000]">
                        {analytics?.usersByProvider.guest ?? 0} คน
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-[#615d59] uppercase tracking-wider">
                    สรุปการใช้งานเรียลไทม์
                  </h4>
                  <div className="space-y-2 pt-1 text-xs text-[#31302e]">
                    <div className="flex items-center justify-between">
                      <span>คนออนไลน์สดขณะนี้:</span>
                      <span className="font-bold text-emerald-600">{stats.totalOnlineUsers} คน</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>ห้องที่เปิดอยู่:</span>
                      <span className="font-bold text-[#000000]">{stats.totalRooms} ห้อง</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>เรื่องร้องเรียนที่รอดำเนินการ:</span>
                      <span className="font-bold text-amber-600">{stats.openTickets} เรื่อง</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs space-y-2">
                  <h4 className="text-xs font-bold text-[#615d59] uppercase tracking-wider">
                    การควบคุมด่วน (Quick Links)
                  </h4>
                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={() => setActiveTab('widgets')}
                      className="w-full text-left py-1.5 px-2.5 rounded-lg bg-[#f6f5f4] hover:bg-[#e6e6e6] text-xs font-medium text-[#0075de] transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>🎛️ เปิด/ปิด ไมค์สด หรือแชท</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('announcements')}
                      className="w-full text-left py-1.5 px-2.5 rounded-lg bg-[#f6f5f4] hover:bg-[#e6e6e6] text-xs font-medium text-amber-600 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>📢 ส่งประกาศด่วนทั้งเว็บ</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Popular Tracks Section */}
              <div className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                    <Music className="w-4 h-4 text-[#0075de]" />
                    <span>เพลงยอดนิยมที่มีคนเปิดมากที่สุด (Top Played Tracks)</span>
                  </h4>
                  <span className="text-xs text-[#615d59]">อัพเดทอัตโนมัติ</span>
                </div>

                {analytics?.topTracks && analytics.topTracks.length > 0 ? (
                  <div className="divide-y divide-[#e6e6e6]">
                    {analytics.topTracks.map((tr, idx) => (
                      <div key={tr.videoId} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-5 text-center font-mono font-bold text-xs text-[#615d59]">
                            #{idx + 1}
                          </span>
                          <img
                            src={tr.thumbnail || `https://img.youtube.com/vi/${tr.videoId}/default.jpg`}
                            alt={tr.title}
                            className="w-12 h-8 rounded object-cover border border-[#e6e6e6]"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#000000] truncate">{tr.title}</p>
                            <p className="text-[10px] text-[#615d59]">{tr.channel || 'YouTube'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-full bg-[#0075de]/10 text-[#0075de] text-xs font-bold">
                            เปิดไปแล้ว {tr.playCount} ครั้ง
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#615d59] py-4 text-center italic">
                    ยังไม่มีประวัติการเล่นเพลง สถิติจะบันทึกเมื่อมีคนเริ่มเล่นเพลงในห้อง
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WIDGET CONTROLLER (เปิด/ปิดโมดูลระบบ) */}
          {activeTab === 'widgets' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#0075de]" />
                  <span>จัดการโมดูลและ Widget ระดับระบบ (Global Modular Widgets)</span>
                </h3>
                <p className="text-xs text-[#615d59] mt-0.5">
                  Super Admin สามารถควบคุมการเปิด/ปิดฟังก์ชันหลักของเว็บไซต์ได้ทันที หากเกิดปัญหาหรือต้องการปิดปรับปรุงบางส่วน
                </p>
              </div>

              <div className="space-y-3">
                {/* Voice Stage Global Switch */}
                <div className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#000000]">🎙️ ระบบขึ้นไมค์สด (Voice Stage)</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          config.globalWidgets.enableVoiceStage
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {config.globalWidgets.enableVoiceStage ? 'กำลังเปิดใช้งาน' : 'ปิดการทำงานทั้งเว็บ'}
                      </span>
                    </div>
                    <p className="text-xs text-[#615d59] leading-relaxed">
                      หากปิดสวิตช์นี้ ระบบไมค์และ WebRTC จะถูกปิดการทำงานทั่วทั้งเว็บ เหมาะสำหรับใช้ลดภาระเซิร์ฟเวอร์ในกรณีคนเข้าใช้งานจำนวนมากพร้อมกัน
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleSaveGlobalConfig({
                        globalWidgets: {
                          ...config.globalWidgets,
                          enableVoiceStage: !config.globalWidgets.enableVoiceStage,
                        },
                      })
                    }
                    disabled={savingConfig}
                    className={`px-4 py-2 rounded-full font-semibold text-xs transition-all cursor-pointer shadow-xs shrink-0 ${
                      config.globalWidgets.enableVoiceStage
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[#e6e6e6] hover:bg-[#d8d8d8] text-[#31302e]'
                    }`}
                  >
                    {config.globalWidgets.enableVoiceStage ? 'เปิดใช้งานอยู่ (คลิกเพื่อปิด)' : 'ปิดอยู่ (คลิกเพื่อเปิด)'}
                  </button>
                </div>

                {/* Live Chat Global Switch */}
                <div className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#000000]">💬 ระบบแชทสด (Live Chat)</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          config.globalWidgets.enableChat
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {config.globalWidgets.enableChat ? 'กำลังเปิดใช้งาน' : 'ปิดการทำงานทั้งเว็บ'}
                      </span>
                    </div>
                    <p className="text-xs text-[#615d59] leading-relaxed">
                      เปิดหรือปิดกล่องข้อความแชทสดทั่วทั้งเว็บ หากปิด แท็บแชทในห้องทั้งหมดจะถูกซ่อนตัวอัตโนมัติ
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleSaveGlobalConfig({
                        globalWidgets: {
                          ...config.globalWidgets,
                          enableChat: !config.globalWidgets.enableChat,
                        },
                      })
                    }
                    disabled={savingConfig}
                    className={`px-4 py-2 rounded-full font-semibold text-xs transition-all cursor-pointer shadow-xs shrink-0 ${
                      config.globalWidgets.enableChat
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[#e6e6e6] hover:bg-[#d8d8d8] text-[#31302e]'
                    }`}
                  >
                    {config.globalWidgets.enableChat ? 'เปิดใช้งานอยู่ (คลิกเพื่อปิด)' : 'ปิดอยู่ (คลิกเพื่อเปิด)'}
                  </button>
                </div>

                {/* Soundboard Global Switch */}
                <div className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#000000]">🎉 ซาวด์บอร์ดและเอฟเฟกต์ (Soundboard)</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          config.globalWidgets.enableSoundboard
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {config.globalWidgets.enableSoundboard ? 'กำลังเปิดใช้งาน' : 'ปิดการทำงานทั้งเว็บ'}
                      </span>
                    </div>
                    <p className="text-xs text-[#615d59] leading-relaxed">
                      เปิดหรือปิดเสียงเอฟเฟกต์ฮาๆ ในห้อง
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleSaveGlobalConfig({
                        globalWidgets: {
                          ...config.globalWidgets,
                          enableSoundboard: !config.globalWidgets.enableSoundboard,
                        },
                      })
                    }
                    disabled={savingConfig}
                    className={`px-4 py-2 rounded-full font-semibold text-xs transition-all cursor-pointer shadow-xs shrink-0 ${
                      config.globalWidgets.enableSoundboard
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-[#e6e6e6] hover:bg-[#d8d8d8] text-[#31302e]'
                    }`}
                  >
                    {config.globalWidgets.enableSoundboard ? 'เปิดใช้งานอยู่ (คลิกเพื่อปิด)' : 'ปิดอยู่ (คลิกเพื่อเปิด)'}
                  </button>
                </div>

                {/* Maintenance Mode Switch */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-xl shadow-xs flex items-center justify-between gap-4">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-700">🛠️ โหมดปิดปรับปรุงระบบ (Maintenance Mode)</span>
                      {config.maintenanceMode && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                          กำลังเปิดระบบปิดปรับปรุง
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      เมื่อเปิดโหมดนี้ ผู้ใช้ทั่วไปจะเห็นข้อความแจ้งปิดปรับปรุงชั่วคราว มีเพียง Super Admin เท่านั้นที่เข้าใช้งานได้
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      handleSaveGlobalConfig({
                        maintenanceMode: !config.maintenanceMode,
                      })
                    }
                    disabled={savingConfig}
                    className={`px-4 py-2 rounded-full font-semibold text-xs transition-all cursor-pointer shadow-xs shrink-0 ${
                      config.maintenanceMode
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-[#e6e6e6] hover:bg-[#d8d8d8] text-[#31302e]'
                    }`}
                  >
                    {config.maintenanceMode ? 'เปิดโหมดปรับปรุงอยู่' : 'ปิดอยู่'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AD POPUP WIDGET */}
          {activeTab === 'ad_popup' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#0075de]" />
                  <span>จัดการวิดเจ็ตป๊อปอัปโฆษณา (Ad Popup Widget)</span>
                </h3>
                <p className="text-xs text-[#615d59] mt-0.5">
                  วิดเจ็ตแสดงแบนเนอร์โฆษณาสำหรับเจ้าของเว็บ ป๊อปอัปจะแสดงเมื่อผู้ใช้เข้าสู่หน้าเว็บ สามารถใส่รูปภาพและลิงก์เปิดหน้าเว็บเป้าหมายในแท็บใหม่ได้
                </p>
              </div>

              {/* Master Switch Card */}
              <div className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs flex items-center justify-between gap-4">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#000000]">📢 เปิด/ปิดการแสดงผลป๊อปอัปโฆษณา</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        adEnabled
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}
                    >
                      {adEnabled ? 'เปิดใช้งานอยู่ (Active)' : 'ปิดใช้งาน (Disabled)'}
                    </span>
                  </div>
                  <p className="text-xs text-[#615d59] leading-relaxed">
                    เมื่อเปิดใช้งาน ผู้เข้าชมทุกคนจะเห็นป๊อปอัปโฆษณาตามรูปและลิงก์ที่ระบุด้านล่าง (ผู้ใช้สามารถกดปิดหรือเลือกไม่แสดงอีกในวันนั้นได้)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAdEnabled(!adEnabled)}
                  className={`px-4 py-2 rounded-full font-semibold text-xs transition-all cursor-pointer shadow-xs shrink-0 ${
                    adEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#e6e6e6] hover:bg-[#d8d8d8] text-[#31302e]'
                  }`}
                >
                  {adEnabled ? 'เปิดอยู่ (คลิกเพื่อปิด)' : 'ปิดอยู่ (คลิกเพื่อเปิด)'}
                </button>
              </div>

              {/* Ad Configuration Form */}
              <div className="p-5 bg-white border border-[#e6e6e6] rounded-xl shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-[#000000] uppercase tracking-wider text-[#615d59]">
                  รายละเอียดและเนื้อหาโฆษณา
                </h4>

                {/* 1. Ad Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#31302e] flex items-center justify-between">
                    <span>หัวข้อหรือชื่อแคมเปญ (ไม่บังคับ)</span>
                    <span className="text-[11px] text-[#a39e98] font-normal">เช่น โปรโมชั่นพิเศษ หรือ สปอนเซอร์</span>
                  </label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="เช่น โปรโมชั่นสุดคุ้ม! ติดต่อลงโฆษณา LINE: @myshop"
                    className="w-full px-3.5 py-2.5 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-colors"
                  />
                </div>

                {/* 2. Ad Image Upload & URL */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#31302e] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0075de]" />
                    <span>รูปภาพแบนเนอร์โฆษณา *</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* File Upload Button */}
                    <div>
                      <label
                        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                          isUploadingAd
                            ? 'border-[#0075de] bg-[#0075de]/5 opacity-70'
                            : 'border-[#e6e6e6] hover:border-[#0075de] bg-[#fbfbfa]'
                        }`}
                      >
                        <Upload className={`w-6 h-6 text-[#0075de] mb-1.5 ${isUploadingAd ? 'animate-bounce' : ''}`} />
                        <span className="text-xs font-semibold text-[#000000]">
                          {isUploadingAd ? 'กำลังประมวลผลรูปภาพ...' : 'อัปโหลดรูปภาพจากอุปกรณ์'}
                        </span>
                        <span className="text-[10px] text-[#a39e98] mt-0.5">
                          รองรับ JPG, PNG, WEBP (บีบอัดให้อัตโนมัติ)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAdImageUpload}
                          disabled={isUploadingAd}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Direct Image URL input */}
                    <div className="flex flex-col justify-center space-y-1.5 p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl">
                      <span className="text-[11px] font-semibold text-[#615d59]">หรือวางลิงก์รูปภาพโดยตรง:</span>
                      <input
                        type="url"
                        value={adImageUrl}
                        onChange={(e) => setAdImageUrl(e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full px-3 py-2 bg-white border border-[#e6e6e6] rounded-lg text-xs text-[#000000] focus:outline-none focus:border-[#0075de]"
                      />
                    </div>
                  </div>

                  {/* Image Live Preview */}
                  {adImageUrl && (
                    <div className="relative mt-3 p-3 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl flex items-center gap-4">
                      <img
                        src={adImageUrl}
                        alt="Preview"
                        className="w-32 h-20 object-contain bg-black/5 rounded-lg border border-[#e6e6e6]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#000000] truncate">รูปภาพโฆษณาปัจจุบัน</p>
                        <p className="text-[10px] text-[#a39e98] truncate mt-0.5">{adImageUrl.slice(0, 60)}...</p>
                        <button
                          type="button"
                          onClick={() => setAdImageUrl('')}
                          className="mt-2 text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ลบรูปภาพนี้</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Destination Link URL */}
                <div className="space-y-2 pt-2 border-t border-[#e6e6e6]">
                  <label className="text-xs font-semibold text-[#31302e] flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#0075de]" />
                    <span>ลิงก์ปลายทางเมื่อมีคนคลิก (Destination URL)</span>
                  </label>
                  <input
                    type="url"
                    value={adLinkUrl}
                    onChange={(e) => setAdLinkUrl(e.target.value)}
                    placeholder="https://yourwebsite.com/product หรือ https://lin.ee/..."
                    className="w-full px-3.5 py-2.5 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-colors"
                  />

                  {/* Open in new tab checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={adOpenInNewTab}
                      onChange={(e) => setAdOpenInNewTab(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0075de] focus:ring-0 cursor-pointer accent-[#0075de]"
                    />
                    <span className="text-xs text-[#31302e] flex items-center gap-1">
                      เปิดในแท็บใหม่เสมอ (Open link in new tab)
                      <ExternalLink className="w-3 h-3 text-[#a39e98]" />
                    </span>
                  </label>
                </div>

                {/* Buttons & Preview */}
                <div className="pt-4 border-t border-[#e6e6e6] flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!adImageUrl.trim()) {
                        onShowToast('กรุณาอัปโหลดรูปภาพก่อนทดสอบดูตัวอย่าง', 'warning');
                        return;
                      }
                      setPreviewTestPopup(true);
                    }}
                    className="px-4 py-2 bg-[#f6f5f4] hover:bg-[#e6e6e6] border border-[#e6e6e6] rounded-xl text-xs font-semibold text-[#31302e] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0075de]" />
                    <span>ทดสอบดูตัวอย่างป๊อปอัป (Preview)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAdPopup}
                    disabled={savingConfig || isUploadingAd}
                    className="px-6 py-2 bg-[#0075de] hover:bg-[#005bab] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingConfig ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าโฆษณา'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="ค้นหาสมาชิกด้วยชื่อ, Email หรือ ID..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] shadow-xs"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-[#f6f5f4] p-1 rounded-xl border border-[#e6e6e6] text-xs">
                  <button
                    onClick={() => setUserRoleFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      userRoleFilter === 'all' ? 'bg-white text-[#0075de] shadow-xs font-semibold' : 'text-[#615d59]'
                    }`}
                  >
                    ทั้งหมด ({users.length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('active')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      userRoleFilter === 'active' ? 'bg-white text-emerald-600 shadow-xs font-semibold' : 'text-[#615d59]'
                    }`}
                  >
                    ปกติ ({users.filter((u) => !u.isSuspended).length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('suspended')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      userRoleFilter === 'suspended' ? 'bg-white text-rose-600 shadow-xs font-semibold' : 'text-[#615d59]'
                    }`}
                  >
                    ระงับ ({users.filter((u) => u.isSuspended).length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('admin')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      userRoleFilter === 'admin' ? 'bg-white text-amber-600 shadow-xs font-semibold' : 'text-[#615d59]'
                    }`}
                  >
                    Admin ({users.filter((u) => u.isSuperAdmin).length})
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white border border-[#e6e6e6] rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f6f5f4] border-b border-[#e6e6e6] text-[#615d59] uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">สมาชิก</th>
                        <th className="px-4 py-3">ช่องทาง</th>
                        <th className="px-4 py-3">สถานะ</th>
                        <th className="px-4 py-3">ใช้งานล่าสุด</th>
                        <th className="px-4 py-3 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e6e6]">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#f6f5f4]/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`}
                                alt={u.name}
                                className="w-8 h-8 rounded-full border border-[#e6e6e6] object-cover"
                              />
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-[#000000]">
                                  <span>{u.name}</span>
                                  {u.isSuperAdmin && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                                </div>
                                <p className="text-[10px] text-[#615d59]">{u.email || u.id}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full bg-[#f6f5f4] border border-[#e6e6e6] text-[10px] font-medium text-[#615d59] uppercase">
                              {u.provider}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {u.isSuspended ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-bold">
                                โดนระงับ (Suspended)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">
                                ปกติ (Active)
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-[#615d59] text-[11px]">
                            {new Date(u.lastActiveAt).toLocaleString('th-TH', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Toggle Super Admin */}
                              {u.id !== 'usr-admin-system' && (
                                <button
                                  onClick={() => handleToggleSuperAdmin(u.id, u.isSuperAdmin, u.name)}
                                  title={u.isSuperAdmin ? 'ปลดสิทธิ์ Super Admin' : 'ตั้งเป็น Super Admin'}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-xs ${
                                    u.isSuperAdmin
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20'
                                      : 'bg-white border-[#e6e6e6] text-[#615d59] hover:text-amber-600'
                                  }`}
                                >
                                  <Crown className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Suspend / Unsuspend */}
                              {u.id !== 'usr-admin-system' && (
                                <button
                                  onClick={() => handleToggleSuspendUser(u.id, u.isSuspended, u.name)}
                                  title={u.isSuspended ? 'ปลดแบนผู้ใช้' : 'สั่งระงับผู้ใช้ (แบน)'}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-xs ${
                                    u.isSuspended
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20'
                                      : 'bg-white border-[#e6e6e6] text-[#615d59] hover:text-rose-600'
                                  }`}
                                >
                                  {u.isSuspended ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ROOMS MANAGEMENT */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    placeholder="ค้นหาห้องด้วยชื่อ, รหัสห้อง หรือเจ้าของห้อง..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] shadow-xs"
                  />
                </div>
                <span className="text-xs text-[#615d59] font-medium">พบ {filteredRooms.length} ห้อง</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs space-y-3 hover:border-[#0075de]/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#000000]">{room.name}</h4>
                          {room.isPrivate && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <p className="text-[11px] text-[#615d59] mt-0.5">
                          เจ้าของ: <span className="font-semibold text-[#31302e]">{room.ownerName}</span> • รหัส: #{room.id}
                        </p>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">
                        {room.onlineCount} คนในห้อง
                      </span>
                    </div>

                    {/* Current Song */}
                    {room.currentVideo?.title && (
                      <div className="p-2 rounded-lg bg-[#f6f5f4] border border-[#e6e6e6] flex items-center gap-2 text-xs">
                        <Music className="w-3.5 h-3.5 text-[#0075de] shrink-0" />
                        <span className="truncate text-[#31302e]">{room.currentVideo.title}</span>
                      </div>
                    )}

                    {/* Widgets Status in Room */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#e6e6e6]">
                      <div className="flex items-center gap-2 text-[10px] text-[#615d59]">
                        <span>🎙️ {room.widgets?.enableVoiceStage !== false ? 'ไมค์: เปิด' : 'ไมค์: ปิด'}</span>
                        <span>•</span>
                        <span>💬 {room.widgets?.enableChat !== false ? 'แชท: เปิด' : 'แชท: ปิด'}</span>
                      </div>

                      <button
                        onClick={() => handleDeleteRoom(room.id, room.name)}
                        className="py-1 px-2.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-[#e6e6e6] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>สั่งปิดห้อง</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ANNOUNCEMENTS & BROADCAST */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#0075de]" />
                  <span>ระบบประกาศข่าวด่วนทั่วทั้งเว็บ (Global System Announcement)</span>
                </h3>
                <p className="text-xs text-[#615d59] mt-0.5">
                  ส่งข้อความเด้งเตือนสดและปักหมุดแถบแบนเนอร์ด้านบนสุดของเว็บถึงผู้ใช้งานทุกคนทุกห้องทันที
                </p>
              </div>

              {/* Active Banner Status */}
              {config.announcementBanner?.enabled && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      กำลังปักหมุดแถบประกาศ: <strong className="font-semibold">{config.announcementBanner.text}</strong>
                    </span>
                  </div>
                  <button
                    onClick={handleClearBanner}
                    className="py-1 px-2 rounded-lg bg-white border border-[#e6e6e6] text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shadow-xs shrink-0"
                  >
                    ปิดแถบประกาศนี้
                  </button>
                </div>
              )}

              {/* Broadcast Form */}
              <div className="p-4 bg-white border border-[#e6e6e6] rounded-xl shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#000000] mb-1">
                    ข้อความประกาศ (Announcement Text)
                  </label>
                  <textarea
                    rows={3}
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="เช่น เตรียมปิดปรับปรุงระบบคืนนี้เวลา 02:00 น. ขออภัยในความไม่สะดวกครับ..."
                    className="w-full p-3 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#000000] mb-1.5">
                    ประเภทการแจ้งเตือน (Banner Type)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAnnouncementType('info')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        announcementType === 'info'
                          ? 'border-[#0075de] bg-[#0075de]/10 text-[#0075de]'
                          : 'border-[#e6e6e6] bg-white text-[#615d59]'
                      }`}
                    >
                      <span>ℹ️ แจ้งข่าวสาร (Info)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAnnouncementType('warning')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        announcementType === 'warning'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700'
                          : 'border-[#e6e6e6] bg-white text-[#615d59]'
                      }`}
                    >
                      <span>⚠️ เตือนล่วงหน้า (Warning)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAnnouncementType('alert')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        announcementType === 'alert'
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600'
                          : 'border-[#e6e6e6] bg-white text-[#615d59]'
                      }`}
                    >
                      <span>🚨 ด่วนที่สุด (Alert)</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSendBroadcast}
                    disabled={sendingBroadcast || !announcementText.trim()}
                    className="w-full py-2.5 px-4 rounded-full font-semibold text-xs bg-[#0075de] hover:bg-[#005bab] text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingBroadcast ? 'กำลังส่งประกาศ...' : 'ส่งประกาศข่าวด่วนทันที (Broadcast Now)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SUPPORT TICKETS */}
          {activeTab === 'tickets' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
              {/* Ticket List */}
              <div className="md:col-span-5 flex flex-col space-y-3">
                <div className="flex items-center gap-1 bg-[#f6f5f4] p-1 rounded-xl border border-[#e6e6e6] text-xs">
                  <button
                    onClick={() => setTicketStatusFilter('all')}
                    className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      ticketStatusFilter === 'all' ? 'bg-white text-[#0075de] shadow-xs font-semibold' : 'text-[#615d59]'
                    }`}
                  >
                    ทั้งหมด ({tickets.length})
                  </button>
                  <button
                    onClick={() => setTicketStatusFilter('pending')}
                    className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      ticketStatusFilter === 'pending' ? 'bg-white text-amber-600 shadow-xs font-semibold' : 'text-[#615d59]'
                    }`}
                  >
                    รอดำเนินการ
                  </button>
                  <button
                    onClick={() => setTicketStatusFilter('resolved')}
                    className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      ticketStatusFilter === 'resolved' ? 'bg-white text-emerald-600 shadow-xs font-semibold' : 'text-[#615d59]'
                    }`}
                  >
                    เสร็จสิ้น
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                  {filteredTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer shadow-xs ${
                        selectedTicket?.id === t.id
                          ? 'border-[#0075de] bg-[#0075de]/5 ring-1 ring-[#0075de]'
                          : 'border-[#e6e6e6] bg-white hover:border-[#0075de]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[#000000] truncate">{t.title}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            t.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : t.status === 'in_progress'
                              ? 'bg-[#0075de]/10 text-[#0075de]'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#615d59] line-clamp-2 mt-1">{t.description}</p>
                      <div className="flex items-center justify-between text-[9px] text-[#a39e98] mt-2">
                        <span>โดย {t.userName}</span>
                        <span>{new Date(t.updatedAt).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ticket Detail & Reply */}
              <div className="md:col-span-7 flex flex-col bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl p-4 shadow-xs">
                {selectedTicket ? (
                  <div className="flex flex-col h-full space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-[#e6e6e6] pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-[#000000]">{selectedTicket.title}</h4>
                        <p className="text-[11px] text-[#615d59] mt-0.5">
                          ผู้แจ้ง: {selectedTicket.userName} ({selectedTicket.userEmail || 'ไม่มีอีเมล'})
                        </p>
                      </div>

                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
                        className="px-2 py-1 bg-white border border-[#e6e6e6] rounded-lg text-xs font-semibold text-[#000000] focus:outline-none"
                      >
                        <option value="pending">รอดำเนินการ (Pending)</option>
                        <option value="in_progress">กำลังตรวจสอบ (In Progress)</option>
                        <option value="resolved">แก้ไขแล้ว (Resolved)</option>
                      </select>
                    </div>

                    {/* Messages thread */}
                    <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-white rounded-lg border border-[#e6e6e6]">
                      {selectedTicket.messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                            msg.isSuperAdmin
                              ? 'ml-auto bg-[#0075de]/10 border border-[#0075de]/20 text-[#000000]'
                              : 'mr-auto bg-[#f6f5f4] border border-[#e6e6e6] text-[#31302e]'
                          }`}
                        >
                          <div className="flex items-center gap-1 font-bold text-[10px] text-[#615d59] mb-0.5">
                            <span>{msg.senderName}</span>
                            {msg.isSuperAdmin && <Crown className="w-3 h-3 text-amber-500" />}
                          </div>
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply(selectedTicket.id)}
                        placeholder="พิมพ์ข้อความตอบกลับผู้ใช้..."
                        className="flex-1 px-3 py-2 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] shadow-xs"
                      />
                      <button
                        onClick={() => handleSendReply(selectedTicket.id)}
                        disabled={sendingReply || !adminReplyText.trim()}
                        className="p-2 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#615d59] space-y-2">
                    <MessageSquare className="w-8 h-8 text-[#a39e98]" />
                    <p className="text-xs">เลือกคำร้องจากรายการด้านซ้ายเพื่อดูรายละเอียดและตอบกลับ</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ad Popup Live Preview Modal */}
      {previewTestPopup && (
        <AdPopupModal
          adPopup={{
            enabled: true,
            title: adTitle,
            imageUrl: adImageUrl,
            linkUrl: adLinkUrl,
            openInNewTab: adOpenInNewTab,
            updatedAt: Date.now(),
          }}
          isPreview={true}
          onClose={() => setPreviewTestPopup(false)}
        />
      )}
    </div>
  );
};
