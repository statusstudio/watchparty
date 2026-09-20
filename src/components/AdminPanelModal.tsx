import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Crown,
  User,
  UserX,
  Ban,
  MicOff,
  Settings,
  Lock,
  Globe,
  Check,
  LogOut,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { RoomMember, BannedUser, UserRole, RoomMetadata, RoomCategory, StageAccessMode } from '../types/index.js';
import { ROOM_CATEGORIES } from '../data/presets.js';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  myRole: UserRole;
  myUserId: string;
  metadata: RoomMetadata;
  members: RoomMember[];
  bannedUsers: BannedUser[];
  approvedSpeakerIds?: string[];
  onSetAdminRole: (targetUserId: string, role: 'admin' | 'member') => void;
  onKickUser: (targetUserId: string) => void;
  onBanUser: (targetUserId: string) => void;
  onUnbanUser: (targetUserId: string) => void;
  onForceMute: (targetUserId: string) => void;
  onForceLeaveStage: (targetUserId: string) => void;
  onRevokeSpeakerPermission?: (targetUserId: string) => void;
  onUpdateSettings: (settings: {
    name: string;
    description: string;
    isPrivate: boolean;
    password?: string;
    category?: RoomCategory;
    coverImage?: string;
    onlyAdminManagePlaylist: boolean;
    stageAccessMode?: StageAccessMode;
  }) => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  myRole,
  myUserId,
  metadata,
  members,
  bannedUsers,
  approvedSpeakerIds = [],
  onSetAdminRole,
  onKickUser,
  onBanUser,
  onUnbanUser,
  onForceMute,
  onForceLeaveStage,
  onRevokeSpeakerPermission,
  onUpdateSettings,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'banned'>('members');

  // Room Settings State
  const [roomName, setRoomName] = useState(metadata.name || '');
  const [roomDesc, setRoomDesc] = useState(metadata.description || '');
  const [category, setCategory] = useState<RoomCategory>(metadata.category || 'general');
  const [coverImage, setCoverImage] = useState(metadata.coverImage || '');
  const [isPrivate, setIsPrivate] = useState(metadata.isPrivate || false);
  const [password, setPassword] = useState(metadata.password || '');
  const [onlyAdminPlaylist, setOnlyAdminPlaylist] = useState(metadata.onlyAdminManagePlaylist || false);
  const [stageAccessMode, setStageAccessMode] = useState<StageAccessMode>(metadata.stageAccessMode || 'everyone');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync current room data whenever modal opens or metadata updates from server
  useEffect(() => {
    if (isOpen) {
      setRoomName(metadata.name || '');
      setRoomDesc(metadata.description || '');
      setCategory(metadata.category || 'general');
      setCoverImage(metadata.coverImage || '');
      setIsPrivate(metadata.isPrivate || false);
      setPassword(metadata.password || '');
      setOnlyAdminPlaylist(metadata.onlyAdminManagePlaylist || false);
      setStageAccessMode(metadata.stageAccessMode || 'everyone');
      setSavedSuccess(false);
    }
  }, [isOpen, metadata]);

  if (!isOpen) return null;

  const isOwner = myRole === 'owner';
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    onUpdateSettings({
      name: roomName.trim(),
      description: roomDesc.trim(),
      category,
      coverImage: coverImage.trim() || undefined,
      isPrivate,
      password: isPrivate ? password.trim() : undefined,
      onlyAdminManagePlaylist: onlyAdminPlaylist,
      stageAccessMode,
    });

    onShowToast?.('บันทึกการตั้งค่าห้องเรียบร้อยแล้ว 🎉', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-[#e6e6e6] rounded-2xl w-full max-w-xl overflow-hidden shadow-notion-modal flex flex-col max-h-[85vh] text-[#31302e]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e6e6e6] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0075de]/10 text-[#0075de] border border-[#0075de]/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#000000] flex items-center gap-2">
                แผงควบคุมผู้ดูแล & ตั้งค่าห้อง
                {isOwner && (
                  <span className="px-2 py-0.2 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Owner
                  </span>
                )}
                {!isOwner && isAdminOrOwner && (
                  <span className="px-2 py-0.2 rounded-full bg-[#0075de]/10 text-[#0075de] text-[10px] font-bold border border-[#0075de]/20 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#615d59]">จัดการสมาชิก เตะ แบน และตั้งค่าความปลอดภัยห้อง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#615d59] hover:text-[#000000] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 py-2 bg-[#f6f5f4] border-b border-[#e6e6e6] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'members'
                ? 'bg-white text-[#0075de] border border-[#e6e6e6] shadow-xs'
                : 'text-[#615d59] hover:text-[#000000]'
            }`}
          >
            สมาชิกในห้อง ({members.length})
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white text-[#0075de] border border-[#e6e6e6] shadow-xs'
                  : 'text-[#615d59] hover:text-[#000000]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              ตั้งค่าห้อง & รหัสผ่าน
            </button>
          )}

          <button
            onClick={() => setActiveTab('banned')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'banned'
                ? 'bg-white text-[#0075de] border border-[#e6e6e6] shadow-xs'
                : 'text-[#615d59] hover:text-[#000000]'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-rose-500" />
            รายชื่อที่ถูกแบน ({bannedUsers.length})
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Members List */}
          {activeTab === 'members' && (
            <div className="space-y-2.5">
              {members.map((member) => {
                const isTargetOwner = member.role === 'owner';
                const isTargetAdmin = member.role === 'admin';
                const isSelf = member.user.id === myUserId;

                return (
                  <div
                    key={member.user.id}
                    className="p-3 rounded-xl bg-white hover:bg-[#f6f5f4] border border-[#e6e6e6] flex items-center justify-between gap-3 shadow-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 bg-white shadow-xs"
                        style={{ borderColor: member.user.color }}
                      >
                        <img
                          src={member.user.avatar}
                          alt={member.user.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#000000] truncate">
                            {member.user.name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-[#a39e98]">(คุณ)</span>
                          )}
                          {isTargetOwner && (
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold border border-amber-200">
                              👑 Owner
                            </span>
                          )}
                          {isTargetAdmin && !isTargetOwner && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#0075de]/10 text-[#0075de] text-[9px] font-bold border border-[#0075de]/20">
                              🛡️ Admin
                            </span>
                          )}
                          {approvedSpeakerIds.includes(member.user.id) && !isTargetAdmin && !isTargetOwner && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#1aae39]/10 text-[#1aae39] text-[9px] font-bold border border-[#1aae39]/20">
                              🎤 ได้สิทธิ์ขึ้นไมค์
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#615d59] truncate">
                          {member.user.email || 'Guest Member'}
                        </p>
                      </div>
                    </div>

                    {/* Moderation Action Buttons */}
                    {!isSelf && !isTargetOwner && isAdminOrOwner && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Revoke Speaker Permission (Owner/Admin) */}
                        {approvedSpeakerIds.includes(member.user.id) && onRevokeSpeakerPermission && (
                          <button
                            onClick={() => onRevokeSpeakerPermission(member.user.id)}
                            title="ถอนสิทธิ์การขึ้นไมค์"
                            className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-600 border border-[#e6e6e6] transition-colors cursor-pointer shadow-xs"
                          >
                            <MicOff className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Promote / Demote Admin (Owner Only) */}
                        {isOwner && (
                          <button
                            onClick={() =>
                              onSetAdminRole(
                                member.user.id,
                                isTargetAdmin ? 'member' : 'admin'
                              )
                            }
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer shadow-xs ${
                              isTargetAdmin
                                ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                                : 'bg-white text-[#0075de] border-[#e6e6e6] hover:bg-[#0075de]/5'
                            }`}
                            title={isTargetAdmin ? 'ปลดสิทธิ์ Admin' : 'แต่งตั้งเป็น Admin'}
                          >
                            {isTargetAdmin ? 'ปลด Admin' : '+ ตั้ง Admin'}
                          </button>
                        )}

                        {/* Kick from Stage */}
                        <button
                          onClick={() => onForceLeaveStage(member.user.id)}
                          title="เตะลงจากเวทีไมค์"
                          className="p-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-600 border border-[#e6e6e6] transition-colors cursor-pointer shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>

                        {/* Kick from Room */}
                        <button
                          onClick={() => onKickUser(member.user.id)}
                          title="เตะออกจากห้อง (Kick)"
                          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-[#e6e6e6] transition-colors cursor-pointer shadow-xs"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>

                        {/* Ban from Room (Owner & Admin) */}
                        <button
                          onClick={() => onBanUser(member.user.id)}
                          title="แบนออกจากห้อง (Ban)"
                          className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-[#e6e6e6] transition-colors cursor-pointer shadow-xs"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Room Settings (Owner Only) */}
          {activeTab === 'settings' && isOwner && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {savedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#1aae39]" />
                  <span>บันทึกการตั้งค่าห้องสำเร็จ!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#31302e] mb-1.5">
                  ชื่อห้องปาร์ตี้
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#e6e6e6] rounded-xl text-sm text-[#000000] focus:outline-none focus:border-[#0075de] shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#31302e] mb-1.5">
                  คำอธิบายห้อง
                </label>
                <input
                  type="text"
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#e6e6e6] rounded-xl text-sm text-[#000000] focus:outline-none focus:border-[#0075de] shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-[#31302e] mb-1.5">
                    หมวดหมู่ห้อง (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RoomCategory)}
                    className="w-full px-3.5 py-2 bg-white border border-[#e6e6e6] rounded-xl text-sm text-[#000000] font-medium focus:outline-none focus:border-[#0075de] shadow-xs cursor-pointer"
                  >
                    {ROOM_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-white text-[#31302e]">
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-[#31302e] mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-[#0075de]" />
                    <span>รูปภาพปกห้อง (Image URL)</span>
                  </label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="วางลิงก์รูปภาพ..."
                    className="w-full px-3.5 py-2 bg-white border border-[#e6e6e6] rounded-xl text-xs text-[#000000] placeholder-[#a39e98] focus:outline-none focus:border-[#0075de] shadow-xs"
                  />
                </div>
              </div>

              {/* Privacy Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#31302e] mb-2">
                  ความปลอดภัยห้อง (Privacy & Password)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer shadow-xs ${
                      !isPrivate
                        ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                        : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                    }`}
                  >
                    <Globe className={`w-4 h-4 mt-0.5 ${!isPrivate ? 'text-[#0075de]' : 'text-[#615d59]'}`} />
                    <div>
                      <p className="text-xs font-semibold text-[#000000]">ห้องสาธารณะ</p>
                      <p className="text-[10px] text-[#615d59] mt-0.5">เข้าได้ทันทีโดยไม่ต้องใส่รหัส</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer shadow-xs ${
                      isPrivate
                        ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                        : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                    }`}
                  >
                    <Lock className={`w-4 h-4 mt-0.5 ${isPrivate ? 'text-[#0075de]' : 'text-[#615d59]'}`} />
                    <div>
                      <p className="text-xs font-semibold text-[#000000]">ล็อครหัส (Private)</p>
                      <p className="text-[10px] text-[#615d59] mt-0.5">ต้องกรอกรหัสผ่านก่อนเข้า</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Password change */}
              {isPrivate && (
                <div className="p-3.5 bg-[#f6f5f4] border border-[#e6e6e6] rounded-xl space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-semibold text-[#000000]">
                    เปลี่ยนรหัสผ่านห้อง (Room Password)
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ระบุรหัสผ่านใหม่..."
                    className="w-full px-3 py-1.5 bg-white border border-[#e6e6e6] rounded-xl text-sm text-[#000000] focus:outline-none focus:border-[#0075de] shadow-xs"
                    required={isPrivate}
                  />
                  <p className="text-[10px] text-[#615d59]">
                    * เมื่อเปลี่ยนรหัสผ่าน คนที่ยังไม่ได้เข้าห้องจะต้องใช้รหัสผ่านใหม่นี้
                  </p>
                </div>
              )}

              {/* Voice Stage Access Mode (Owner controls mic access) */}
              <div className="pt-1 space-y-1.5">
                <label className="block text-xs font-semibold text-[#31302e] flex items-center justify-between">
                  <span>การจำกัดการขึ้นไมค์บนเวที (Voice Stage Access)</span>
                  <span className="text-[10px] text-[#dd5b00] font-normal">👑 กำหนดโดยเจ้าของห้อง</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStageAccessMode('everyone')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                      stageAccessMode === 'everyone'
                        ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                        : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#000000]">
                      <span>👥</span> ทุกคนขึ้นได้
                    </div>
                    <p className="text-[10px] text-[#615d59] mt-1 leading-relaxed">
                      สมาชิกทุกคนสามารถกดขึ้นที่นั่งพูดไมค์ได้อิสระ
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStageAccessMode('admin_only')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                      stageAccessMode === 'admin_only'
                        ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                        : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#000000]">
                      <span>🛡️</span> เฉพาะแอดมิน
                    </div>
                    <p className="text-[10px] text-[#615d59] mt-1 leading-relaxed">
                      ขึ้นได้เฉพาะ Owner และ Admin ของห้องเท่านั้น
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStageAccessMode('approval')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                      stageAccessMode === 'approval'
                        ? 'border-[#0075de] bg-[#0075de]/5 text-[#000000] ring-1 ring-[#0075de]'
                        : 'border-[#e6e6e6] bg-white text-[#615d59] hover:border-[#0075de]/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-[#000000]">
                      <span>✋</span> ต้องขออนุญาต
                    </div>
                    <p className="text-[10px] text-[#615d59] mt-1 leading-relaxed">
                      สมาชิกต้องขอยกมือ ให้ Owner/Admin กดอนุญาต
                    </p>
                  </button>
                </div>
              </div>

              {/* Playlist restrictions */}
              <div className="pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#e6e6e6] cursor-pointer shadow-xs">
                  <input
                    type="checkbox"
                    checked={onlyAdminPlaylist}
                    onChange={(e) => setOnlyAdminPlaylist(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0075de] focus:ring-[#0075de] border-[#e6e6e6]"
                  />
                  <div className="text-xs">
                    <span className="text-[#000000] font-semibold">จำกัดสิทธิ์จัดการ Playlist</span>
                    <p className="text-[10px] text-[#615d59]">
                      เฉพาะ Owner & Admin เท่านั้นที่สามารถเพิ่ม ลบ หรือสลับคิวเพลงได้
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-full font-semibold text-xs bg-[#0075de] hover:bg-[#005bab] text-white shadow-xs transition-all cursor-pointer"
                >
                  บันทึกการตั้งค่าห้อง
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Banned Users */}
          {activeTab === 'banned' && (
            <div className="space-y-2.5">
              {bannedUsers.length === 0 ? (
                <div className="text-center py-8 text-[#615d59] text-xs">
                  ยังไม่มีผู้ใช้ที่ถูกแบนในห้องนี้
                </div>
              ) : (
                bannedUsers.map((banned) => (
                  <div
                    key={banned.id}
                    className="p-3 rounded-xl bg-white border border-[#e6e6e6] flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <p className="text-xs font-semibold text-rose-600">{banned.name}</p>
                      <p className="text-[10px] text-[#615d59]">
                        แบนโดย {banned.bannedByName} • {new Date(banned.bannedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    {isAdminOrOwner && (
                      <button
                        onClick={() => onUnbanUser(banned.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-emerald-50 text-[#1aae39] border border-emerald-200 transition-colors cursor-pointer shadow-xs"
                      >
                        ปลดแบน
                      </button>
                    )}
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
