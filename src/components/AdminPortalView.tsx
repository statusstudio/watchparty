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
  Send,
  Check,
  Copy,
  Server,
  HelpCircle,
  Eye,
  EyeOff,
  UserPlus,
  Edit,
  Trash2,
  Search,
  X,
  Sparkles,
  Clock,
  Menu,
  ChevronRight,
  Ghost,
  Music,
  Headphones,
  AlertTriangle,
  Database,
  Rocket,
  Zap,
} from 'lucide-react';
import {
  UserProfile,
  PlatformConfig,
  DEFAULT_PLATFORM_CONFIG,
  PlatformStats,
  PlatformAnalytics,
  PlatformUser,
  SupportTicket,
  TicketStatus,
  SmtpConfig,
  DEFAULT_SMTP_CONFIG,
  EmailLogEntry,
} from '../types/index.js';
import { AdPopupModal } from './AdPopupModal.js';
import { compressChatImage } from '../services/imageCompressor.js';
import { saveUser } from '../services/auth.js';

function formatDeployDateTime(isoString?: string): string {
  if (!isoString) return 'กำลังตรวจสอบ...';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' น.';
  } catch {
    return isoString;
  }
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return 'เมื่อสักครู่';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec} วินาทีที่แล้ว`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} วันที่แล้ว`;
  } catch {
    return '';
  }
}

interface AdminPortalViewProps {
  onNavigateHome: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  onJoinRoom?: (roomId: string, isStealth?: boolean) => void;
  currentUser?: UserProfile | null;
  onUpdateCurrentUser?: (user: UserProfile) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  onNavigateHome,
  onShowToast,
  onJoinRoom,
  currentUser,
  onUpdateCurrentUser,
}) => {
  // Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (currentUser?.isSuperAdmin) return true;
    return localStorage.getItem('watchparty_superadmin') === 'true';
  });

  useEffect(() => {
    if (currentUser?.isSuperAdmin && !isAdminAuthenticated) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('watchparty_superadmin', 'true');
    }
  }, [currentUser?.isSuperAdmin]);

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
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

  // Backoffice State & Tabs
  const [activeTab, setActiveTab] = useState<
    'account' | 'smtp' | 'database' | 'deploy' | 'overview' | 'widgets' | 'ad_popup' | 'users' | 'rooms' | 'announcements' | 'tickets'
  >('overview');
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    message: string;
  }>({
    configured: false,
    connected: false,
    message: 'กำลังตรวจสอบสถานะ...',
  });
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Data
  const [stats, setStats] = useState<PlatformStats>({
    totalOnlineUsers: 0,
    totalRooms: 0,
    totalUsers: 0,
    openTickets: 0,
    serverUptimeSeconds: 0,
  });
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [serverVersion, setServerVersion] = useState<{
    bootTime?: string;
    gitCommit?: string;
    serviceId?: string | null;
    environment?: string;
    now?: string;
  } | null>(null);
  const [triggeringDeploy, setTriggeringDeploy] = useState(false);
  const [deployCountdown, setDeployCountdown] = useState<number | null>(null);
  const [config, setConfig] = useState<PlatformConfig>({ ...DEFAULT_PLATFORM_CONFIG });
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Room Management State
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [closingRoom, setClosingRoom] = useState<any | null>(null);
  const [closeRoomReason, setCloseRoomReason] = useState('');
  const [isClosingRoom, setIsClosingRoom] = useState(false);

  // Tickets Management State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | TicketStatus>('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingTicketStatus, setUpdatingTicketStatus] = useState(false);

  // User Management State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'member' | 'suspended'>('all');

  // Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsSuperAdmin, setNewUserIsSuperAdmin] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserNewPassword, setEditUserNewPassword] = useState('');
  const [editUserIsSuperAdmin, setEditUserIsSuperAdmin] = useState(false);
  const [editUserIsSuspended, setEditUserIsSuspended] = useState(false);
  const [savingEditUser, setSavingEditUser] = useState(false);

  // Delete User Confirmation State
  const [deletingUser, setDeletingUser] = useState<PlatformUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

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

  const activeAdminName = currentUser?.isSuperAdmin
    ? (currentUser.name || currentUser.username)
    : adminCredentials.username;
  const activeAdminEmail = currentUser?.isSuperAdmin
    ? (currentUser.email || adminCredentials.email)
    : adminCredentials.email;

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

  const fetchSmtpConfig = async () => {
    try {
      const res = await fetch('/api/admin/smtp');
      if (res.ok) {
        const data = await res.json();
        setSmtpConfig({
          ...DEFAULT_SMTP_CONFIG,
          ...data,
          pass: '', // Leave blank for security unless editing
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

  const fetchSupabaseStatus = async () => {
    try {
      const res = await fetch('/api/admin/supabase-status');
      if (res.ok) {
        setSupabaseStatus(await res.json());
      }
    } catch (e) {
      setSupabaseStatus({
        configured: false,
        connected: false,
        message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อตรวจสอบ Supabase ได้',
      });
    }
  };

  const handleTriggerSupabaseSync = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await fetch('/api/admin/supabase-sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onShowToast(data.message, 'success');
        fetchSupabaseStatus();
      } else {
        onShowToast(data.message, 'warning');
      }
    } catch (e: any) {
      onShowToast(e.message || 'เกิดข้อผิดพลาดในการซิงก์ข้อมูล', 'warning');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const fetchVersion = async () => {
    try {
      const res = await fetch('/api/version');
      if (res.ok) {
        setServerVersion(await res.json());
      }
    } catch (e) {}
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAdminCredentials(),
        fetchSmtpConfig(),
        fetchEmailLogs(),
        fetchSupabaseStatus(),
        fetchVersion(),
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

  // Deploy Countdown Timer Effect
  useEffect(() => {
    if (deployCountdown === null || deployCountdown <= 0) return;
    const timer = setInterval(() => {
      setDeployCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [deployCountdown]);

  const handleTriggerRedeploy = async () => {
    if (!window.confirm('คุณต้องการสั่งให้เซิร์ฟเวอร์ Render เริ่ม Deploy เว็บไซต์ใหม่ทันทีใช่หรือไม่?\n\n(ระบบจะดึงโค้ดล่าสุดจาก GitHub และเริ่มบิลด์ใหม่ทันที ใช้เวลาประมาณ 2-3 นาที)')) {
      return;
    }

    setTriggeringDeploy(true);
    try {
      const res = await fetch('/api/admin/trigger-deploy', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onShowToast('🚀 ส่งคำสั่ง Deploy ไปยัง Render สำเร็จแล้ว! กำลัง Build...', 'success');
        setDeployCountdown(120); // 120 seconds countdown
      } else {
        onShowToast(data.message || 'ไม่สามารถสั่ง Deploy ได้', 'warning');
      }
    } catch (e: any) {
      onShowToast(e.message || 'เกิดข้อผิดพลาดในการสั่ง Deploy', 'warning');
    } finally {
      setTriggeringDeploy(false);
    }
  };

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
      if (res.ok) {
        const data: SupportTicket[] = await res.json();
        setTickets(data);
        if (selectedTicket) {
          const updated = data.find((t) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (e) {}
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: TicketStatus, adminMessage?: string) => {
    setUpdatingTicketStatus(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        const statusLabel =
          status === 'resolved' ? 'แก้ไขเสร็จสิ้นเรียบร้อย ✅' : status === 'in_progress' ? 'กำลังตรวจสอบ 🔍' : 'รอดำเนินการ ⏳';
        onShowToast(`เปลี่ยนสถานะเป็น "${statusLabel}" สำเร็จ`, 'success');
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(data.ticket);
        }
        fetchTickets();
      } else {
        onShowToast('ไม่สามารถเปลี่ยนสถานะได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ', 'warning');
    } finally {
      setUpdatingTicketStatus(false);
    }
  };

  const handleSendAdminReply = async (ticketId: string) => {
    if (!adminReplyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: adminCredentials.username || 'admin',
          senderName: 'ผู้ดูแลระบบ (Admin)',
          senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
          isSuperAdmin: true,
          text: adminReplyText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onShowToast('ส่งข้อความตอบกลับเรียบร้อย ✉️', 'success');
        setAdminReplyText('');
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(data.ticket);
        }
        fetchTickets();
      } else {
        onShowToast('ไม่สามารถส่งข้อความตอบกลับได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการส่งข้อความ', 'warning');
    } finally {
      setSendingReply(false);
    }
  };

  // Force Close Room handler
  const handleForceCloseRoom = async () => {
    if (!closingRoom) return;
    setIsClosingRoom(true);
    try {
      const res = await fetch(`/api/platform/rooms/${closingRoom.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: closeRoomReason.trim() || 'ห้องนี้ถูกสั่งปิดโดยผู้ดูแลระบบ (Super Admin)' }),
      });
      if (res.ok) {
        onShowToast(`สั่งปิดห้อง "${closingRoom.name}" สำเร็จ 🛑`, 'success');
        setClosingRoom(null);
        setCloseRoomReason('');
        fetchRooms();
      } else {
        const data = await res.json();
        onShowToast(data.error || 'ไม่สามารถสั่งปิดห้องได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการสั่งปิดห้อง', 'warning');
    } finally {
      setIsClosingRoom(false);
    }
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
        if (data.user) {
          saveUser(data.user);
          onUpdateCurrentUser?.(data.user);
        }
        onShowToast(`ยินดีต้อนรับคุณ ${data.user?.name || data.user?.username || 'แอดมิน'} เข้าสู่ระบบผู้ดูแลระบบ 👑`, 'success');
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

  // --- SMTP Settings Handlers ---
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
        onShowToast('บันทึกการตั้งค่าระบบส่งอีเมล (SMTP) เรียบร้อยแล้ว 🎉', 'success');
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

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      onShowToast('กรุณากรอกชื่อสมาชิก', 'warning');
      return;
    }
    if (!newUserEmail.trim() || !newUserEmail.includes('@')) {
      onShowToast('กรุณากรอกอีเมลให้ถูกต้อง', 'warning');
      return;
    }
    if (newUserPassword.length < 6) {
      onShowToast('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'warning');
      return;
    }

    setAddingUser(true);
    try {
      const res = await fetch('/api/platform/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword.trim(),
          isSuperAdmin: newUserIsSuperAdmin,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(`เพิ่มสมาชิก "${newUserName}" สำเร็จ 🎉`, 'success');
        setIsAddUserModalOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserIsSuperAdmin(false);
        fetchUsers();
      } else {
        onShowToast(data.error || 'ไม่สามารถสร้างผู้ใช้ได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการสร้างผู้ใช้', 'warning');
    } finally {
      setAddingUser(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: PlatformUser) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email || '');
    setEditUserNewPassword('');
    setEditUserIsSuperAdmin(!!user.isSuperAdmin);
    setEditUserIsSuspended(!!user.isSuspended);
  };

  // Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUserName.trim()) {
      onShowToast('กรุณากรอกชื่อสมาชิก', 'warning');
      return;
    }
    if (editUserNewPassword && editUserNewPassword.length < 6) {
      onShowToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'warning');
      return;
    }

    setSavingEditUser(true);
    try {
      const res = await fetch(`/api/platform/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editUserName.trim(),
          email: editUserEmail.trim() || undefined,
          newPassword: editUserNewPassword.trim() || undefined,
          isSuperAdmin: editUserIsSuperAdmin,
          isSuspended: editUserIsSuspended,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(`อัพเดทข้อมูลของ "${editUserName}" สำเร็จ ✨`, 'success');
        setEditingUser(null);
        fetchUsers();
      } else {
        onShowToast(data.error || 'ไม่สามารถแก้ไขข้อมูลได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการแก้ไขข้อมูล', 'warning');
    } finally {
      setSavingEditUser(false);
    }
  };

  // Delete User Confirmation
  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeletingUser(true);
    try {
      const res = await fetch(`/api/platform/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(data.message || 'ลบสมาชิกสำเร็จ', 'success');
        setDeletingUser(null);
        fetchUsers();
      } else {
        onShowToast(data.error || 'ไม่สามารถลบสมาชิกได้', 'warning');
      }
    } catch (err) {
      onShowToast('เกิดข้อผิดพลาดในการลบสมาชิก', 'warning');
    } finally {
      setIsDeletingUser(false);
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
                ชื่อผู้ใช้หรืออีเมลผู้ดูแลระบบ (Username / Email)
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin หรืออีเมล/ชื่อผู้ใช้ของคุณที่มีสิทธิ์ Super Admin"
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
                  placeholder="กรอกรหัสผ่านของคุณ..."
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

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
    if (ticketSearchQuery.trim()) {
      const q = ticketSearchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchUser = t.userName?.toLowerCase().includes(q);
      const matchEmail = t.userEmail?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchUser || matchEmail;
    }
    return true;
  });

  const getTabTitle = (tab: typeof activeTab) => {
    switch (tab) {
      case 'overview':
        return 'สถิติ & สุขภาพระบบ';
      case 'users':
        return 'จัดการสมาชิก';
      case 'rooms':
        return 'จัดการห้องปาร์ตี้';
      case 'tickets':
        return 'Support & แจ้งปัญหา';
      case 'announcements':
        return 'ประกาศข่าวด่วน';
      case 'ad_popup':
        return 'ป๊อปอัพโฆษณา';
      case 'widgets':
        return 'โมดูล & Widget';
      case 'account':
        return 'บัญชีแอดมิน & รหัสผ่าน';
      case 'smtp':
        return 'ตั้งค่าส่งอีเมล SMTP';
      case 'database':
        return 'ฐานข้อมูล Supabase Cloud';
      case 'deploy':
        return 'สถานะ Deploy & อัปเดตเว็บ';
      default:
        return 'เมนูจัดการระบบ';
    }
  };

  const navSections = [
    {
      title: 'ภาพรวมระบบ',
      items: [
        {
          id: 'overview' as const,
          label: 'สถิติ & สุขภาพระบบ',
          icon: Activity,
        },
      ],
    },
    {
      title: 'การจัดการข้อมูล',
      items: [
        {
          id: 'users' as const,
          label: 'จัดการสมาชิก',
          icon: Users,
          count: users.length,
        },
        {
          id: 'rooms' as const,
          label: 'จัดการห้องปาร์ตี้',
          icon: Radio,
          count: rooms.length,
        },
        {
          id: 'tickets' as const,
          label: 'แจ้งปัญหา & Support',
          icon: MessageSquare,
          count: tickets.length,
          alertCount: tickets.filter((t) => t.status === 'pending').length,
        },
      ],
    },
    {
      title: 'การสื่อสาร & การตลาด',
      items: [
        {
          id: 'announcements' as const,
          label: 'ประกาศข่าวด่วน',
          icon: Megaphone,
          isActive: config.announcementBanner?.enabled || announcementEnabled,
        },
        {
          id: 'ad_popup' as const,
          label: 'ป๊อปอัพโฆษณา (Ad)',
          icon: ImageIcon,
          isActive: config.adPopup?.enabled,
        },
        {
          id: 'widgets' as const,
          label: 'ควบคุมโมดูล & Widget',
          icon: Sliders,
        },
      ],
    },
    {
      title: 'ความปลอดภัย & ตั้งค่า',
      items: [
        {
          id: 'account' as const,
          label: 'บัญชีแอดมิน & รหัสผ่าน',
          icon: Lock,
        },
        {
          id: 'smtp' as const,
          label: 'ตั้งค่าส่งอีเมล (SMTP)',
          icon: Mail,
          statusLabel: smtpConfig.enabled ? 'Live' : 'Console',
          statusColor: smtpConfig.enabled
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200',
        },
        {
          id: 'database' as const,
          label: 'ฐานข้อมูล Supabase Cloud',
          icon: Database,
          statusLabel: supabaseStatus.connected ? 'เชื่อมต่อแล้ว' : 'ออฟไลน์',
          statusColor: supabaseStatus.connected
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-gray-100 text-gray-600 border-gray-200',
        },
        {
          id: 'deploy' as const,
          label: 'สถานะ Deploy & อัปเดตเว็บ',
          icon: Rocket,
          statusLabel: deployCountdown !== null ? `กำลังบิลด์ (${deployCountdown}s)` : 'ออนไลน์',
          statusColor: deployCountdown !== null
            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            : 'bg-blue-50 text-[#0075de] border-blue-200',
        },
      ],
    },
  ];

  const renderNavContent = () => (
    <div className="space-y-4">
      {navSections.map((section, sIdx) => (
        <div key={sIdx} className="space-y-1">
          <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[#a39e98]">
            {section.title}
          </div>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileNavOpen(false);
                    if (item.id === 'smtp') {
                      fetchSmtpConfig();
                      fetchEmailLogs();
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#0075de] text-white shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-[#615d59]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                    {'alertCount' in item && typeof item.alertCount === 'number' && item.alertCount > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isSelected
                            ? 'bg-white text-rose-600'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                        title={`${item.alertCount} คำร้องรอดำเนินการ`}
                      >
                        {item.alertCount} ใหม่
                      </span>
                    )}

                    {'count' in item && typeof item.count === 'number' && (!('alertCount' in item) || !item.alertCount) && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-[#e6e6e6] text-[#615d59]'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}

                    {'isActive' in item && item.isActive && (
                      <span
                        className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}
                        title="เปิดใช้งานอยู่"
                      />
                    )}

                    {'statusLabel' in item && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          isSelected
                            ? 'bg-white/25 text-white border-white/40'
                            : item.statusColor
                        }`}
                      >
                        {item.statusLabel}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Admin Profile Footnote in Sidebar */}
      <div className="pt-3 border-t border-[#e6e6e6] mt-2">
        <div className="p-2.5 bg-[#f6f5f4] rounded-xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0">
            👑
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#000000] truncate">{activeAdminName}</p>
            <p className="text-[10px] text-[#615d59] truncate">{activeAdminEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // LOGGED IN ADMIN PORTAL DASHBOARD
  return (
    <div className="h-screen w-full bg-[#f6f5f4] flex flex-col text-[#31302e] overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#e6e6e6] z-40 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shadow-xs">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-[#000000] tracking-tight">
                pleng.online Admin Portal
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/20">
                SUPER ADMIN
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('deploy')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                  deployCountdown !== null
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 animate-pulse'
                    : 'bg-blue-50 hover:bg-blue-100 text-[#0075de] border-blue-200 shadow-2xs'
                }`}
                title="คลิกเพื่อไปที่เมนูสถานะการ Deploy & อัปเดตเว็บ"
              >
                <Rocket className="w-3 h-3 text-[#0075de]" />
                <span>
                  {deployCountdown !== null
                    ? `กำลังบิลด์ (${deployCountdown}s)`
                    : `Deploy: ${formatDeployDateTime(__APP_BUILD_TIME__)}`}
                </span>
              </button>
            </div>
            <p className="text-xs text-[#615d59]">
              ผู้ดูแลระบบ: <strong>{activeAdminName}</strong> ({activeAdminEmail})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="md:hidden px-2.5 py-1.5 rounded-xl bg-[#0075de]/10 text-[#0075de] hover:bg-[#0075de]/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="เปิดเมนูนำทาง"
          >
            <Menu className="w-4 h-4" />
            <span className="max-w-[100px] truncate">{getTabTitle(activeTab)}</span>
          </button>

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

      {/* Main Workspace with Categorized Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto overflow-hidden min-h-0">
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-[#e6e6e6] p-4 h-full overflow-y-auto">
          {renderNavContent()}
        </aside>

        {/* Mobile Slide-over Drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-fade-in border-r border-[#e6e6e6]">
              <div className="p-4 border-b border-[#e6e6e6] flex items-center justify-between bg-[#fcfbf9]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs border border-amber-500/20">
                    👑
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#000000]">เมนูจัดการระบบ</h3>
                    <p className="text-[10px] text-[#615d59]">Admin Workspace</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1 rounded-lg text-[#615d59] hover:bg-[#f6f5f4]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {renderNavContent()}
              </div>
            </div>
          </div>
        )}

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-40">
          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                  {activeAdminName} 👑
                </p>
              </div>
            </div>
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
                    placeholder="กรอกรหัสผ่านปัจจุบันของคุณ"
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

        {/* TAB 1.5: SMTP MAIL SETTINGS */}
        {activeTab === 'smtp' && (
          <div className="space-y-6">
            {/* Status & Intro Card */}
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e6e6e6] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#0075de]" />
                    <span>ตั้งค่าระบบส่งอีเมล (SMTP Mail Gateway)</span>
                  </h2>
                  <p className="text-xs text-[#615d59] mt-1">
                    เชื่อมต่อ Mail Server เพื่อส่งรหัสยืนยัน OTP 6 หลัก และลิงก์รีเซ็ตรหัสผ่านเข้าสู่กล่องจดหมายของผู้ใช้งานจริง
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#615d59] font-medium">สถานะระบบ:</span>
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
              <div className="mt-5 pt-1">
                <span className="text-[11px] font-semibold text-[#615d59] uppercase tracking-wider block mb-2">
                  ⚡ เลือกพรีเซ็ตด่วน (Quick Presets):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applySmtpPreset('gmail')}
                    className="p-3 text-left rounded-xl border border-[#e6e6e6] hover:border-[#0075de] hover:bg-[#0075de]/5 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-[#000000] group-hover:text-[#0075de] flex items-center gap-1.5">
                      <span>🟣 Gmail</span>
                    </p>
                    <p className="text-[11px] text-[#615d59] mt-0.5">App Password (ฟรี)</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applySmtpPreset('brevo')}
                    className="p-3 text-left rounded-xl border border-[#e6e6e6] hover:border-[#0075de] hover:bg-[#0075de]/5 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-[#000000] group-hover:text-[#0075de] flex items-center gap-1.5">
                      <span>🟠 Brevo</span>
                    </p>
                    <p className="text-[11px] text-[#615d59] mt-0.5">300 เมล/วัน ฟรี</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applySmtpPreset('resend')}
                    className="p-3 text-left rounded-xl border border-[#e6e6e6] hover:border-[#0075de] hover:bg-[#0075de]/5 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-[#000000] group-hover:text-[#0075de] flex items-center gap-1.5">
                      <span>🔵 Resend</span>
                    </p>
                    <p className="text-[11px] text-[#615d59] mt-0.5">3,000 เมล/เดือน</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applySmtpPreset('custom_domain')}
                    className="p-3 text-left rounded-xl border border-[#e6e6e6] hover:border-[#0075de] hover:bg-[#0075de]/5 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-[#000000] group-hover:text-[#0075de] flex items-center gap-1.5">
                      <span>🟢 pleng.online</span>
                    </p>
                    <p className="text-[11px] text-[#615d59] mt-0.5">Mail Server โดเมน</p>
                  </button>
                </div>
              </div>

              {/* Main Configuration Form */}
              <form onSubmit={handleSaveSmtp} className="mt-6 space-y-5">
                {/* Enable / Disable Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                  <div>
                    <span className="text-xs font-bold text-[#000000] block">
                      เปิดใช้งานการส่งอีเมลจริงผ่าน SMTP (Enable SMTP Delivery)
                    </span>
                    <span className="text-[11px] text-[#615d59]">
                      เมื่อเปิดใช้งาน ระบบจะส่งอีเมล OTP จริงไปยัง Inbox ผู้ใช้ หากปิดใช้งาน จะเก็บรหัสไว้ใน Log หลังบ้าน
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

                {/* Gateway Provider Selector */}
                <div className="p-3.5 bg-[#fcfbf9] rounded-xl border border-[#e6e6e6] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#000000]">ช่องทางการส่งอีเมล (Email Gateway)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#0075de] font-semibold">
                      {smtpConfig.provider === 'resend' ? '⚡ HTTP API Gateway' : '📬 SMTP Gateway'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSmtpConfig({ ...smtpConfig, provider: 'resend' })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        smtpConfig.provider === 'resend'
                          ? 'bg-blue-50/70 border-[#0075de] ring-1 ring-[#0075de]'
                          : 'bg-white border-[#e6e6e6] hover:bg-[#f6f5f4]'
                      }`}
                    >
                      <Zap className={`w-4 h-4 shrink-0 mt-0.5 ${smtpConfig.provider === 'resend' ? 'text-[#0075de]' : 'text-[#a39e98]'}`} />
                      <div>
                        <div className="text-xs font-bold text-[#000000] flex items-center gap-1.5">
                          <span>Resend API</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">แนะนำมากที่สุด</span>
                        </div>
                        <p className="text-[11px] text-[#615d59] mt-0.5 leading-snug">
                          ส่งผ่าน HTTPS พอร์ต 443 <strong>ไม่ถูกบล็อกพอร์ตบน Render 100%</strong> ฟรี 3,000 ฉบับ/เดือน สมัครง่ายใน 1 นาที
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSmtpConfig({ ...smtpConfig, provider: 'smtp' })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        smtpConfig.provider !== 'resend'
                          ? 'bg-blue-50/70 border-[#0075de] ring-1 ring-[#0075de]'
                          : 'bg-white border-[#e6e6e6] hover:bg-[#f6f5f4]'
                      }`}
                    >
                      <Mail className={`w-4 h-4 shrink-0 mt-0.5 ${smtpConfig.provider !== 'resend' ? 'text-[#0075de]' : 'text-[#a39e98]'}`} />
                      <div>
                        <div className="text-xs font-bold text-[#000000]">Gmail / Custom SMTP</div>
                        <p className="text-[11px] text-[#615d59] mt-0.5 leading-snug">
                          ใช้พอร์ต 465/587 (หมายเหตุ: Render Free บล็อกพอร์ต SMTP ขาออก ต้องใช้แพ็กเกจ Starter)
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {smtpConfig.provider === 'resend' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Resend Fields */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#000000] flex items-center justify-between">
                          <span>Resend API Key *</span>
                          <a
                            href="https://resend.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#0075de] hover:underline flex items-center gap-0.5"
                          >
                            <span>รับ API Key ฟรีที่ resend.com</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            value={smtpConfig.resendApiKey || ''}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, resendApiKey: e.target.value })}
                            placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                            className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#000000]">
                          ชื่อผู้ส่งที่แสดง (Sender Name)
                        </label>
                        <input
                          type="text"
                          value={smtpConfig.fromName}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                          placeholder="เช่น pleng.online 🎧"
                          className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all"
                        />
                      </div>
                    </div>

                    {/* Resend Quick Guide */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 border border-blue-200/60 text-xs text-blue-900 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-blue-800">
                        <Sparkles className="w-4 h-4 shrink-0 text-blue-600" />
                        <span>วิธีสมัครใช้งาน Resend ฟรี (30 วินาที):</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-blue-800/90 leading-relaxed">
                        <li>ไปที่ <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#0075de]">resend.com</a> แล้วกด Log in ด้วย Google</li>
                        <li>คลิกเมนู <strong>API Keys</strong> &rarr; กดปุ่ม <strong>Create API Key</strong></li>
                        <li>ก๊อปปี้คีย์ที่ขึ้นต้นด้วย <code>re_...</code> นำมากรอกในช่องด้านซ้าย</li>
                        <li>กดบันทึก แล้วกดทดสอบส่งเมลได้ทันที 100% ฟรี 3,000 ฉบับ/เดือน</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Standard SMTP Fields */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#000000]">
                          SMTP Host / Server
                        </label>
                        <div className="relative">
                          <Server className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={smtpConfig.host}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                            placeholder="เช่น smtp.gmail.com หรือ smtp-relay.brevo.com"
                            className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-[#000000]">
                            พอร์ต (Port)
                          </label>
                          <input
                            type="number"
                            value={smtpConfig.port}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value, 10) || 587 })}
                            placeholder="465 หรือ 587"
                            className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                          />
                        </div>

                        <div className="flex flex-col justify-end pb-1.5">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#31302e]">
                            <input
                              type="checkbox"
                              checked={smtpConfig.secure}
                              onChange={(e) => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                              className="rounded border-[#e6e6e6] text-[#0075de] focus:ring-[#0075de] cursor-pointer"
                            />
                            <span>SSL/TLS (ปกติพอร์ต 465)</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#000000]">
                          SMTP Username / Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={smtpConfig.user}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                            placeholder="เช่น your-email@gmail.com หรือ admin@pleng.online"
                            className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#000000] flex items-center justify-between">
                          <span>SMTP Password / App Password</span>
                          {smtpHasPass && (
                            <span className="text-[10px] text-emerald-600 font-normal">
                              ✓ มีรหัสผ่านบันทึกไว้แล้ว (เว้นว่างเพื่อคงรหัสเดิม)
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={smtpShowPass ? 'text' : 'password'}
                            value={smtpConfig.pass}
                            onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                            placeholder={smtpHasPass ? '•••••••••••••••• (เว้นว่างไว้เพื่อคงรหัสเดิม)' : 'กรอกรหัสผ่าน SMTP หรือ App Password 16 หลัก'}
                            className="w-full pl-9 pr-10 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setSmtpShowPass(!smtpShowPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a39e98] hover:text-[#000000]"
                          >
                            {smtpShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Sender Branding & Guidance */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#000000]">
                          ชื่อผู้ส่งที่แสดง (Sender Name)
                        </label>
                        <input
                          type="text"
                          value={smtpConfig.fromName}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                          placeholder="เช่น pleng.online 🎧"
                          className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#000000]">
                          อีเมลผู้ส่ง (Sender Email Address)
                        </label>
                        <input
                          type="email"
                          value={smtpConfig.fromEmail}
                          onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                          placeholder="เช่น admin@pleng.online หรือ your-gmail@gmail.com"
                          className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-mono"
                        />
                      </div>

                      {/* Quick Guide Card */}
                      <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/60 text-xs text-blue-900 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-blue-800">
                          <HelpCircle className="w-4 h-4 shrink-0 text-blue-600" />
                          <span>คำแนะนำการใช้ Gmail SMTP:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-800/90">
                          <li>เข้าหน้า Google Account &gt; ความปลอดภัย (Security)</li>
                          <li>เปิดการยืนยันแบบ 2 ขั้นตอน (2-Step Verification)</li>
                          <li>ค้นหา &quot;รหัสผ่านสำหรับแอป&quot; (App Passwords)</li>
                          <li>สร้างรหัสใหม่ 16 ตัว แล้วนำมากรอกในช่อง Password ด้านซ้าย</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-[#e6e6e6] flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={smtpSaving}
                    className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#0075de] to-[#005fb8] hover:from-[#0065c0] hover:to-[#004f9e] text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{smtpSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า SMTP (Save Settings)'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Test Email Delivery Card */}
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-[#e6e6e6] pb-3">
                <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#0075de]" />
                  <span>ทดสอบระบบส่งอีเมล (Test Email Delivery / SMTP)</span>
                </h3>
                <p className="text-xs text-[#615d59] mt-0.5">
                  ทดสอบส่งอีเมลยืนยันการเชื่อมต่อไปยังกล่องจดหมายของคุณ เพื่อตรวจสอบว่า SMTP ทำงานได้จริงก่อนเปิดให้สมาชิกใช้งาน
                </p>
              </div>

              <form onSubmit={handleTestSmtp} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={smtpTestEmail}
                    onChange={(e) => setSmtpTestEmail(e.target.value)}
                    placeholder="กรอกอีเมลของคุณเพื่อรับเมลทดสอบ เช่น your-email@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={smtpTesting || !smtpTestEmail.trim()}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{smtpTesting ? 'กำลังทดสอบส่งเมล...' : 'ส่งอีเมลทดสอบทันที (Send Test)'}</span>
                </button>
              </form>

              {smtpTestResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                    smtpTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {smtpTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{smtpTestResult.success ? 'สำเร็จ!' : 'ทดสอบไม่สำเร็จ:'}</p>
                    <p className="mt-0.5 font-mono text-[11px] break-all">{smtpTestResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Email & OTP Activity Logs Card */}
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#e6e6e6] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>ประวัติการส่งอีเมล &amp; รหัส OTP ล่าสุด (Recent Email &amp; OTP Logs)</span>
                  </h3>
                  <p className="text-xs text-[#615d59] mt-0.5">
                    แอดมินสามารถดูรหัส OTP ของผู้ใช้ได้ที่นี่ทันที ป้องกันกรณีผู้ใช้พิมพ์อีเมลผิดหรือเมลติด Spam
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchEmailLogs}
                  className="px-3 py-1.5 rounded-lg border border-[#e6e6e6] hover:bg-[#f6f5f4] text-xs font-semibold text-[#615d59] hover:text-[#000000] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเฟรช Log</span>
                </button>
              </div>

              {emailLogs.length === 0 ? (
                <div className="text-center py-8 text-[#a39e98] text-xs">
                  ยังไม่มีประวัติการส่งอีเมลหรือขอรหัส OTP ในรอบนี้
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#e6e6e6] text-[#615d59] text-[11px] font-semibold uppercase">
                        <th className="pb-2.5 font-medium">เวลา (Timestamp)</th>
                        <th className="pb-2.5 font-medium">ประเภทรายการ</th>
                        <th className="pb-2.5 font-medium">อีเมลปลายทาง</th>
                        <th className="pb-2.5 font-medium">รหัส OTP 6 หลัก</th>
                        <th className="pb-2.5 font-medium">สถานะการส่ง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0efee]">
                      {emailLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#fcfbf9] transition-colors">
                          <td className="py-3 text-[#615d59] whitespace-nowrap font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                          </td>
                          <td className="py-3 font-medium text-[#000000]">
                            {log.type === 'register_otp' && '📝 สมัครสมาชิก (OTP)'}
                            {log.type === 'reset_password_otp' && '🔐 ลืมรหัสผ่าน (OTP)'}
                            {log.type === 'test' && '🧪 ทดสอบระบบส่งเมล'}
                          </td>
                          <td className="py-3 font-mono text-[#0075de]">{log.email}</td>
                          <td className="py-3">
                            {log.code ? (
                              <div className="inline-flex items-center gap-1.5 bg-[#f6f5f4] px-2 py-0.5 rounded-md border border-[#e6e6e6]">
                                <span className="font-mono font-bold text-xs text-[#000000] tracking-wider">
                                  {log.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(log.id, log.code!)}
                                  className="text-[#a39e98] hover:text-[#0075de] cursor-pointer"
                                  title="คัดลอกรหัส OTP"
                                >
                                  {copiedLogId === log.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#a39e98]">-</span>
                            )}
                          </td>
                          <td className="py-3">
                            {log.status === 'sent_smtp' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>ส่งผ่าน SMTP สำเร็จ</span>
                              </span>
                            )}
                            {log.status === 'console_fallback' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                                <AlertCircle className="w-3 h-3" />
                                <span>โหมดจำลอง (Console Log)</span>
                              </span>
                            )}
                            {log.status === 'failed' && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200"
                                title={log.errorMessage}
                              >
                                <AlertCircle className="w-3 h-3" />
                                <span>ส่งไม่สำเร็จ: {log.errorMessage?.substring(0, 20)}...</span>
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

        {/* TAB 1.7: SUPABASE DATABASE PERSISTENCE */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* Status & Intro Card */}
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e6e6e6] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#0075de]" />
                    <span>จัดการฐานข้อมูลคลาวด์ถาวร (Supabase Cloud Database)</span>
                  </h2>
                  <p className="text-xs text-[#615d59] mt-1">
                    เชื่อมต่อฐานข้อมูล Supabase เพื่อจัดเก็บข้อมูลสมาชิก, รหัสผ่าน, ห้องปาร์ตี้ และตั๋วซัพพอร์ตไว้บน Cloud อย่างถาวร ข้อมูลจะไม่สูญหายเมื่อมีการ Deploy ใหม่
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#615d59] font-medium">สถานะคลาวด์:</span>
                  {supabaseStatus.connected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      เชื่อมต่อสำเร็จ (ข้อมูลปลอดภัย 100%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {supabaseStatus.configured ? 'พบปัญหาการเชื่อมต่อ' : 'ยังไม่ได้เชื่อมต่อ (Local Disk)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Message Box */}
              <div className="mt-4 p-4 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Server className="w-4 h-4 text-[#0075de] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-[#000000]">รายละเอียดการเชื่อมต่อ:</p>
                    <p className="text-xs text-[#615d59] mt-0.5">{supabaseStatus.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchSupabaseStatus}
                    className="px-3 py-2 rounded-xl border border-[#e6e6e6] hover:bg-white text-xs font-semibold text-[#615d59] hover:text-[#000000] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ตรวจสอบใหม่</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTriggerSupabaseSync}
                    disabled={isSyncingSupabase}
                    className="px-4 py-2 rounded-xl bg-[#0075de] hover:bg-[#005bab] text-white font-semibold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSyncingSupabase ? 'กำลังซิงก์...' : 'ซิงก์ข้อมูลขึ้น Cloud ทันที'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Setup Guide Card */}
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-[#e6e6e6] pb-3">
                <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#dd5b00]" />
                  <span>คู่มือการเชื่อมต่อ Supabase ฟรี (2 ขั้นตอนง่ายๆ)</span>
                </h3>
                <p className="text-xs text-[#615d59] mt-0.5">
                  ทำตามขั้นตอนนี้เพียงครั้งเดียว ข้อมูลสมาชิกของคุณจะถูกเก็บไว้บน Cloud ตลอดไป แม้ Render จะ Deploy หรือรีสตาร์ทใหม่
                </p>
              </div>

              {/* Step 1: SQL Schema */}
              <div className="p-4 rounded-xl bg-[#fcfbf9] border border-[#e6e6e6] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0075de] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-bold text-[#000000]">
                      สร้างตาราง app_storage ใน Supabase Dashboard
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = `CREATE TABLE IF NOT EXISTS public.app_storage (\n  key TEXT PRIMARY KEY,\n  data JSONB NOT NULL,\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nALTER TABLE public.app_storage ENABLE ROW LEVEL SECURITY;\n\nDROP POLICY IF EXISTS "Allow public and service access to app_storage" ON public.app_storage;\nCREATE POLICY "Allow public and service access to app_storage"\n  ON public.app_storage FOR ALL\n  USING (true)\n  WITH CHECK (true);`;
                      navigator.clipboard.writeText(sql);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2500);
                      onShowToast('คัดลอกคำสั่ง SQL เรียบร้อยแล้ว 📋', 'success');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#e6e6e6] hover:border-[#0075de] text-xs font-semibold text-[#0075de] inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'คัดลอกแล้ว!' : 'คัดลอก SQL'}</span>
                  </button>
                </div>

                <p className="text-xs text-[#615d59] pl-8">
                  ไปที่เว็บ <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#0075de] font-semibold underline">Supabase Dashboard</a> &rarr; เข้าโปรเจกต์ของคุณ &rarr; เมนู <strong>SQL Editor</strong> &rarr; กด <strong>New query</strong> &rarr; วางคำสั่งด้านล่างนี้แล้วกด <strong>Run</strong>:
                </p>

                <pre className="ml-8 p-3 rounded-xl bg-[#171824] text-emerald-300 font-mono text-[11px] overflow-x-auto border border-gray-800">
{`CREATE TABLE IF NOT EXISTS public.app_storage (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_storage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public and service access to app_storage" ON public.app_storage;
CREATE POLICY "Allow public and service access to app_storage"
  ON public.app_storage FOR ALL
  USING (true)
  WITH CHECK (true);`}
                </pre>
              </div>

              {/* Step 2: Environment Variables */}
              <div className="p-4 rounded-xl bg-[#fcfbf9] border border-[#e6e6e6] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0075de] text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs font-bold text-[#000000]">
                    ใส่ค่า Environment Variables ใน Render.com Dashboard
                  </span>
                </div>

                <p className="text-xs text-[#615d59] pl-8">
                  ไปที่ <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-[#0075de] font-semibold underline">Render.com Dashboard</a> &rarr; เข้า Web Service ของคุณ &rarr; เมนู <strong>Environment</strong> &rarr; กด <strong>Add Environment Variable</strong> เพื่อเพิ่ม 2 ตัวแปรนี้:
                </p>

                <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-[#e6e6e6]">
                    <span className="text-[10px] text-[#615d59] uppercase font-bold tracking-wider">Key ชื่อ:</span>
                    <p className="font-mono text-xs font-bold text-[#0075de] select-all">SUPABASE_URL</p>
                    <p className="text-[11px] text-[#a39e98] mt-1">Project URL เช่น https://xxxxxxxx.supabase.co</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#e6e6e6]">
                    <span className="text-[10px] text-[#615d59] uppercase font-bold tracking-wider">Key ชื่อ:</span>
                    <p className="font-mono text-xs font-bold text-[#0075de] select-all">SUPABASE_KEY</p>
                    <p className="text-[11px] text-[#a39e98] mt-1">anon public key หรือ service_role secret key</p>
                  </div>
                </div>

                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl ml-8">
                  💡 <strong>หลังจากกด Save Changes บน Render:</strong> เซิร์ฟเวอร์จะเชื่อมต่อกับ Supabase ทันที และจะทำการบันทึกข้อมูลสมาชิกทุกคนขึ้น Cloud โดยอัตโนมัติทุกครั้งที่มีการสมัครหรือใช้งานครับ!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1.8: DEPLOYMENT STATUS & RENDER UPDATE */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            {/* Header Status Card */}
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e6e6e6] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0075de]/10 text-[#0075de] flex items-center justify-center shrink-0 border border-[#0075de]/20">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                      <span>สถานะการ Deploy &amp; อัปเดตเว็บไซต์ (Render Deployment)</span>
                    </h2>
                    <p className="text-xs text-[#615d59] mt-0.5">
                      ตรวจสอบเวอร์ชัน ตรวจสอบเวลาที่บิลด์ล่าสุด และสั่งให้เซิร์ฟเวอร์ Render ทำการ Deploy โค้ดล่าสุดได้ทันทีจากที่นี่
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-[#615d59] font-medium">สถานะ:</span>
                  {deployCountdown !== null ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-xs font-semibold animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      กำลังบิลด์บน Render ({deployCountdown}s)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      พร้อมใช้งาน (Online)
                    </span>
                  )}
                </div>
              </div>

              {/* Version Mismatch Warning */}
              {serverVersion && serverVersion.gitCommit && serverVersion.gitCommit !== __APP_COMMIT_HASH__ && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>มีโค้ดเวอร์ชันใหม่บนเซิร์ฟเวอร์!</strong> (Server: <code className="font-mono">{serverVersion.gitCommit}</code> / Page: <code className="font-mono">{__APP_COMMIT_HASH__}</code>) กรุณากดปุ่มรีเฟรชหน้าเว็บเพื่อดึงไฟล์ล่าสุด
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 cursor-pointer shadow-2xs"
                  >
                    รีเฟรชตอนนี้
                  </button>
                </div>
              )}

              {/* Active Deployment Progress Box */}
              {deployCountdown !== null && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800">
                          กำลังส่งคำสั่ง &amp; บิลด์ระบบใหม่บน Render.com...
                        </p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          เซิร์ฟเวอร์กำลังดึงโค้ดล่าสุดจาก GitHub มาคอมไพล์ใหม่ (เหลือเวลารอโดยประมาณ <strong>{deployCountdown} วินาที</strong>)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs shrink-0"
                    >
                      รีโหลดหน้าเว็บทันที
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-emerald-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${Math.min(100, Math.max(5, ((120 - deployCountdown) / 120) * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Version & Build Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                  <span className="text-[10px] text-[#615d59] uppercase font-bold tracking-wider">วันและเวลาที่ Deploy ล่าสุด</span>
                  <p className="text-sm font-bold text-[#000000] mt-1">
                    {formatDeployDateTime(__APP_BUILD_TIME__)}
                  </p>
                  <p className="text-[11px] text-[#0075de] font-semibold mt-0.5">
                    {formatRelativeTime(__APP_BUILD_TIME__)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                  <span className="text-[10px] text-[#615d59] uppercase font-bold tracking-wider">รหัส Git Commit</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-0.5 rounded-md bg-white border border-[#e6e6e6] text-[#0075de] font-mono text-xs font-bold">
                      {__APP_COMMIT_HASH__}
                    </code>
                    <span className="text-[11px] text-[#615d59]">(main branch)</span>
                  </div>
                  <p className="text-[11px] text-[#8c8780] mt-1">
                    ซิงก์ตรงกับ statusstudio/watchparty
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6]">
                  <span className="text-[10px] text-[#615d59] uppercase font-bold tracking-wider">เซิร์ฟเวอร์เริ่มทำงาน (Boot Time)</span>
                  <p className="text-sm font-bold text-[#000000] mt-1">
                    {serverVersion?.bootTime ? formatDeployDateTime(serverVersion.bootTime) : 'กำลังตรวจสอบ...'}
                  </p>
                  <p className="text-[11px] text-[#8c8780] mt-0.5">
                    Env: <strong className="text-[#31302e]">{serverVersion?.environment || 'production'}</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="pt-2 border-t border-[#e6e6e6] flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleTriggerRedeploy}
                  disabled={triggeringDeploy || deployCountdown !== null}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  title="สั่งให้ Render เริ่ม Deploy โค้ดล่าสุดทันที"
                >
                  <Rocket className={`w-4 h-4 ${triggeringDeploy ? 'animate-spin' : ''}`} />
                  <span>
                    {triggeringDeploy
                      ? 'กำลังส่งคำสั่งไปยัง Render...'
                      : deployCountdown !== null
                      ? `กำลังดำเนินการ Deploy (${deployCountdown}s)...`
                      : '🚀 สั่ง Deploy เว็บไซต์เดี๋ยวนี้ (Trigger Deploy)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loadAllData();
                    onShowToast('ตรวจสอบเวอร์ชันล่าสุดเรียบร้อย', 'info');
                  }}
                  disabled={loading}
                  className="py-2.5 px-4 rounded-xl bg-white hover:bg-[#f6f5f4] text-[#31302e] border border-[#e6e6e6] font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="ดึงข้อมูลสถานะเวอร์ชันล่าสุด"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0075de]' : ''}`} />
                  <span>ตรวจสอบเวอร์ชัน</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="รีโหลดหน้าเว็บเพื่อดึงโค้ดล่าสุด"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>รีเฟรชหน้าเว็บ</span>
                </button>
              </div>
            </div>

            {/* Architecture & Continuous Deployment Workflow */}
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-[#e6e6e6] pb-3">
                <h3 className="text-sm font-bold text-[#000000] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>การทำงานของระบบ Continuous Deployment (CI/CD)</span>
                </h3>
                <p className="text-xs text-[#615d59] mt-0.5">
                  ระบบถูกตั้งค่าให้อัปเดตและป้องกันข้อมูลสูญหายอัตโนมัติ 100%
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#fcfbf9] border border-[#e6e6e6] space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-500/20">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-[#000000]">GitHub Push &amp; Actions</h4>
                  <p className="text-[11px] text-[#615d59] leading-relaxed">
                    ทุกครั้งที่มีการแก้ไขและ Push โค้ดขึ้น GitHub ระบบ GitHub Actions จะตรวจจับและยิง Render Deploy Hook ให้อัตโนมัติทันที
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#fcfbf9] border border-[#e6e6e6] space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-[#000000]">Render Zero-Downtime Build</h4>
                  <p className="text-[11px] text-[#615d59] leading-relaxed">
                    Render จะดาวน์โหลดโค้ดมาคอมไพล์ในคอนเทนเนอร์ใหม่ (ประมาณ 2-3 นาที) โดยที่เว็บเก่ายังคงเปิดให้ผู้ใช้ฟังเพลงได้ตามปกติจนกว่าตัวใหม่จะพร้อม
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#fcfbf9] border border-[#e6e6e6] space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center justify-center border border-amber-500/20">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-[#000000]">Supabase Data Persistence</h4>
                  <p className="text-[11px] text-[#615d59] leading-relaxed">
                    ข้อมูลสมาชิก รหัสผ่าน ห้องปาร์ตี้ และตั๋วซัพพอร์ตทั้งหมดจะถูกซิงก์เก็บไว้ที่ Supabase Cloud ถาวร เมื่อคอนเทนเนอร์ใหม่เริ่มทำงานจะโหลดข้อมูลกลับมาทันที
                  </p>
                </div>
              </div>
            </div>
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
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-5">
            {/* Header & Add User Button */}
            <div className="border-b border-[#e6e6e6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0075de]" />
                  <span>จัดการสมาชิก ({users.length} คน)</span>
                </h2>
                <p className="text-xs text-[#615d59] mt-0.5">
                  เพิ่ม ลบ แก้ไขข้อมูลสมาชิก และตั้งรหัสผ่านใหม่ให้กับผู้ใช้งานในระบบ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchUsers}
                  className="p-2.5 rounded-xl border border-[#e6e6e6] hover:bg-[#f6f5f4] text-[#615d59] hover:text-[#000000] transition-colors cursor-pointer"
                  title="รีเฟรชรายชื่อ"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0075de] to-[#005fb8] hover:from-[#0065c0] hover:to-[#004f9e] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>เพิ่มสมาชิกใหม่</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="ค้นหาชื่อผู้ใช้, อีเมล หรือ ID..."
                  className="w-full pl-9 pr-8 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all"
                />
                {userSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setUserSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a39e98] hover:text-[#000000]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-[#f6f5f4] p-1 rounded-xl border border-[#e6e6e6] overflow-x-auto text-[11px]">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    userRoleFilter === 'all'
                      ? 'bg-white text-[#0075de] shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000]'
                  }`}
                >
                  ทั้งหมด ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('member')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    userRoleFilter === 'member'
                      ? 'bg-white text-[#0075de] shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000]'
                  }`}
                >
                  สมาชิก ({users.filter((u) => !u.isSuperAdmin && !u.isSuspended).length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('admin')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    userRoleFilter === 'admin'
                      ? 'bg-white text-amber-600 shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000]'
                  }`}
                >
                  👑 แอดมิน ({users.filter((u) => u.isSuperAdmin).length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('suspended')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    userRoleFilter === 'suspended'
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-[#615d59] hover:text-[#000000]'
                  }`}
                >
                  ระงับ ({users.filter((u) => u.isSuspended).length})
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-[#e6e6e6] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f6f5f4] border-b border-[#e6e6e6] text-[#615d59] text-[11px] font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">ผู้ใช้งาน (User)</th>
                    <th className="py-2.5 px-3">อีเมล (Email)</th>
                    <th className="py-2.5 px-3">สิทธิ์ (Role)</th>
                    <th className="py-2.5 px-3">สถานะ</th>
                    <th className="py-2.5 px-3 text-right">เครื่องมือจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e6e6]">
                  {users
                    .filter((u) => {
                      const q = userSearchQuery.trim().toLowerCase();
                      const matchQuery =
                        !q ||
                        u.name.toLowerCase().includes(q) ||
                        (u.email && u.email.toLowerCase().includes(q)) ||
                        u.id.toLowerCase().includes(q);

                      if (!matchQuery) return false;
                      if (userRoleFilter === 'admin') return !!u.isSuperAdmin;
                      if (userRoleFilter === 'member') return !u.isSuperAdmin && !u.isSuspended;
                      if (userRoleFilter === 'suspended') return !!u.isSuspended;
                      return true;
                    })
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-[#f6f5f4]/50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8 h-8 rounded-full border border-[#e6e6e6] shrink-0 bg-white"
                            />
                            <div>
                              <p className="font-bold text-[#000000] flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.id === 'admin' && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-normal">
                                    หลัก
                                  </span>
                                )}
                              </p>
                              <span className="text-[10px] text-gray-400 font-mono block">{u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#615d59]">
                          {u.email || '-'}
                        </td>
                        <td className="py-3 px-3">
                          {u.isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                              👑 Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                              สมาชิกทั่วไป
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {u.isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                              ระงับการใช้งาน
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                              ใช้งานปกติ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg border border-[#e6e6e6] hover:bg-[#0075de]/10 hover:border-[#0075de]/30 text-[#615d59] hover:text-[#0075de] transition-colors cursor-pointer"
                              title="แก้ไขข้อมูล & เปลี่ยนรหัสผ่าน"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Suspend / Unsuspend */}
                            {u.id !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleSuspendUser(u.id, !!u.isSuspended, u.name)}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer border ${
                                  u.isSuspended
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                }`}
                                title={u.isSuspended ? 'ปลดการระงับ' : 'ระงับบัญชี'}
                              >
                                {u.isSuspended ? 'ปลดระงับ' : 'ระงับ'}
                              </button>
                            )}

                            {/* Delete User */}
                            {u.id !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => setDeletingUser(u)}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer"
                                title="ลบสมาชิกถาวร"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-xs">
                  ยังไม่มีสมาชิกในระบบ
                </div>
              )}
            </div>

            {/* MODAL 1: ADD NEW USER */}
            {isAddUserModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
                <div className="w-full max-w-md bg-white border border-[#e6e6e6] rounded-2xl shadow-notion-modal overflow-hidden">
                  <div className="p-5 border-b border-[#e6e6e6] flex items-center justify-between bg-[#fcfbf9]">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-[#0075de]" />
                      <h3 className="text-sm font-bold text-[#000000]">เพิ่มสมาชิกใหม่โดยแอดมิน</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddUserModalOpen(false)}
                      className="text-[#a39e98] hover:text-[#000000] p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateUser} className="p-5 space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#000000]">
                        ชื่อแสดง (Display Name) *
                      </label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="เช่น น้องเพลง หรือ DJ Max"
                        className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de]"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#000000]">
                        อีเมล (Email Address) *
                      </label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="เช่น member@pleng.online หรือ user@gmail.com"
                        className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#000000]">
                        รหัสผ่านเริ่มต้น (Password) *
                      </label>
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="ความยาวอย่างน้อย 6 ตัวอักษร"
                        className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] font-mono"
                        required
                      />
                    </div>

                    <div className="p-3 bg-[#f6f5f4] rounded-xl border border-[#e6e6e6] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#000000] block">ตั้งเป็น Super Admin</span>
                        <span className="text-[11px] text-[#615d59]">มอบสิทธิ์ผู้ดูแลระบบสูงสุด</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={newUserIsSuperAdmin}
                        onChange={(e) => setNewUserIsSuperAdmin(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#0075de] cursor-pointer"
                      />
                    </div>

                    <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddUserModalOpen(false)}
                        className="py-2.5 px-4 rounded-xl border border-[#e6e6e6] hover:bg-[#f6f5f4] text-xs font-semibold text-[#615d59] transition-colors cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={addingUser}
                        className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0075de] to-[#005fb8] hover:from-[#0065c0] hover:to-[#004f9e] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{addingUser ? 'กำลังสร้าง...' : 'สร้างบัญชีสมาชิก'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 2: EDIT USER */}
            {editingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
                <div className="w-full max-w-md bg-white border border-[#e6e6e6] rounded-2xl shadow-notion-modal overflow-hidden">
                  <div className="p-5 border-b border-[#e6e6e6] flex items-center justify-between bg-[#fcfbf9]">
                    <div className="flex items-center gap-2">
                      <Edit className="w-5 h-5 text-[#0075de]" />
                      <h3 className="text-sm font-bold text-[#000000]">แก้ไขข้อมูลสมาชิก: {editingUser.name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="text-[#a39e98] hover:text-[#000000] p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditUser} className="p-5 space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#000000]">
                        ชื่อแสดง (Display Name) *
                      </label>
                      <input
                        type="text"
                        value={editUserName}
                        onChange={(e) => setEditUserName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de]"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#000000]">
                        อีเมล (Email Address)
                      </label>
                      <input
                        type="email"
                        value={editUserEmail}
                        onChange={(e) => setEditUserEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#000000] flex items-center justify-between">
                        <span>ตั้งรหัสผ่านใหม่ (Reset Password)</span>
                        <span className="text-[10px] text-gray-400 font-normal">เว้นว่างไว้เพื่อคงรหัสผ่านเดิม</span>
                      </label>
                      <input
                        type="password"
                        value={editUserNewPassword}
                        onChange={(e) => setEditUserNewPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่านใหม่หากต้องการเปลี่ยน..."
                        className="w-full px-3.5 py-2.5 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] font-mono"
                      />
                    </div>

                    {editingUser.id !== 'admin' && (
                      <div className="space-y-2 pt-2 border-t border-[#e6e6e6]">
                        <label className="flex items-center justify-between p-3 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] cursor-pointer">
                          <div>
                            <span className="text-xs font-bold text-[#000000] block">สิทธิ์ Super Admin</span>
                            <span className="text-[11px] text-[#615d59]">ให้สิทธิ์จัดการระบบหลังบ้าน</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={editUserIsSuperAdmin}
                            onChange={(e) => setEditUserIsSuperAdmin(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#0075de] cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-xl bg-[#f6f5f4] border border-[#e6e6e6] cursor-pointer">
                          <div>
                            <span className="text-xs font-bold text-[#000000] block">ระงับการใช้งานบัญชี (Suspended)</span>
                            <span className="text-[11px] text-[#615d59]">ห้ามเข้าสู่ระบบและห้ามเข้าห้อง</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={editUserIsSuspended}
                            onChange={(e) => setEditUserIsSuspended(e.target.checked)}
                            className="w-4 h-4 rounded accent-rose-600 cursor-pointer"
                          />
                        </label>
                      </div>
                    )}

                    <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingUser(null)}
                        className="py-2.5 px-4 rounded-xl border border-[#e6e6e6] hover:bg-[#f6f5f4] text-xs font-semibold text-[#615d59] transition-colors cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={savingEditUser}
                        className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#0075de] to-[#005fb8] hover:from-[#0065c0] hover:to-[#004f9e] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingEditUser ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL 3: DELETE CONFIRMATION */}
            {deletingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
                <div className="w-full max-w-sm bg-white border border-[#e6e6e6] rounded-2xl shadow-notion-modal overflow-hidden p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#000000]">ยืนยันการลบสมาชิกถาวร</h3>
                    <p className="text-xs text-[#615d59] mt-1">
                      คุณต้องการลบบัญชีของ <strong>&quot;{deletingUser.name}&quot;</strong> ({deletingUser.email || deletingUser.id}) ออกจากระบบถาวรหรือไม่?
                    </p>
                    <p className="text-[11px] text-rose-600 mt-2">
                      * การลบจะไม่สามารถกู้คืนได้ และอีเมลนี้จะสามารถนำมาสมัครใหม่ได้
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeletingUser(null)}
                      className="py-2.5 px-4 rounded-xl border border-[#e6e6e6] hover:bg-[#f6f5f4] text-xs font-semibold text-[#615d59] transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingUser}
                      onClick={handleConfirmDeleteUser}
                      className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeletingUser ? 'กำลังลบ...' : 'ยืนยันลบสมาชิก'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ROOMS MANAGEMENT */}
        {activeTab === 'rooms' && (
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e6e6e6] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#0075de]" />
                  <span>จัดการห้องปาร์ตี้ทั้งหมด ({rooms.length} ห้อง)</span>
                </h2>
                <p className="text-xs text-[#615d59] mt-0.5">
                  ตรวจสอบความเรียบร้อยของห้องปาร์ตี้ สั่งปิดห้องที่ทำผิดกฎ หรือแอบเข้าตรวจสอบในโหมดล่องหน
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchRooms}
                  className="p-2 rounded-xl border border-[#e6e6e6] hover:bg-[#f6f5f4] text-xs font-semibold text-[#615d59] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="รีเฟรชข้อมูลห้อง"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">รีเฟรช</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder="ค้นหาห้องด้วยชื่อห้อง, รหัสห้อง, หรือชื่อเจ้าของห้อง..."
                  className="w-full pl-9 pr-3.5 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-all"
                />
              </div>
              <span className="text-xs text-[#615d59] font-medium">
                พบ{' '}
                {
                  rooms.filter((r) => {
                    const q = roomSearchQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      r.name?.toLowerCase().includes(q) ||
                      r.id?.toLowerCase().includes(q) ||
                      r.ownerName?.toLowerCase().includes(q) ||
                      r.currentVideo?.title?.toLowerCase().includes(q)
                    );
                  }).length
                }{' '}
                ห้อง
              </span>
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rooms
                .filter((r) => {
                  const q = roomSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    r.name?.toLowerCase().includes(q) ||
                    r.id?.toLowerCase().includes(q) ||
                    r.ownerName?.toLowerCase().includes(q) ||
                    r.currentVideo?.title?.toLowerCase().includes(q)
                  );
                })
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border border-[#e6e6e6] bg-[#fcfbf9] hover:border-[#0075de]/40 transition-all space-y-3.5 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-[#000000]">{r.name}</h3>
                            {r.isPrivate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                                <Lock className="w-3 h-3" />
                                <span>รหัส: {r.password || 'ล็อกรหัส'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                                🌐 สาธารณะ
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#615d59]">
                            เจ้าของห้อง: <span className="font-semibold text-[#000000]">{r.ownerName}</span> • รหัส:{' '}
                            <code className="text-[10px] px-1 py-0.2 rounded bg-gray-200/70 font-mono text-gray-700">
                              #{r.id}
                            </code>
                          </p>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{r.onlineCount} คนในห้อง</span>
                        </span>
                      </div>

                      {/* Description */}
                      {r.description && (
                        <p className="text-xs text-[#615d59] line-clamp-2 bg-white/70 p-2 rounded-xl border border-[#e6e6e6]">
                          {r.description}
                        </p>
                      )}

                      {/* Current Playing Song Card */}
                      {r.currentVideo?.title ? (
                        <div className="p-2.5 rounded-xl bg-white border border-[#e6e6e6] flex items-center gap-3">
                          <div className="w-14 h-10 rounded-lg bg-gray-900 overflow-hidden shrink-0 relative">
                            <img
                              src={`https://i.ytimg.com/vi/${r.currentVideo.videoId}/hqdefault.jpg`}
                              alt={r.currentVideo.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as any).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=120&q=80';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Music className="w-3.5 h-3.5 text-white drop-shadow" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-[#0075de] font-bold block uppercase tracking-wider">
                              กำลังเล่นสด (Now Playing)
                            </span>
                            <p className="text-xs font-bold text-[#000000] truncate">{r.currentVideo.title}</p>
                            {r.currentVideo.channel && (
                              <p className="text-[10px] text-[#615d59] truncate">{r.currentVideo.channel}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-white/50 border border-dashed border-[#e6e6e6] text-[11px] text-[#a39e98] flex items-center gap-2">
                          <Music className="w-3.5 h-3.5" />
                          <span>ห้องนี้ยังไม่มีการเปิดเพลงในขณะนี้</span>
                        </div>
                      )}

                      {/* Members List in room */}
                      {r.members && r.members.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-[#615d59] font-semibold block">ผู้ใช้งานที่อยู่ในห้อง:</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {r.members.slice(0, 6).map((name: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white border border-[#e6e6e6] text-[10px] text-[#31302e] font-medium"
                              >
                                {name}
                              </span>
                            ))}
                            {r.members.length > 6 && (
                              <span className="text-[10px] text-[#615d59] px-1 font-semibold">
                                +{r.members.length - 6} คน
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Widgets Info */}
                      <div className="flex items-center gap-3 text-[11px] text-[#615d59] pt-1">
                        <span>🎙️ เวทีไมค์: {r.widgets?.enableVoiceStage !== false ? 'เปิด' : 'ปิด'}</span>
                        <span>•</span>
                        <span>💬 แชท: {r.widgets?.enableChat !== false ? 'เปิด' : 'ปิด'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-[#e6e6e6] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Stealth Inspection Button */}
                        <button
                          type="button"
                          onClick={() => onJoinRoom?.(r.id, true)}
                          className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer group"
                          title="แอบเข้าตรวจสอบห้องแบบล่องหน 100% สมาชิกในห้องจะไม่รู้ตัว"
                        >
                          <Ghost className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span>แอบเข้าตรวจสอบ (ล่องหน)</span>
                        </button>

                        {/* Normal Join Button */}
                        <button
                          type="button"
                          onClick={() => onJoinRoom?.(r.id, false)}
                          className="py-1.5 px-3 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] text-xs font-semibold text-[#000000] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title="เข้าห้องแบบเปิดเผยตัวตนตามปกติ"
                        >
                          <Headphones className="w-3.5 h-3.5 text-[#0075de]" />
                          <span>เข้าตามปกติ</span>
                        </button>
                      </div>

                      {/* Force Close Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setClosingRoom(r);
                          setCloseRoomReason('');
                        }}
                        className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                        title="สั่งปิดห้องทันที"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>สั่งปิดห้อง</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <Radio className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-xs font-semibold">ยังไม่มีห้องปาร์ตี้ที่เปิดใช้งานอยู่ในขณะนี้</p>
              </div>
            )}

            {/* MODAL: FORCE CLOSE ROOM CONFIRMATION */}
            {closingRoom && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
                <div className="w-full max-w-md bg-white border border-[#e6e6e6] rounded-2xl shadow-notion-modal overflow-hidden">
                  <div className="p-5 border-b border-[#e6e6e6] flex items-center justify-between bg-rose-50/50">
                    <div className="flex items-center gap-2 text-rose-700">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <h3 className="text-sm font-bold">ยืนยันการสั่งปิดห้องทันที</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClosingRoom(null)}
                      className="text-[#a39e98] hover:text-[#000000] p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleForceCloseRoom();
                    }}
                    className="p-5 space-y-4"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-[#31302e]">
                        คุณกำลังจะสั่งปิดห้อง <strong>&quot;{closingRoom.name}&quot;</strong> (รหัส: #{closingRoom.id})
                      </p>
                      <p className="text-[11px] text-[#615d59]">
                        * สมาชิกทุกคนในห้องจะถูกนำออกจากห้องทันที และห้องจะถูกลบออกจากสารบบ
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#000000]">
                        ระบุเหตุผลในการสั่งปิดห้อง (แสดงให้ผู้ใช้ทุกคนในห้องทราบ)
                      </label>
                      <textarea
                        value={closeRoomReason}
                        onChange={(e) => setCloseRoomReason(e.target.value)}
                        placeholder="เช่น ห้องนี้เปิดเนื้อหาที่มีลิขสิทธิ์หรือผิดกฎชุมชน จึงถูกปิดโดยผู้ดูแลระบบ"
                        rows={3}
                        className="w-full p-3 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-rose-500"
                        autoFocus
                      />
                    </div>

                    <div className="pt-3 border-t border-[#e6e6e6] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setClosingRoom(null)}
                        className="py-2 px-4 rounded-xl border border-[#e6e6e6] hover:bg-[#f6f5f4] text-xs font-semibold text-[#615d59] transition-colors cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={isClosingRoom}
                        className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isClosingRoom ? 'กำลังสั่งปิดห้อง...' : 'ยืนยันสั่งปิดห้องทันที'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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
            <div className="border-b border-[#e6e6e6] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#000000] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#0075de]" />
                  <span>ศูนย์แจ้งปัญหาและข้อเสนอแนะ ({tickets.length})</span>
                </h2>
                <p className="text-xs text-[#615d59] mt-0.5">
                  อ่านข้อความแจ้งปัญหา ตอบกลับผู้ใช้งาน และเปลี่ยนสถานะเพื่อแจ้งผลการแก้ไข (ระบบส่งอีเมลแจ้งเตือนผู้ใช้ทันที)
                </p>
              </div>

              <button
                type="button"
                onClick={fetchTickets}
                className="px-3 py-1.5 rounded-xl border border-[#e6e6e6] hover:bg-[#f6f5f4] text-xs font-semibold text-[#615d59] flex items-center gap-1.5 self-start cursor-pointer transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>รีเฟรชคำร้อง</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
              {/* Left Column: Tickets List */}
              <div className="lg:col-span-5 flex flex-col space-y-3">
                {/* Search & Filter */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#a39e98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ticketSearchQuery}
                    onChange={(e) => setTicketSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อผู้แจ้ง, อีเมล หรือหัวข้อ..."
                    className="w-full pl-9 pr-3.5 py-2 bg-[#f6f5f4] focus:bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1 bg-[#f6f5f4] p-1 rounded-xl border border-[#e6e6e6] text-xs">
                  <button
                    type="button"
                    onClick={() => setTicketStatusFilter('all')}
                    className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[11px] ${
                      ticketStatusFilter === 'all'
                        ? 'bg-white text-[#0075de] font-bold shadow-xs'
                        : 'text-[#615d59] hover:text-[#000000]'
                    }`}
                  >
                    ทั้งหมด ({tickets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketStatusFilter('pending')}
                    className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[11px] ${
                      ticketStatusFilter === 'pending'
                        ? 'bg-white text-amber-600 font-bold shadow-xs'
                        : 'text-[#615d59] hover:text-[#000000]'
                    }`}
                  >
                    รอดำเนินการ ({tickets.filter((t) => t.status === 'pending').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketStatusFilter('in_progress')}
                    className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[11px] ${
                      ticketStatusFilter === 'in_progress'
                        ? 'bg-white text-[#0075de] font-bold shadow-xs'
                        : 'text-[#615d59] hover:text-[#000000]'
                    }`}
                  >
                    ตรวจ ({tickets.filter((t) => t.status === 'in_progress').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketStatusFilter('resolved')}
                    className={`flex-1 py-1 px-1.5 rounded-lg font-medium transition-all cursor-pointer text-center text-[11px] ${
                      ticketStatusFilter === 'resolved'
                        ? 'bg-white text-emerald-600 font-bold shadow-xs'
                        : 'text-[#615d59] hover:text-[#000000]'
                    }`}
                  >
                    เสร็จ ({tickets.filter((t) => t.status === 'resolved').length})
                  </button>
                </div>

                {/* Tickets Items */}
                <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                  {filteredTickets.length === 0 ? (
                    <div className="text-center py-10 px-4 border border-dashed border-[#e6e6e6] rounded-xl bg-[#f6f5f4] text-xs text-[#615d59]">
                      ไม่พบคำร้องที่ตรงกับเงื่อนไข
                    </div>
                  ) : (
                    filteredTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                          selectedTicket?.id === t.id
                            ? 'border-[#0075de] bg-[#0075de]/5 ring-1 ring-[#0075de]'
                            : 'border-[#e6e6e6] bg-[#f6f5f4] hover:bg-white hover:border-[#0075de]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="text-xs font-bold text-[#000000] truncate">
                            {t.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              t.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : t.status === 'in_progress'
                                ? 'bg-[#0075de]/10 text-[#0075de] border border-[#0075de]/20'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}
                          >
                            {t.status === 'resolved'
                              ? 'เสร็จสิ้น'
                              : t.status === 'in_progress'
                              ? 'กำลังตรวจ'
                              : 'รอดำเนินการ'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#615d59] line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[#a39e98] mt-2 pt-1.5 border-t border-[#e6e6e6]/60">
                          <span className="truncate">โดย: <strong>{t.userName}</strong></span>
                          <span>{new Date(t.updatedAt).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Ticket Detail, Messages & Action Center */}
              <div className="lg:col-span-7 flex flex-col bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl p-4 shadow-xs">
                {selectedTicket ? (
                  <div className="flex flex-col h-full space-y-3">
                    {/* Header */}
                    <div className="p-3 bg-white rounded-xl border border-[#e6e6e6] space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#000000]">{selectedTicket.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-[#615d59] mt-0.5">
                            <span>ผู้แจ้ง: <strong>{selectedTicket.userName}</strong></span>
                            {selectedTicket.userEmail ? (
                              <span className="inline-flex items-center gap-1 text-[#0075de] font-mono">
                                <Mail className="w-3 h-3" /> {selectedTicket.userEmail}
                              </span>
                            ) : (
                              <span className="text-gray-400">(ไม่มีอีเมล)</span>
                            )}
                          </div>
                        </div>

                        {/* Quick Status Dropdown */}
                        <div className="shrink-0">
                          <select
                            value={selectedTicket.status}
                            disabled={updatingTicketStatus}
                            onChange={(e) =>
                              handleUpdateTicketStatus(
                                selectedTicket.id,
                                e.target.value as TicketStatus
                              )
                            }
                            className="px-2.5 py-1.5 bg-white border border-[#e6e6e6] rounded-xl text-xs font-bold text-[#000000] focus:outline-none focus:border-[#0075de] cursor-pointer shadow-xs"
                          >
                            <option value="pending">⏳ รอดำเนินการ (Pending)</option>
                            <option value="in_progress">🔍 กำลังตรวจสอบ (In Progress)</option>
                            <option value="resolved">✅ แก้ไขเสร็จสิ้น (Resolved)</option>
                          </select>
                        </div>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e6e6e6]">
                        <span className="text-[11px] text-[#615d59] font-medium">เปลี่ยนสถานะด่วน:</span>
                        <button
                          type="button"
                          disabled={updatingTicketStatus || selectedTicket.status === 'resolved'}
                          onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>แจ้งว่าแก้ไขเสร็จแล้ว ✅</span>
                        </button>
                        <button
                          type="button"
                          disabled={updatingTicketStatus || selectedTicket.status === 'in_progress'}
                          onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'in_progress')}
                          className="px-2.5 py-1 rounded-lg bg-[#0075de]/10 hover:bg-[#0075de]/20 text-[#0075de] border border-[#0075de]/20 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#0075de]" />
                          <span>กำลังตรวจสอบ</span>
                        </button>
                        <button
                          type="button"
                          disabled={updatingTicketStatus || selectedTicket.status === 'pending'}
                          onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'pending')}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>รอดำเนินการ</span>
                        </button>
                      </div>
                    </div>

                    {/* Chat & Thread Messages */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 p-3 bg-white rounded-xl border border-[#e6e6e6] min-h-[220px] max-h-[320px]">
                      {selectedTicket.messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                            msg.isSuperAdmin
                              ? 'ml-auto bg-[#0075de]/10 border border-[#0075de]/20 text-[#000000] rounded-tr-sm'
                              : 'mr-auto bg-[#f6f5f4] border border-[#e6e6e6] text-[#31302e] rounded-tl-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 font-bold text-[10px] text-[#615d59] mb-1">
                            <span className="flex items-center gap-1">
                              {msg.senderName}
                              {msg.isSuperAdmin && (
                                <Crown className="w-3 h-3 text-amber-500 fill-current" />
                              )}
                            </span>
                            <span className="font-normal text-gray-400">
                              {new Date(msg.timestamp).toLocaleTimeString('th-TH', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reply Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendAdminReply(selectedTicket.id);
                      }}
                      className="space-y-2"
                    >
                      {selectedTicket.userEmail && (
                        <p className="text-[11px] text-[#615d59] flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#0075de]" />
                          <span>
                            ระบบจะส่งอีเมลแจ้งเตือนไปยัง <strong>{selectedTicket.userEmail}</strong> อัตโนมัติเมื่อตอบกลับ
                          </span>
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          placeholder="พิมพ์ข้อความตอบกลับไปยังผู้แจ้งปัญหา..."
                          className="flex-1 px-3.5 py-2.5 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] focus:outline-none focus:border-[#0075de] shadow-xs"
                        />
                        <button
                          type="submit"
                          disabled={sendingReply || !adminReplyText.trim()}
                          className="py-2.5 px-4 rounded-xl bg-[#0075de] hover:bg-[#0062bd] text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{sendingReply ? 'กำลังส่ง...' : 'ตอบกลับ'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center text-[#615d59] space-y-2">
                    <MessageSquare className="w-10 h-10 text-[#a39e98] opacity-50" />
                    <p className="text-xs font-semibold text-[#000000]">เลือกคำร้องจากรายการด้านซ้าย</p>
                    <p className="text-[11px] text-[#615d59]">
                      เพื่อดูข้อความทั้งหมด ตอบกลับ หรือกดเปลี่ยนสถานะเป็นแก้ไขเสร็จสิ้น
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* Admin Footer with Live Version & Deploy Info */}
          <footer className="pt-6 pb-2 text-center text-xs text-[#8c8780] border-t border-[#e6e6e6]/60 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span>pleng.online Admin Portal</span> • <span>v1.0.0</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] flex-wrap justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Deploy ล่าสุด: <strong>{formatDeployDateTime(__APP_BUILD_TIME__)}</strong></span>
              <span className="text-[#a39e98]">•</span>
              <span>Commit: <code className="font-mono text-[10px] bg-[#f6f5f4] px-1 py-0.5 rounded border border-[#e6e6e6]">{__APP_COMMIT_HASH__}</code></span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
export default AdminPortalView;
