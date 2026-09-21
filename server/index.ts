import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './roomManager.js';
import { platformManager } from './platformManager.js';
import { searchYouTube } from './youtubeSearch.js';
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

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  const roomManager = new RoomManager();

  app.use(express.json());

  // API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
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

  // Create room endpoint
  app.post('/api/rooms/create', (req, res) => {
    const { name, description, isPrivate, password, category, coverImage, onlyAdminManagePlaylist, initialVideoId, initialVideoTitle, initialVideoChannel, stageAccessMode, user } = req.body;
    if (!name || !user) {
      return res.status(400).json({ error: 'Missing name or user' });
    }

    const roomId = 'room-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4);
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
    const roomState = roomManager.getRoomState(roomId);
    res.json(roomState);
  });

  // === Platform Super Admin & Support Endpoints ===

  // Verify Master Passcode
  app.post('/api/platform/auth', (req, res) => {
    const { passcode } = req.body;
    if (platformManager.verifyMasterPasscode(passcode)) {
      res.json({ success: true, message: 'ปลดล็อกสิทธิ์ Super Admin สำเร็จ' });
    } else {
      res.status(401).json({ success: false, error: 'รหัส Master Passcode ไม่ถูกต้อง' });
    }
  });

  // Owner / Super Admin Login Endpoint
  app.post('/api/platform/admin-login', (req, res) => {
    const { username, passcode } = req.body;
    if (platformManager.verifyMasterPasscode(passcode)) {
      const adminName = username?.trim()
        ? (username.includes('👑') ? username.trim() : `${username.trim()} 👑`)
        : 'System Admin 👑';

      const adminUser = platformManager.recordUser({
        id: 'usr-admin-system',
        name: adminName,
        email: 'admin@watchparty.live',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
        color: '#dd5b00',
        provider: 'google',
        isSuperAdmin: true,
      });

      platformManager.setSuperAdmin('usr-admin-system', true);
      res.json({
        success: true,
        user: adminUser,
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
  app.post('/api/support/tickets/:ticketId/reply', (req, res) => {
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
      res.json({ success: true, ticket: updated });
    } else {
      res.status(404).json({ error: 'Ticket not found' });
    }
  });

  // Update ticket status
  app.patch('/api/support/tickets/:ticketId/status', (req, res) => {
    const { ticketId } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Missing status' });
    }
    const updated = platformManager.updateTicketStatus(ticketId, status);
    if (updated) {
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
            roomManager.handleJoin(ws, msg.roomId, msg.user, msg.password);
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
          case 'CLOSE_ROOM':
            roomManager.handleCloseRoom(ws);
            break;
          case 'EMOJI_REACTION':
            roomManager.handleEmojiReaction(ws, msg.emoji);
            break;
          case 'PLAY_SOUND':
            roomManager.handlePlaySound(ws, msg.soundId, msg.soundName);
            break;
          case 'SIGNAL_DATA':
            roomManager.handleSignal(ws, msg.targetId, msg.data);
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
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
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
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
