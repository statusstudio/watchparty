import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './roomManager.js';
import { platformManager } from './platformManager.js';
import { emailService } from './emailService.js';
import { searchYouTube, extractYouTubePlaylistId, fetchYouTubePlaylist } from './youtubeSearch.js';
import { fetchYouTubeSubtitles } from './youtubeCaptions.js';
import compression from 'compression';
import { WSClientMessage } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env configuration
if (typeof (process as any).loadEnvFile === 'function') {
  try {
    (process as any).loadEnvFile();
  } catch (e) {
    // .env not present or failed to load, proceed with defaults
  }
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';
const SERVER_BOOT_TIME = new Date().toISOString();

async function startServer() {
  console.log('🔄 Initializing database & cloud synchronization...');
  await platformManager.init();

  const app = express();
  app.use(compression());
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  const roomManager = new RoomManager();
  await roomManager.init();

  app.use(express.json());

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/api/version', (req, res) => {
    const gitCommit = (process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'latest').slice(0, 7);
    res.json({
      status: 'ok',
      bootTime: SERVER_BOOT_TIME,
      gitCommit,
      serviceId: process.env.RENDER_SERVICE_ID || null,
      environment: process.env.NODE_ENV || 'development',
      now: new Date().toISOString()
    });
  });

  // Android App Direct APK Download
  app.get('/download/apk', (req, res) => {
    const candidates = [
      path.join(rootDir, 'public', 'pleng.online.apk'),
      path.join(rootDir, 'dist', 'pleng.online.apk'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return res.download(p, 'pleng.online.apk');
      }
    }
    res.status(404).send('APK file not found');
  });

  // Android App Digital Asset Links (TWA Verification)
  app.get('/.well-known/assetlinks.json', (req, res) => {
    const candidates = [
      path.join(rootDir, 'public', '.well-known', 'assetlinks.json'),
      path.join(rootDir, 'dist', '.well-known', 'assetlinks.json'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        res.setHeader('Content-Type', 'application/json');
        return res.sendFile(p);
      }
    }
    res.status(404).send('Assetlinks not found');
  });

  // SEO routes
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nAllow: /\n\nSitemap: https://pleng.online/sitemap.xml\n");
  });

  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pleng.online/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  });

  // Get all public rooms for Home directory
  app.get('/api/rooms', (req, res) => {
    res.json(roomManager.getAllRoomSummaries());
  });

  // YouTube search endpoint
  app.get('/api/youtube/search', async (req, res) => {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ results: [] });
    }
    try {
      const results = await searchYouTube(q, 20);
      res.json({ results });
    } catch (err: any) {
      console.error('Search error:', err);
      res.status(500).json({ error: 'Search failed', results: [] });
    }
  });

  // YouTube Playlist fetch endpoint
  app.get('/api/youtube/playlist', async (req, res) => {
    const listIdOrUrl = ((req.query.listId || req.query.url || req.query.q) as string || '').trim();
    if (!listIdOrUrl) {
      return res.status(400).json({ error: 'Missing playlist ID or URL', items: [] });
    }
    const cleanId = extractYouTubePlaylistId(listIdOrUrl) || listIdOrUrl;
    try {
      const data = await fetchYouTubePlaylist(cleanId, 100);
      res.json(data);
    } catch (err: any) {
      console.error('Playlist fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch playlist', items: [] });
    }
  });

  // Synced Lyrics fetch endpoint
  const lyricsCache = new Map<string, { timestamp: number; data: any }>();
  const LYRICS_CACHE_TTL = 24 * 60 * 60 * 1000;

  function cleanTitleForLyrics(rawTitle: string): { track: string; artist?: string } {
    let title = rawTitle
      .replace(/\[.*?\]|\(.*?\)|【.*?】/g, ' ')
      .replace(/official\s*(mv|video|audio|music\s*video|lyric\s*video|lyrics?)/gi, ' ')
      .replace(/(\b(hd|4k|1080p|audio|lyrics?)\b)/gi, ' ')
      .replace(/feat\..*|ft\..*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      return { artist: parts[0].trim(), track: parts[1].trim() };
    }
    if (title.includes(' : ')) {
      const parts = title.split(' : ');
      return { artist: parts[0].trim(), track: parts[1].trim() };
    }
    return { track: title };
  }

  function parseLrc(lrcText: string): { time: number; text: string }[] {
    const lines = lrcText.split('\n');
    const result: { time: number; text: string }[] = [];
    const timeReg = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let match;
      const timestamps: number[] = [];
      let lastIndex = 0;
      timeReg.lastIndex = 0;

      while ((match = timeReg.exec(trimmed)) !== null) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) / 1000 : 0;
        timestamps.push(mins * 60 + secs + ms);
        lastIndex = timeReg.lastIndex;
      }

      const text = trimmed.slice(lastIndex).trim();
      if (text && timestamps.length > 0) {
        for (const t of timestamps) {
          result.push({ time: t, text });
        }
      }
    }

    return result.sort((a, b) => a.time - b.time);
  }

  app.get('/api/lyrics', async (req, res) => {
    const rawTitle = ((req.query.title as string) || '').trim();
    const rawArtist = ((req.query.artist as string) || '').trim();
    const videoId = ((req.query.videoId as string) || '').trim();

    if (!rawTitle && !videoId) {
      return res.status(400).json({ error: 'Missing title or videoId parameter', found: false });
    }

    const { track, artist: parsedArtist } = cleanTitleForLyrics(rawTitle);
    const finalArtist = rawArtist || parsedArtist || '';
    const cacheKey = videoId ? `vid_${videoId}` : `${track.toLowerCase()}_${finalArtist.toLowerCase()}`;

    const cached = lyricsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < LYRICS_CACHE_TTL) {
      return res.json(cached.data);
    }

    try {
      let lrclibData: any = null;

      if (finalArtist && track) {
        try {
          const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(finalArtist)}`;
          const getRes = await fetch(getUrl, {
            headers: { 'User-Agent': 'pleng.online watchparty (contact@pleng.online)' },
          });
          if (getRes.ok) {
            lrclibData = await getRes.json();
          }
        } catch {}
      }

      if (!lrclibData && track) {
        const q = `${track} ${finalArtist}`.trim();
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'User-Agent': 'pleng.online watchparty (contact@pleng.online)' },
        });
        if (searchRes.ok) {
          const list = await searchRes.json();
          if (Array.isArray(list) && list.length > 0) {
            lrclibData = list.find((item: any) => item.syncedLyrics) || list[0];
          }
        }
      }

      // If LRCLIB returned synced lyrics, prioritize it
      if (lrclibData && lrclibData.syncedLyrics) {
        const lines = parseLrc(lrclibData.syncedLyrics);
        if (lines.length > 0) {
          const payload = {
            found: true,
            source: 'lrclib',
            title: lrclibData.name || track,
            artist: lrclibData.artistName || finalArtist,
            hasSynced: true,
            syncedLyrics: lrclibData.syncedLyrics,
            plainLyrics: lrclibData.plainLyrics || null,
            lines,
          };
          lyricsCache.set(cacheKey, { timestamp: Date.now(), data: payload });
          return res.json(payload);
        }
      }

      // Fallback: If no synced lyrics from LRCLIB, extract subtitles from YouTube video CC
      if (videoId) {
        try {
          const ytCaptions = await fetchYouTubeSubtitles(videoId);
          if (ytCaptions && ytCaptions.lines.length > 0) {
            const plainText = ytCaptions.lines.map((l) => l.text).join('\n');
            const payload = {
              found: true,
              source: 'youtube_captions',
              language: ytCaptions.language,
              languageName: ytCaptions.languageName,
              isAutoGenerated: ytCaptions.isAutoGenerated,
              title: track || rawTitle,
              artist: finalArtist,
              hasSynced: true,
              plainLyrics: plainText,
              lines: ytCaptions.lines,
            };
            lyricsCache.set(cacheKey, { timestamp: Date.now(), data: payload });
            return res.json(payload);
          }
        } catch (ytErr) {
          console.warn('YouTube captions fallback failed for video', videoId, ytErr);
        }
      }

      // If LRCLIB had plain lyrics (unsynced) and YouTube had no CC
      if (lrclibData && lrclibData.plainLyrics) {
        const payload = {
          found: true,
          source: 'lrclib_plain',
          title: lrclibData.name || track,
          artist: lrclibData.artistName || finalArtist,
          hasSynced: false,
          syncedLyrics: null,
          plainLyrics: lrclibData.plainLyrics,
          lines: [],
        };
        lyricsCache.set(cacheKey, { timestamp: Date.now(), data: payload });
        return res.json(payload);
      }

      const notFoundPayload = { found: false, title: track || rawTitle, artist: finalArtist, lines: [] };
      lyricsCache.set(cacheKey, { timestamp: Date.now(), data: notFoundPayload });
      return res.json(notFoundPayload);
    } catch (err: any) {
      console.error('Lyrics fetch error:', err);
      return res.status(500).json({ found: false, error: 'Internal server error', lines: [] });
    }
  });

  // Create room endpoint
  app.post('/api/rooms/create', (req, res) => {
    const { name, description, isPrivate, password, category, coverImage, onlyAdminManagePlaylist, initialVideoId, initialVideoTitle, initialVideoChannel, stageAccessMode, user } = req.body;
    if (!name || !user) {
      return res.status(400).json({ error: 'Missing name or user' });
    }

    // Generate clean, short 6-character room ID (e.g. "m7x8k2")
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let roomId = '';
    for (let i = 0; i < 6; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    roomManager.createRoom(roomId, {
      name,
      description,
      isPrivate,
      password,
      category,
      coverImage,
      onlyAdminManagePlaylist,
      initialVideoId,
      initialVideoTitle,
      initialVideoChannel,
      stageAccessMode,
    }, user);

    res.json({ success: true, roomId });
  });

  app.get('/api/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    const password = (req.query.password as string) || undefined;
    const userId = (req.query.userId as string) || undefined;
    const isStealth = req.query.isStealth === 'true';

    const room = roomManager.getRoom(roomId);
    if (room && room.metadata.isPrivate && room.metadata.password) {
      const isOwner = userId && userId === room.metadata.ownerId;
      const roomPass = String(room.metadata.password).trim();
      const userPass = password ? String(password).trim() : '';

      if (!isStealth && !isOwner && (!userPass || userPass !== roomPass)) {
        return res.json({
          roomId,
          requiresPassword: true,
          metadata: {
            id: room.metadata.id,
            name: room.metadata.name,
            description: room.metadata.description,
            ownerId: room.metadata.ownerId,
            ownerName: room.metadata.ownerName,
            isPrivate: true,
            hasPassword: true,
            category: room.metadata.category,
            coverImage: room.metadata.coverImage,
            createdAt: room.metadata.createdAt,
          },
          video: {
            videoId: '',
            title: '',
            thumbnail: '',
            currentTime: 0,
            duration: 0,
            isPlaying: false,
            lastUpdated: Date.now(),
          },
          playlist: [],
          chat: [],
          seats: [],
          members: [],
          bannedUsers: [],
          onlineCount: 0,
        });
      }
    }

    const roomState = roomManager.getRoomState(roomId, userId, isStealth);
    res.json(roomState);
  });

  // === Member Authentication Endpoints (Email & 6-digit OTP) ===

  // 1. Send OTP for Member Registration
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { email, name, password } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลให้ถูกต้อง' });
      }
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'กรุณากรอกชื่อที่ต้องการแสดง' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      }

      if (platformManager.isEmailRegistered(email)) {
        return res.status(400).json({ error: 'อีเมลนี้ได้ลงทะเบียนในระบบแล้ว กรุณาเข้าสู่ระบบ' });
      }

      await emailService.createRegistrationOtp(email, name, password);
      res.json({
        success: true,
        message: 'ส่งรหัสยืนยัน 6 หลักไปยังอีเมลของคุณเรียบร้อยแล้ว (หากไม่พบใน Inbox กรุณาตรวจสอบในโฟลเดอร์ จดหมายขยะ / Spam หรือถังขยะ)',
      });
    } catch (err: any) {
      console.error('Send OTP error:', err);
      res.status(500).json({ error: 'ไม่สามารถส่งรหัสยืนยันได้ กรุณาลองใหม่อีกครั้ง' });
    }
  });

  // 2. Verify OTP and Complete Member Registration
  app.post('/api/auth/verify-otp', (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสยืนยัน OTP' });
      }

      const verifyResult = emailService.verifyOtp(email, code);
      if (!verifyResult.success || !verifyResult.data) {
        return res.status(400).json({ error: verifyResult.message || 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ' });
      }

      const { name, passwordHash } = verifyResult.data;
      const regResult = platformManager.registerMember(email, name, passwordHash);
      if (!regResult.success || !regResult.user) {
        return res.status(400).json({ error: regResult.message || 'เกิดข้อผิดพลาดในการสร้างบัญชี' });
      }

      res.json({
        success: true,
        user: regResult.user,
        message: 'ยืนยันตัวตนและสมัครสมาชิกสำเร็จ ยินดีต้อนรับสู่ pleng.online 🎉',
      });
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการยืนยันรหัส OTP' });
    }
  });

  // 3. Member Login with Email & Password
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
      }

      const loginResult = platformManager.loginMember(email, password);
      if (!loginResult.success || !loginResult.user) {
        return res.status(401).json({ error: loginResult.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }

      res.json({
        success: true,
        user: loginResult.user,
        message: 'เข้าสู่ระบบสำเร็จ',
      });
    } catch (err: any) {
      console.error('Member login error:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
  });

  // 4. Send OTP for Password Reset (Forgot Password)
  app.post('/api/auth/forgot-password/send-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลให้ถูกต้อง' });
      }

      if (!platformManager.isEmailRegistered(email)) {
        return res.status(404).json({ error: 'ไม่พบบัญชีที่ลงทะเบียนด้วยอีเมลนี้ในระบบ' });
      }

      await emailService.createPasswordResetOtp(email);
      res.json({
        success: true,
        message: 'ส่งรหัสยืนยัน 6 หลักสำหรับรีเซ็ตรหัสผ่านไปยังอีเมลเรียบร้อยแล้ว (หากไม่พบใน Inbox กรุณาตรวจสอบในโฟลเดอร์ จดหมายขยะ / Spam หรือถังขยะ)',
      });
    } catch (err: any) {
      console.error('Send forgot password OTP error:', err);
      res.status(500).json({ error: 'ไม่สามารถส่งรหัสยืนยันได้ กรุณาลองใหม่อีกครั้ง' });
    }
  });

  // 5. Verify OTP and Reset Password
  app.post('/api/auth/forgot-password/reset', (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      }

      const verifyResult = emailService.verifyPasswordResetOtp(email, code);
      if (!verifyResult.success) {
        return res.status(400).json({ error: verifyResult.message || 'รหัสยืนยันไม่ถูกต้องหรือหมดอายุ' });
      }

      const resetResult = platformManager.resetMemberPassword(email, newPassword);
      if (!resetResult.success) {
        return res.status(400).json({ error: resetResult.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' });
      }

      res.json({
        success: true,
        user: resetResult.user,
        message: 'รีเซ็ตรหัสผ่านสำเร็จ ยินดีต้อนรับกลับเข้าสู่ระบบ 🎉',
      });
    } catch (err: any) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' });
    }
  });

  // 6. Member Change Password (while logged in)
  app.post('/api/auth/change-password', (req, res) => {
    try {
      const { userId, currentPassword, newPassword } = req.body;
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
      }

      const result = platformManager.changeMemberPassword(userId, currentPassword, newPassword);
      if (!result.success) {
        return res.status(400).json({ error: result.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้' });
      }

      res.json({
        success: true,
        message: result.message || 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว 🎉',
      });
    } catch (err: any) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    }
  });

  // === Dedicated Admin Endpoints (/admin) ===

  // Admin Login (supports username: 'admin' or email, password: 'admin888')
  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้หรืออีเมล และรหัสผ่าน' });
    }

    const result = platformManager.adminLogin(username, password);
    if (result.success && result.user) {
      res.json({
        success: true,
        user: result.user,
        message: 'เข้าสู่ระบบผู้ดูแลระบบสำเร็จ 👑',
      });
    } else {
      res.status(401).json({ error: result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
  });

  // Get Admin Account Credentials Info (Username, Email)
  app.get('/api/admin/credentials', (req, res) => {
    res.json(platformManager.getAdminCredentials());
  });

  // Update Admin Account (Primary Email & Password)
  app.post('/api/admin/update-credentials', (req, res) => {
    const { currentPassword, newEmail, newPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ error: 'กรุณาระบุรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน' });
    }

    const result = platformManager.updateAdminCredentials(currentPassword, newEmail, newPassword);
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.message });
    }
  });

  // Get SMTP Configuration (Public info, masked password)
  app.get('/api/admin/smtp', (req, res) => {
    res.json(platformManager.getPublicSmtpConfig());
  });

  // Update SMTP Configuration
  app.post('/api/admin/smtp', (req, res) => {
    try {
      const updated = platformManager.updateSmtpConfig(req.body);
      res.json({
        success: true,
        message: 'บันทึกการตั้งค่าระบบส่งอีเมล (SMTP) สำเร็จ',
        config: platformManager.getPublicSmtpConfig(),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'ไม่สามารถบันทึกการตั้งค่า SMTP ได้' });
    }
  });

  // Test SMTP Email Delivery
  app.post('/api/admin/smtp/test', async (req, res) => {
    try {
      const { toEmail, customConfig } = req.body;
      if (!toEmail || !toEmail.includes('@')) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลผู้รับที่ถูกต้องสำหรับการทดสอบ' });
      }

      // If customConfig is passed and has empty password but hasPass is true, use stored password
      let effectiveConfig = customConfig;
      if (effectiveConfig && (!effectiveConfig.pass || effectiveConfig.pass.trim() === '')) {
        const stored = platformManager.getSmtpConfig();
        effectiveConfig = {
          ...effectiveConfig,
          pass: stored.pass,
        };
      }

      const result = await emailService.sendTestEmail(toEmail, effectiveConfig);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'เกิดข้อผิดพลาดในการทดสอบส่งอีเมล' });
    }
  });

  // Get Email & OTP Activity Logs
  app.get('/api/admin/email-logs', (req, res) => {
    res.json(emailService.getEmailLogs());
  });

  // Get Supabase Cloud Persistence Status
  app.get('/api/admin/supabase-status', async (req, res) => {
    try {
      const status = await platformManager.getSupabaseStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({
        configured: false,
        connected: false,
        message: err.message || 'Error checking Supabase status',
      });
    }
  });

  // Manual Trigger: Sync data to Supabase
  app.post('/api/admin/supabase-sync', async (req, res) => {
    try {
      const status = await platformManager.getSupabaseStatus();
      if (!status.configured || !status.connected) {
        return res.status(400).json({
          success: false,
          message: status.message,
        });
      }

      const success = await platformManager.syncToSupabase();
      await roomManager.savePersistentRoomsAsync();
      if (success) {
        res.json({ success: true, message: 'ซิงก์ข้อมูลสมาชิก ห้อง และคิวเพลงขึ้น Supabase Cloud สำเร็จเรียบร้อย! 🎉' });
      } else {
        res.status(500).json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลขึ้น Supabase Cloud',
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'เกิดข้อผิดพลาดในการซิงก์ข้อมูล' });
    }
  });

  // Trigger Redeployment on Render via Deploy Hook
  app.post('/api/admin/trigger-deploy', async (req, res) => {
    try {
      const hookUrl = process.env.RENDER_DEPLOY_HOOK_URL ||
        'https://api.render.com/deploy/srv-dan40sjm8hqs739vahhg?key=5ANTUPOhk-U';

      console.log(`[Deploy] Triggering Render redeploy via Deploy Hook: ${hookUrl.replace(/key=.+/, 'key=***')}`);
      const response = await fetch(hookUrl, { method: 'POST' });

      if (response.ok) {
        let deployData = null;
        try {
          deployData = await response.json();
        } catch (e) {}

        res.json({
          success: true,
          message: '🚀 ส่งคำสั่ง Deploy ไปยัง Render สำเร็จเรียบร้อย! ระบบกำลังดึงโค้ดล่าสุดมา Build ใหม่ (ใช้เวลาประมาณ 2-3 นาที)',
          deployData,
          triggeredAt: new Date().toISOString(),
        });
      } else {
        const errorText = await response.text();
        res.status(response.status).json({
          success: false,
          message: `Render ตอบกลับข้อผิดพลาด (${response.status}): ${errorText}`,
        });
      }
    } catch (err: any) {
      console.error('[Deploy] Trigger redeploy failed:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'ไม่สามารถติดต่อ Render Deploy Hook ได้',
      });
    }
  });

  // Verify Master Passcode (Legacy support)
  app.post('/api/platform/auth', (req, res) => {
    const { passcode } = req.body;
    if (platformManager.verifyMasterPasscode(passcode)) {
      res.json({ success: true, message: 'ปลดล็อกสิทธิ์ Super Admin สำเร็จ' });
    } else {
      res.status(401).json({ success: false, error: 'รหัส Master Passcode ไม่ถูกต้อง' });
    }
  });

  // Owner / Super Admin Login Endpoint (Legacy support)
  app.post('/api/platform/admin-login', (req, res) => {
    const { username, passcode } = req.body;
    const result = platformManager.adminLogin(username || 'admin', passcode || '');
    if (result.success && result.user) {
      res.json({
        success: true,
        user: result.user,
        message: 'เข้าสู่ระบบในฐานะเจ้าของระบบสำเร็จ 👑',
      });
    } else {
      res.status(401).json({ success: false, error: 'รหัสผ่านเจ้าของระบบ (Master Passcode) ไม่ถูกต้อง' });
    }
  });

  // Get Platform Overview Stats
  app.get('/api/platform/stats', (req, res) => {
    res.json(platformManager.getStats(roomManager));
  });

  // Get All Registered Users
  app.get('/api/platform/users', (req, res) => {
    res.json(platformManager.getAllUsers());
  });

  // Create New User (Admin Direct Creation)
  app.post('/api/platform/users', (req, res) => {
    try {
      const { email, name, password, isSuperAdmin } = req.body;
      const result = platformManager.createMemberAdmin(email, name, password, isSuperAdmin);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'ไม่สามารถสร้างผู้ใช้ได้' });
    }
  });

  // Update User Details (Admin Direct Update)
  app.put('/api/platform/users/:id', (req, res) => {
    try {
      const { id } = req.params;
      const result = platformManager.updateMemberAdmin(id, req.body);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'ไม่สามารถอัพเดทผู้ใช้ได้' });
    }
  });

  // Delete User Permanently (Admin Direct Delete)
  app.delete('/api/platform/users/:id', (req, res) => {
    try {
      const { id } = req.params;
      const result = platformManager.deleteMemberAdmin(id);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json({ error: result.message });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'ไม่สามารถลบผู้ใช้ได้' });
    }
  });

  // Suspend / Unsuspend User
  app.post('/api/platform/users/:id/suspend', (req, res) => {
    const { id } = req.params;
    const { isSuspended } = req.body;
    const success = platformManager.suspendUser(id, !!isSuspended);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Cannot suspend this user' });
    }
  });

  // Toggle Super Admin role
  app.post('/api/platform/users/:id/toggle-admin', (req, res) => {
    const { id } = req.params;
    const { isSuperAdmin } = req.body;
    const success = platformManager.setSuperAdmin(id, !!isSuperAdmin);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Cannot update role' });
    }
  });

  // Public Profile lookup by handle (@username) or ID
  app.get('/api/users/profile/:handleOrId', (req, res) => {
    try {
      const handleOrId = req.params.handleOrId;
      const currentUserId = (req.query.currentUserId as string) || '';
      let user = platformManager.getUserByHandle(handleOrId);
      if (!user) {
        user = {
          id: handleOrId,
          name: 'ผู้ใช้',
          username: handleOrId.replace(/^@/, ''),
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(handleOrId)}`,
          color: '#8b5cf6',
          provider: 'guest',
          isSuperAdmin: false,
          isSuspended: false,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        };
      }

      // Check if user is currently online in a room
      const activeRoom = roomManager.findUserActiveRoom(user.id);
      const followStats = platformManager.getFollowStats(user.id, currentUserId);

      // Return sanitized public profile with accurate follow stats
      const publicProfile = {
        id: user.id,
        name: user.name,
        username: user.username || user.id,
        avatar: user.avatar,
        bannerUrl: user.bannerUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        color: user.color,
        provider: user.provider,
        isSuperAdmin: !!user.isSuperAdmin,
        bio: user.bio || '',
        favoriteGenres: user.favoriteGenres || ['Lofi', 'Pop'],
        socialLinks: user.socialLinks || {},
        favoriteSongs: user.favoriteSongs || [],
        xp: user.xp || 0,
        level: user.level || 1,
        listeningTimeMinutes: user.listeningTimeMinutes || 0,
        followersCount: followStats.followersCount,
        followingCount: followStats.followingCount,
        isFollowing: followStats.isFollowing,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        activeRoom: activeRoom || null,
      };

      res.json(publicProfile);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' });
    }
  });

  // Follow / Unfollow User endpoint
  app.post('/api/users/follow', (req, res) => {
    try {
      const { followerId, followingId, currentUserId, targetUserId } = req.body;
      const actualFollowerId = followerId || currentUserId;
      const actualFollowingId = followingId || targetUserId;

      if (!actualFollowerId || !actualFollowingId) {
        return res.status(400).json({ error: 'Missing followerId or followingId' });
      }

      const result = platformManager.toggleFollow(actualFollowerId, actualFollowingId);
      res.json({
        success: true,
        isFollowing: result.isFollowing,
        followersCount: result.followersCount,
        followingCount: result.followingCount,
      });
    } catch (err: any) {
      console.error('Error toggling follow:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการติดตาม' });
    }
  });

  // Follow Status check endpoint
  app.get('/api/users/:id/follow-status', (req, res) => {
    try {
      const userId = req.params.id;
      const currentUserId = (req.query.currentUserId as string) || '';
      const stats = platformManager.getFollowStats(userId, currentUserId);
      res.json({
        success: true,
        isFollowing: stats.isFollowing,
        followersCount: stats.followersCount,
        followingCount: stats.followingCount,
      });
    } catch (err: any) {
      console.error('Error checking follow status:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะการติดตาม' });
    }
  });

  // Update user profile (Name, Username, Bio, Avatar, Banner, Genres, Social Links)
  app.put('/api/users/profile', (req, res) => {
    try {
      const { userId, ...profileData } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }

      const result = platformManager.updateUserProfile(userId, profileData);
      if (result.success && result.user) {
        res.json({
          success: true,
          user: result.user,
          message: result.message || 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว',
        });
      } else {
        res.status(400).json({ error: result.message || 'ไม่สามารถอัพเดตโปรไฟล์ได้' });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกโปรไฟล์' });
    }
  });

  // User Favorites Endpoints
  app.get('/api/users/:userId/favorites', (req, res) => {
    const { userId } = req.params;
    res.json(platformManager.getUserFavorites(userId));
  });

  app.post('/api/users/:userId/favorites', (req, res) => {
    const { userId } = req.params;
    const { song } = req.body;
    if (!song || !song.videoId) {
      return res.status(400).json({ error: 'Missing song data' });
    }
    const updated = platformManager.addUserFavorite(userId, song);
    res.json({ success: true, favorites: updated });
  });

  app.delete('/api/users/:userId/favorites/:videoId', (req, res) => {
    const { userId, videoId } = req.params;
    const updated = platformManager.removeUserFavorite(userId, videoId);
    res.json({ success: true, favorites: updated });
  });

  // Get All Rooms Detailed (for Super Admin)
  app.get('/api/platform/rooms', (req, res) => {
    res.json(roomManager.getAllRoomsAdmin());
  });

  // Get Platform Global Config (Widgets, Banners, Maintenance)
  app.get('/api/platform/config', (req, res) => {
    res.json(platformManager.getConfig());
  });

  // Update Platform Global Config
  app.post('/api/platform/config', (req, res) => {
    const updated = platformManager.updateConfig(req.body);
    roomManager.broadcastToAll({
      type: 'PLATFORM_CONFIG_UPDATED',
      config: updated,
    });
    res.json(updated);
  });

  // Get Deep Analytics (Live visitors, Provider breakdown, Top tracks, Memory)
  app.get('/api/platform/analytics', (req, res) => {
    res.json(platformManager.getAnalytics(roomManager));
  });

  // Broadcast System Announcement to All Active Users
  app.post('/api/platform/broadcast', (req, res) => {
    const { text, announcementType } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Announcement text is required' });
      return;
    }
    roomManager.broadcastToAll({
      type: 'SYSTEM_ANNOUNCEMENT',
      text: text.trim(),
      announcementType: announcementType || 'info',
    });
    res.json({ success: true });
  });

  // Force Delete Room (by Super Admin)
  app.delete('/api/platform/rooms/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { reason } = req.body || {};
    const success = roomManager.forceDeleteRoom(roomId, reason);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Room not found' });
    }
  });

  // Support Tickets API
  // Get all tickets (Super Admin)
  app.get('/api/support/tickets', (req, res) => {
    res.json(platformManager.getAllTickets());
  });

  // Get user's own tickets
  app.get('/api/support/my-tickets', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    res.json(platformManager.getUserTickets(userId));
  });

  // Create new ticket
  app.post('/api/support/tickets/create', (req, res) => {
    const { userId, userName, userAvatar, userEmail, category, title, description } = req.body;
    if (!userId || !userName || !title || !description) {
      return res.status(400).json({ error: 'Missing required ticket fields' });
    }
    const ticket = platformManager.createTicket(
      userId,
      userName,
      userAvatar || '',
      category || 'general',
      title,
      description,
      userEmail
    );
    res.json({ success: true, ticket });
  });

  // Reply to ticket
  app.post('/api/support/tickets/:ticketId/reply', async (req, res) => {
    const { ticketId } = req.params;
    const { senderId, senderName, senderAvatar, isSuperAdmin, text } = req.body;
    if (!text || !senderId || !senderName) {
      return res.status(400).json({ error: 'Missing reply content' });
    }
    const updated = platformManager.replyTicket(
      ticketId,
      senderId,
      senderName,
      senderAvatar || '',
      !!isSuperAdmin,
      text
    );
    if (updated) {
      // If admin replied and user provided an email, send email notification
      if (isSuperAdmin && updated.userEmail) {
        emailService.sendTicketUpdateEmail(
          updated.userEmail,
          updated.userName,
          updated.title,
          updated.status,
          text
        ).catch(err => console.error('Failed sending ticket email:', err));
      }
      res.json({ success: true, ticket: updated });
    } else {
      res.status(404).json({ error: 'Ticket not found' });
    }
  });

  // Update ticket status
  app.patch('/api/support/tickets/:ticketId/status', async (req, res) => {
    const { ticketId } = req.params;
    const { status, adminMessage } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Missing status' });
    }
    const updated = platformManager.updateTicketStatus(ticketId, status);
    if (updated) {
      // If user provided an email, notify about status change (e.g. resolved)
      if (updated.userEmail) {
        emailService.sendTicketUpdateEmail(
          updated.userEmail,
          updated.userName,
          updated.title,
          status,
          adminMessage || undefined
        ).catch(err => console.error('Failed sending ticket status email:', err));
      }
      res.json({ success: true, ticket: updated });
    } else {
      res.status(404).json({ error: 'Ticket not found' });
    }
  });

  // WebSocket connection handling & Keepalive Heartbeat
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch (e) {}
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  wss.on('connection', (ws: WebSocket) => {
    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('message', (rawData: string) => {
      try {
        const msg = JSON.parse(rawData.toString()) as WSClientMessage;
        switch (msg.type) {
          case 'GET_ROOMS': {
            const rooms = roomManager.getAllRoomSummaries();
            ws.send(JSON.stringify({ type: 'ROOMS_LIST', rooms }));
            break;
          }
          case 'JOIN_ROOM':
            roomManager.handleJoin(ws, msg.roomId, msg.user, msg.password, msg.isStealth);
            break;
          case 'LEAVE_ROOM':
            roomManager.handleLeaveRoom(ws);
            break;
          case 'VERIFY_ROOM_PASSWORD': {
            const user =
              msg.user ||
              (roomManager as any).pendingUsers?.get(ws) ||
              (roomManager as any).clients?.get(ws)?.user;

            if (user) {
              roomManager.handleVerifyPassword(ws, msg.roomId, user, msg.password);
            } else {
              const fallbackUser = {
                id: 'usr-guest-' + Math.random().toString(36).substring(2, 8),
                name: 'Guest',
                role: 'member',
              };
              roomManager.handleVerifyPassword(ws, msg.roomId, fallbackUser as any, msg.password);
            }
            break;
          }
          case 'UPDATE_PROFILE':
            roomManager.handleUpdateProfile(ws, msg.user);
            break;
          case 'UPDATE_ROOM_SETTINGS':
            roomManager.handleUpdateRoomSettings(ws, msg.settings);
            break;
          case 'UPDATE_ROOM_WIDGETS':
            roomManager.handleUpdateRoomWidgets(ws, msg.widgets);
            break;
          case 'SET_ADMIN_ROLE':
            roomManager.handleSetAdminRole(ws, msg.targetUserId, msg.role);
            break;
          case 'KICK_USER':
            roomManager.handleKickUser(ws, msg.targetUserId);
            break;
          case 'BAN_USER':
            roomManager.handleBanUser(ws, msg.targetUserId);
            break;
          case 'UNBAN_USER':
            roomManager.handleUnbanUser(ws, msg.targetUserId);
            break;
          case 'FORCE_LEAVE_STAGE':
            roomManager.handleForceLeaveStage(ws, msg.targetUserId);
            break;
          case 'REQUEST_TO_SPEAK':
            roomManager.handleRequestToSpeak(ws, msg.seatNumber);
            break;
          case 'APPROVE_SPEAK_REQUEST':
            roomManager.handleApproveSpeakRequest(ws, msg.targetUserId, msg.approved, msg.seatNumber);
            break;
          case 'REVOKE_SPEAK_PERMISSION':
            roomManager.handleRevokeSpeakPermission(ws, msg.targetUserId);
            break;
          case 'TAKE_SEAT':
            roomManager.handleTakeSeat(ws, msg.seatNumber);
            break;
          case 'LEAVE_SEAT':
            roomManager.handleLeaveSeat(ws);
            break;
          case 'TOGGLE_MUTE':
            roomManager.handleToggleMute(ws, msg.isMuted);
            break;
          case 'SPEAKING_STATE':
            roomManager.handleSpeakingState(ws, msg.isSpeaking);
            break;
          case 'VIDEO_PLAY':
            roomManager.handleVideoPlay(ws, msg.currentTime, msg.duration);
            break;
          case 'VIDEO_PAUSE':
            roomManager.handleVideoPause(ws, msg.currentTime, msg.duration);
            break;
          case 'VIDEO_SEEK':
            roomManager.handleVideoSeek(ws, msg.currentTime, msg.duration);
            break;
          case 'VIDEO_CHANGE':
            roomManager.handleVideoChange(ws, msg.videoId, msg.title, msg.channel, msg.duration);
            break;
          case 'PLAYLIST_ADD':
            roomManager.handlePlaylistAdd(ws, msg.item, msg.roomId);
            break;
          case 'PLAYLIST_ADD_BATCH':
            roomManager.handlePlaylistAddBatch(ws, msg.items, msg.roomId);
            break;
          case 'PLAYLIST_REMOVE':
            roomManager.handlePlaylistRemove(ws, msg.id);
            break;
          case 'PLAYLIST_CLEAR':
            roomManager.handlePlaylistClear(ws);
            break;
          case 'SET_LOOP_MODE':
            roomManager.handleSetLoopMode(ws, msg.loopMode);
            break;
          case 'SET_SHUFFLE':
            roomManager.handleSetShuffle(ws, msg.isShuffle);
            break;
          case 'VIDEO_ENDED':
            roomManager.handleVideoEnded(ws);
            break;
          case 'PLAYLIST_NEXT':
            roomManager.handlePlaylistNext(ws);
            break;
          case 'PLAYLIST_PREV':
            roomManager.handlePlaylistPrev(ws);
            break;
          case 'SEND_CHAT':
            roomManager.handleChat(ws, msg.text, (msg as any).imageUrl);
            break;
          case 'DELETE_CHAT_MESSAGE':
            roomManager.handleDeleteChatMessage(ws, msg.messageId);
            break;
          case 'CLEAR_CHAT':
            roomManager.handleClearChat(ws);
            break;
          case 'CLOSE_ROOM':
            roomManager.handleCloseRoom(ws);
            break;
          case 'EMOJI_REACTION':
            roomManager.handleEmojiReaction(ws, msg.emoji);
            break;
          case 'SEND_GIFT':
            roomManager.handleSendGift(ws, msg.giftId, msg.giftName, msg.giftIcon);
            break;
          case 'PLAY_SOUND':
            roomManager.handlePlaySound(ws, msg.soundId, msg.soundName);
            break;
          case 'SIGNAL_DATA':
            roomManager.handleSignal(ws, msg.targetId, msg.data);
            break;
          case 'GAME_START':
            roomManager.handleGameStart(ws, msg.maxRounds);
            break;
          case 'GAME_STOP':
            roomManager.handleGameStop(ws);
            break;
          case 'GAME_SELECT_WORD':
            roomManager.handleGameSelectWord(ws, msg.word, msg.category);
            break;
          case 'GAME_DRAW_STROKE':
            roomManager.handleGameDrawStroke(ws, msg.stroke);
            break;
          case 'GAME_CLEAR_CANVAS':
            roomManager.handleGameClearCanvas(ws);
            break;
          case 'GAME_GUESS':
            roomManager.handleGameGuess(ws, msg.guess);
            break;
          case 'SET_ROOM_ANNOUNCEMENT':
            roomManager.handleSetRoomAnnouncement(ws, msg.announcement);
            break;
          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      roomManager.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err);
      roomManager.handleDisconnect(ws);
    });
  });

  // Vite integration
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: rootDir,
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(path.join(rootDir, 'dist'), {
        maxAge: '1y',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          } else {
            // Hashed static assets (.js, .css, .woff2, images) can be cached permanently
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(rootDir, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 YouTube WatchParty & 9-Seat Voice Stage server running on http://0.0.0.0:${PORT}`);
    console.log(`📡 WebSocket server running on ws://0.0.0.0:${PORT}/ws`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
    try {
      await roomManager.savePersistentRoomsAsync();
      await platformManager.flushSave();
      console.log('✅ [Server] Successfully saved persistent rooms & platform data.');
    } catch (err) {
      console.error('❌ [Server] Error during graceful shutdown persistence:', err);
    }

    server.close(() => {
      console.log('[Server] Server closed cleanly.');
      process.exit(0);
    });

    setTimeout(() => {
      console.warn('[Server] Forcing shutdown after timeout.');
      process.exit(0);
    }, 6000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
