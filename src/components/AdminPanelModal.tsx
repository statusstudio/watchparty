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

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#151722] border border-gray-800/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                แผงควบคุมผู้ดูแล & ตั้งค่าห้อง
                {isOwner && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Owner
                  </span>
                )}
                {!isOwner && isAdminOrOwner && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold border border-purple-500/30 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">จัดการสมาชิก เตะ แบน และตั้งค่าความปลอดภัยห้อง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 py-2 bg-[#10121a] border-b border-gray-800/60 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            สมาชิกในห้อง ({members.length})
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              ตั้งค่าห้อง & รหัสผ่าน
            </button>
          )}

          <button
            onClick={() => setActiveTab('banned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'banned'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-rose-400" />
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
                    className="p-3 rounded-xl bg-[#1a1d2d]/70 border border-gray-800/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-full overflow-hidden border-2 shrink-0"
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
                          <span className="text-xs font-semibold text-white truncate">
                            {member.user.name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-gray-500">(คุณ)</span>
                          )}
                          {isTargetOwner && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30">
                              👑 Owner
                            </span>
                          )}
                          {isTargetAdmin && !isTargetOwner && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold border border-purple-500/30">
                              🛡️ Admin
                            </span>
                          )}
                          {approvedSpeakerIds.includes(member.user.id) && !isTargetAdmin && !isTargetOwner && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                              🎤 ได้สิทธิ์ขึ้นไมค์
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">
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
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-amber-500/20 text-amber-400 border border-gray-700 transition-colors cursor-pointer"
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
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              isTargetAdmin
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
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
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-amber-500/20 text-amber-400 border border-gray-700 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>

                        {/* Kick from Room */}
                        <button
                          onClick={() => onKickUser(member.user.id)}
                          title="เตะออกจากห้อง (Kick)"
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-rose-500/20 text-rose-400 border border-gray-700 transition-colors cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>

                        {/* Ban from Room (Owner & Admin) */}
                        <button
                          onClick={() => onBanUser(member.user.id)}
                          title="แบนออกจากห้อง (Ban)"
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-600/30 text-red-400 border border-gray-700 transition-colors cursor-pointer"
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
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>บันทึกการตั้งค่าห้องสำเร็จ!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  ชื่อห้องปาร์ตี้
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f0f13] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  คำอธิบายห้อง
                </label>
                <input
                  type="text"
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f0f13] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    หมวดหมู่ห้อง (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RoomCategory)}
                    className="w-full px-3.5 py-2.5 bg-[#0f0f13] border border-gray-700 rounded-xl text-sm text-purple-300 font-medium focus:outline-none focus:border-purple-500"
                  >
                    {ROOM_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#151722] text-white">
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>รูปภาพปกห้อง (Image URL)</span>
                  </label>
                  <input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="วางลิงก์รูปภาพ..."
                    className="w-full px-3.5 py-2.5 bg-[#0f0f13] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Privacy Toggle */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  ความปลอดภัยห้อง (Privacy & Password)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      !isPrivate
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-gray-800 bg-[#0f0f13] text-gray-400'
                    }`}
                  >
                    <Globe className={`w-4 h-4 mt-0.5 ${!isPrivate ? 'text-emerald-400' : ''}`} />
                    <div>
                      <p className="text-xs font-semibold text-white">ห้องสาธารณะ</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">เข้าได้ทันทีโดยไม่ต้องใส่รหัส</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isPrivate
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-gray-800 bg-[#0f0f13] text-gray-400'
                    }`}
                  >
                    <Lock className={`w-4 h-4 mt-0.5 ${isPrivate ? 'text-purple-400' : ''}`} />
                    <div>
                      <p className="text-xs font-semibold text-white">ล็อครหัส (Private)</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">ต้องกรอกรหัสผ่านก่อนเข้า</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Password change */}
              {isPrivate && (
                <div className="p-3.5 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-1.5 animate-fade-in">
                  <label className="block text-xs font-medium text-purple-200">
                    เปลี่ยนรหัสผ่านห้อง (Room Password)
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ระบุรหัสผ่านใหม่..."
                    className="w-full px-3 py-2 bg-[#0f0f13] border border-purple-500/50 rounded-xl text-sm text-white focus:outline-none focus:border-purple-400"
                    required={isPrivate}
                  />
                  <p className="text-[10px] text-gray-400">
                    * เมื่อเปลี่ยนรหัสผ่าน คนที่ยังไม่ได้เข้าห้องจะต้องใช้รหัสผ่านใหม่นี้
                  </p>
                </div>
              )}

              {/* Voice Stage Access Mode (Owner controls mic access) */}
              <div className="pt-1 space-y-1.5">
                <label className="block text-xs font-medium text-gray-300 flex items-center justify-between">
                  <span>การจำกัดการขึ้นไมค์บนเวที (Voice Stage Access)</span>
                  <span className="text-[10px] text-amber-400 font-normal">👑 กำหนดโดยเจ้าของห้อง</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStageAccessMode('everyone')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      stageAccessMode === 'everyone'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white ring-1 ring-emerald-500/50'
                        : 'border-gray-800 bg-[#0f0f13] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      <span>👥</span> ทุกคนขึ้นได้
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      สมาชิกทุกคนสามารถกดขึ้นที่นั่งพูดไมค์ได้อิสระ
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStageAccessMode('admin_only')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      stageAccessMode === 'admin_only'
                        ? 'border-purple-500 bg-purple-500/10 text-white ring-1 ring-purple-500/50'
                        : 'border-gray-800 bg-[#0f0f13] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      <span>🛡️</span> เฉพาะแอดมิน
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      ขึ้นได้เฉพาะ Owner และ Admin ของห้องเท่านั้น
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStageAccessMode('approval')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      stageAccessMode === 'approval'
                        ? 'border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500/50'
                        : 'border-gray-800 bg-[#0f0f13] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      <span>✋</span> ต้องขออนุญาต
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      สมาชิกต้องขอยกมือ ให้ Owner/Admin กดอนุญาต
                    </p>
                  </button>
                </div>
              </div>

              {/* Playlist restrictions */}
              <div className="pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#0f0f13] border border-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAdminPlaylist}
                    onChange={(e) => setOnlyAdminPlaylist(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-700"
                  />
                  <div className="text-xs">
                    <span className="text-gray-200 font-medium">จำกัดสิทธิ์จัดการ Playlist</span>
                    <p className="text-[10px] text-gray-400">
                      เฉพาะ Owner & Admin เท่านั้นที่สามารถเพิ่ม ลบ หรือสลับคิวเพลงได้
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  บันทึกการตั้งค่าห้อง
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Banned Users */}
          {activeTab === 'banned' && (
            <div className="space-y-3">
              {bannedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">
                  ยังไม่มีผู้ใช้ที่ถูกแบนในห้องนี้
                </div>
              ) : (
                bannedUsers.map((banned) => (
                  <div
                    key={banned.id}
                    className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-rose-300">{banned.name}</p>
                      <p className="text-[10px] text-gray-400">
                        แบนโดย {banned.bannedByName} • {new Date(banned.bannedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    {isAdminOrOwner && (
                      <button
                        onClick={() => onUnbanUser(banned.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-emerald-600/30 text-emerald-400 border border-gray-700 hover:border-emerald-500 transition-colors cursor-pointer"
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
