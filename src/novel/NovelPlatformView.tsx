import React, { useState } from 'react';
import {
  BookOpen,
  ArrowLeft,
  Coins,
  PenTool,
  Compass,
  Flame,
  Bookmark,
  Sparkles,
  Lock,
  Play,
  RotateCcw,
  Sun,
  Moon,
  Plus,
  Key,
  Shield,
  Copy,
  Check,
  Send,
  Eye,
  Heart,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileText,
  Users
} from 'lucide-react';
import { Novel, Chapter, ChatMessageItem, ApiKeyItem } from './types.js';

interface NovelPlatformProps {
  onBackToWatchParty: () => void;
  currentUser?: { name: string; avatar: string };
}

type NovelSubView = 'home' | 'detail' | 'text-reader' | 'chat-reader' | 'studio' | 'api-keys' | 'new-chapter' | 'wallet' | 'bookshelf';

const mockNovels: Novel[] = [
  {
    id: '1',
    authorId: 'u1',
    authorName: 'จอมยุทธ์เงา',
    title: 'จักรพรรดิเทพหวนคืนสู่เมืองหลวง',
    category: 'กำลังภายใน / แฟนตาซี',
    type: 'text',
    viewCount: 1200000,
    likeCount: 45200,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=60',
    synopsis: 'หลังจากถูกหักหลังโดยสหายสนิท เขากลับมาเกิดใหม่อีกครั้งในร่างของนายน้อยตระกูลตกอับพร้อมระบบเทพยุทธ์โบราณ เส้นทางล้างแค้นได้เริ่มต้นขึ้นแล้ว...',
    tags: ['เกิดใหม่', 'ระบบ', 'แก้แค้น'],
    status: 'ongoing',
    createdAt: '2026-09-01',
    updatedAt: '2026-10-04'
  },
  {
    id: '2',
    authorId: 'u2',
    authorName: 'GhostWriter',
    title: 'ความลับในห้องแชทตอนเที่ยงคืน',
    category: 'ระทึกขวัญ / นิยายแชท',
    type: 'chat',
    viewCount: 890000,
    likeCount: 38900,
    coverUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&auto=format&fit=crop&q=60',
    synopsis: 'ทุกๆ เที่ยงคืน จะมีข้อความปริศนาส่งเข้ามาในกรุ๊ปแชทของห้อง 6/2 พร้อมคำสั่งมรณะที่ไม่มีใครกล้าปฏิเสธ...',
    tags: ['ระทึกขวัญ', 'เกมเอาชีวิตรอด'],
    status: 'ongoing',
    createdAt: '2026-09-10',
    updatedAt: '2026-10-03'
  },
  {
    id: '3',
    authorId: 'u3',
    authorName: 'Lady Rose',
    title: 'เมื่อท่านดยุกกลายเป็นทาสแมว',
    category: 'โรแมนติกแฟนตาซี',
    type: 'text',
    viewCount: 650000,
    likeCount: 29100,
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=60',
    synopsis: 'ดยุกผู้เย็นชาไร้หัวใจ ต้องมาตกเป็นทาสรักของวิญญาณหญิงสาวที่หลงเข้ามาสิงในแมวเปอร์เซียสีขาวของพระราชวัง...',
    tags: ['รักโรแมนติก', 'ตลก', 'แฟนตาซี'],
    status: 'ongoing',
    createdAt: '2026-09-15',
    updatedAt: '2026-10-02'
  }
];

const mockChatScript: ChatMessageItem[] = [
  { id: 1, sender: 'ไม่ระบุตัวตน', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60', message: 'มีใครยังตื่นอยู่บ้าง?', isMe: false, time: '00:00' },
  { id: 2, sender: 'ฉัน', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60', message: 'ใครน่ะ? นี่มันกรุ๊ปแชทห้อง 6/2 นะ แอดมินไม่ได้ดึงใครเข้ามาเพิ่มนี่', isMe: true, time: '00:01' },
  { id: 3, sender: 'ไม่ระบุตัวตน', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60', message: 'อย่าเพิ่งถามว่าข้าเป็นใคร... ลองมองออกไปนอกหน้าต่างห้องนอนของพวกเจ้าดูสิ', isMe: false, time: '00:02' },
  { id: 4, sender: 'ฉัน', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60', message: 'อย่ามาแกล้งอำกันดึกๆ นะ ไม่ตลกเลย!', isMe: true, time: '00:02' },
  { id: 5, sender: 'กานต์', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60', message: 'เฮ้ยทุกคน... ฉันเห็นเงาคนยืนอยู่ใต้เสาไฟหน้าบ้านฉันจริงๆ ว่ะ... มันกำลังมองขึ้นมา!', isMe: false, time: '00:03' },
  { id: 6, sender: 'ไม่ระบุตัวตน', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60', message: 'เกมได้เริ่มขึ้นแล้ว... ใครที่หลับก่อนฟ้าสาง จะไม่มีวันได้ตื่นขึ้นมาอีก 💀', isMe: false, time: '00:03' }
];

export function NovelPlatformView({ onBackToWatchParty, currentUser }: NovelPlatformProps) {
  const [subView, setSubView] = useState<NovelSubView>('home');
  const [selectedNovel, setSelectedNovel] = useState<Novel>(mockNovels[0]);
  const [coinBalance, setCoinBalance] = useState<number>(150);

  // Text Reader State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('normal');

  // Chat Reader State
  const [revealedChatCount, setRevealedChatCount] = useState<number>(2);

  // Studio API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([
    {
      id: 'k1',
      userId: 'u1',
      name: 'Python Novel Uploader Bot',
      prefix: 'wn_live_8f3a...',
      scopes: ['novels:read', 'novels:write'],
      createdAt: '2026-09-20',
      lastUsed: '2 ชั่วโมงที่แล้ว',
      isActive: true
    }
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // New Chapter Form
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterNum, setChapterNum] = useState('5');
  const [chapterPrice, setChapterPrice] = useState('0');
  const [chapterContent, setChapterContent] = useState('');

  const navigateTo = (view: NovelSubView, novel?: Novel) => {
    if (novel) setSelectedNovel(novel);
    setSubView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) return;
    const rawSecret = `wn_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
    setGeneratedSecret(rawSecret);
    const newK: ApiKeyItem = {
      id: `k-${Date.now()}`,
      userId: 'u1',
      name: newKeyName,
      prefix: `${rawSecret.substring(0, 12)}...`,
      scopes: ['novels:read', 'novels:write'],
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'ยังไม่เคยใช้งาน',
      isActive: true
    };
    setApiKeys([newK, ...apiKeys]);
    setNewKeyName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-text">
      {/* Novel Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={onBackToWatchParty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition"
              title="สลับกลับไปหน้าห้องเพลง pleng.online"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าเพลง
            </button>

            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 font-black text-lg sm:text-xl text-indigo-600 tracking-tight"
            >
              <BookOpen className="w-6 h-6" />
              <span>pleng.online / novel</span>
            </button>

            <nav className="hidden md:flex items-center gap-4 text-xs font-semibold text-slate-600">
              <button
                onClick={() => navigateTo('home')}
                className={`hover:text-indigo-600 transition flex items-center gap-1 ${subView === 'home' ? 'text-indigo-600 font-bold' : ''}`}
              >
                <Compass className="w-3.5 h-3.5" /> นิยายทั้งหมด
              </button>
              <button
                onClick={() => navigateTo('bookshelf')}
                className={`hover:text-indigo-600 transition flex items-center gap-1 ${subView === 'bookshelf' ? 'text-indigo-600 font-bold' : ''}`}
              >
                <Bookmark className="w-3.5 h-3.5" /> ชั้นหนังสือ
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('wallet')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 hover:bg-amber-100 transition"
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span>{coinBalance} เหรียญ</span>
            </button>

            <button
              onClick={() => navigateTo('studio')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition"
            >
              <PenTool className="w-3.5 h-3.5" /> Writer Studio
            </button>
          </div>
        </div>
      </header>

      {/* SUB-VIEW 1: HOME PAGE */}
      {subView === 'home' && (
        <div className="flex-1 pb-16">
          <section className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white py-14 px-4 shadow-inner">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold backdrop-blur-sm border border-indigo-400/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Sub Novel Platform @ pleng.online
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  อ่านและเขียนนิยายออนไลน์ <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-rose-300">
                    ครบทั้งแบบบรรยายและนิยายแชท
                  </span>
                </h1>
                <p className="text-indigo-200 text-sm">
                  ระบบอ่านลื่นไหล Dark mode ถนอมสายตา ปลดล็อกตอนอ่านด้วยเหรียญ และมี Writer Open API สำหรับนักเขียน
                </p>
              </div>
            </div>
          </section>

          <main className="max-w-7xl mx-auto px-4 mt-10 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">นิยายแนะนำยอดนิยม</h2>
                <p className="text-xs text-slate-500">เลือกอ่านเรื่องที่คุณชอบได้ทันที</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockNovels.map((n) => (
                <div
                  key={n.id}
                  onClick={() => navigateTo('detail', n)}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={n.coverUrl}
                      alt={n.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        n.type === 'chat' ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {n.type === 'chat' ? '💬 นิยายแชท' : '📖 นิยายบรรยาย'}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-semibold text-indigo-600 mb-1">{n.category}</div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                        {n.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2">{n.synopsis}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{n.authorName}</span>
                      <div className="flex items-center gap-3">
                        <span>👁️ {(n.viewCount / 1000).toFixed(0)}K</span>
                        <span>❤️ {(n.likeCount / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      )}

      {/* SUB-VIEW 2: NOVEL DETAIL & TABLE OF CONTENTS */}
      {subView === 'detail' && (
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> กลับหน้ารวมนิยาย
          </button>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 flex flex-col md:flex-row gap-6 items-start shadow-sm">
            <img
              src={selectedNovel.coverUrl}
              alt={selectedNovel.title}
              className="w-40 aspect-[3/4] object-cover rounded-2xl shadow-md border border-slate-100 shrink-0"
            />
            <div className="space-y-3 flex-1">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                selectedNovel.type === 'chat' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {selectedNovel.type === 'chat' ? '💬 Chat Fiction' : '📖 นิยายบรรยาย'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{selectedNovel.title}</h1>
              <p className="text-xs text-slate-500">ผู้แต่ง: <span className="font-semibold text-indigo-600">{selectedNovel.authorName}</span></p>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedNovel.synopsis}</p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => navigateTo(selectedNovel.type === 'chat' ? 'chat-reader' : 'text-reader')}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
                >
                  <Play className="w-4 h-4 fill-white" /> เริ่มอ่านตอนที่ 1
                </button>
                <button
                  onClick={() => navigateTo('bookshelf')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                >
                  + เพิ่มเข้าชั้นหนังสือ
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">สารบัญตอนทั้งหมด</div>
            <div className="divide-y divide-slate-100">
              <div
                onClick={() => navigateTo(selectedNovel.type === 'chat' ? 'chat-reader' : 'text-reader')}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">ตอนที่ 1: การเริ่มต้นและจุดเปลี่ยน</h4>
                  <span className="text-[11px] text-slate-400">อัปเดตเมื่อวานนี้</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">อ่านฟรี</span>
              </div>
              <div
                onClick={() => {
                  if (coinBalance >= 2) {
                    setCoinBalance(prev => prev - 2);
                    alert('ปลดล็อกตอนที่ 2 สำเร็จ! หัก 2 เหรียญ');
                    navigateTo(selectedNovel.type === 'chat' ? 'chat-reader' : 'text-reader');
                  } else {
                    alert('เหรียญไม่พอ กรุณาเติมเหรียญในหน้า Wallet');
                    navigateTo('wallet');
                  }
                }}
                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">ตอนที่ 2: เผชิญหน้ากับศัตรู</h4>
                  <span className="text-[11px] text-slate-400">อัปเดตวันนี้</span>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> 2 เหรียญ
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: TEXT READER UI */}
      {subView === 'text-reader' && (
        <div className={`flex-1 transition-colors ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-amber-50/40 text-zinc-900'}`}>
          <div className={`sticky top-16 z-30 border-b backdrop-blur-md px-6 py-3 flex items-center justify-between ${
            isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-amber-200/60'
          }`}>
            <button
              onClick={() => navigateTo('detail')}
              className="flex items-center gap-2 text-xs font-semibold hover:opacity-75 transition"
            >
              <ArrowLeft className="w-4 h-4" /> สารบัญ
            </button>

            <div className="flex items-center gap-2">
              <div className="flex border rounded-lg p-0.5 border-zinc-300 dark:border-zinc-700">
                <button onClick={() => setFontSize('normal')} className={`px-2 py-0.5 text-xs rounded ${fontSize === 'normal' ? 'bg-indigo-600 text-white' : ''}`}>ก</button>
                <button onClick={() => setFontSize('large')} className={`px-2 py-0.5 text-sm rounded ${fontSize === 'large' ? 'bg-indigo-600 text-white' : ''}`}>ก</button>
                <button onClick={() => setFontSize('xl')} className={`px-2 py-0.5 text-base rounded ${fontSize === 'xl' ? 'bg-indigo-600 text-white' : ''}`}>ก</button>
              </div>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
              </button>
            </div>
          </div>

          <main className="max-w-2xl mx-auto px-6 py-12">
            <h2 className="text-2xl font-bold mb-8 text-center">ตอนที่ 1: การตื่นขึ้นอีกครั้ง</h2>
            <article className={`space-y-6 ${fontSize === 'normal' ? 'text-base leading-relaxed' : fontSize === 'large' ? 'text-lg leading-loose' : 'text-xl leading-loose'} font-serif`}>
              <p>สายลมหนาวพัดผ่านหน้าต่างไม้ที่ผุพัง หยดน้ำค้างเย็นยะเยือกตกลงบนเปลือกตาของชายหนุ่ม ทำให้เขาสะดุ้งตื่นขึ้นมาด้วยความเจ็บปวดที่แผ่ซ่านไปทั่วสรรพางค์กาย</p>
              <p>"นี่ข้า... ยังไม่ตายงั้นหรือ?"</p>
              <p>หลินเฟิงกุมขมับของตนเอง ความทรงจำสุดท้ายของเขายังคงแจ่มชัด ภาพเปลวเพลิงบรรลัยกัลป์ที่แผดเผาพระราชวังลอยฟ้า และคมกระบี่ของสหายรักที่แทงทะลุหัวใจของเขาจากด้านหลัง</p>
              <blockquote className="p-4 rounded-xl border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 not-italic font-sans text-sm">
                [ตรวจพบคลื่นวิญญาณระดับเทวะ... กำลังเปิดใช้งานระบบมหาจักรพรรดิบรรพกาล... 100% เชื่อมต่อสำเร็จ!]
              </blockquote>
              <p>มุมปากของหลินเฟิงยกยิ้มขึ้นอย่างเย็นชา แววตาที่เคยสับสนแปรเปลี่ยนเป็นความมุ่งมั่นดั่งประกายกระบี่คมกริบ</p>
              <p>"ดินแดนเซียนคงคิดว่าข้าดับสูญไปแล้ว... จงรอข้าก่อนเถิด เหล่าผู้ทรยศทั้งหลาย!"</p>
            </article>
          </main>
        </div>
      )}

      {/* SUB-VIEW 4: CHAT FICTION READER (Tap-to-reveal) */}
      {subView === 'chat-reader' && (
        <div
          onClick={() => {
            if (revealedChatCount < mockChatScript.length) {
              setRevealedChatCount(prev => prev + 1);
            }
          }}
          className="flex-1 bg-slate-900 text-white flex flex-col justify-between select-none cursor-pointer p-4"
        >
          <div className="max-w-md w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
            <button
              onClick={(e) => { e.stopPropagation(); navigateTo('detail'); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" /> สารบัญ
            </button>
            <span className="text-xs text-rose-400 font-bold">💬 แตะหน้าจอเพื่ออ่านต่อ</span>
            <button
              onClick={(e) => { e.stopPropagation(); setRevealedChatCount(1); }}
              className="p-1 text-slate-400 hover:text-white"
              title="เริ่มอ่านใหม่"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="max-w-md w-full mx-auto flex-1 py-6 space-y-4">
            {mockChatScript.slice(0, revealedChatCount).map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 animate-in fade-in duration-200 ${
                  msg.isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <img src={msg.avatar} alt={msg.sender} className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className={`max-w-[75%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-400 mb-1">{msg.sender}</span>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.isMe ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-100 border border-slate-700'
                  }`}>
                    {msg.message}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>

          <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-800">
            แตะที่หน้าจอเพื่ออ่านข้อความต่อไป ({revealedChatCount}/{mockChatScript.length})
          </footer>
        </div>
      )}

      {/* SUB-VIEW 5: WRITER STUDIO DASHBOARD */}
      {subView === 'studio' && (
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Writer Studio (ระบบนักเขียน)</h1>
              <p className="text-xs text-slate-500">จัดการนิยาย สถิติผู้อ่าน และ Personal Access Tokens (API)</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTo('api-keys')}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Key className="w-3.5 h-3.5 text-indigo-600" /> จัดการ API Keys
              </button>
              <button
                onClick={() => navigateTo('new-chapter')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> เขียนตอนใหม่
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-400">ยอดวิวรวม</span>
              <div className="text-2xl font-black text-slate-900">2.1M</div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">+12% สัปดาห์นี้</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-400">รายได้จากเหรียญ</span>
              <div className="text-2xl font-black text-slate-900">฿18,450</div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">+8% สัปดาห์นี้</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-400">ผู้ติดตาม</span>
              <div className="text-2xl font-black text-slate-900">14.2K</div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">+230 คน</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-400">เรื่องที่เผยแพร่</span>
              <div className="text-2xl font-black text-slate-900">3 เรื่อง</div>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full inline-block">พร้อม API รองรับ</span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: API KEYS MANAGEMENT */}
      {subView === 'api-keys' && (
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
          <button
            onClick={() => navigateTo('studio')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" /> กลับหน้า Writer Studio
          </button>

          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-indigo-600" /> Writer Open API Keys
          </h1>

          {generatedSecret && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <Shield className="w-4 h-4 text-amber-600" /> คัดลอก Personal Access Token ของคุณ
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-2 rounded-xl text-xs font-mono text-slate-800 border border-amber-300 flex-1 truncate">
                  {generatedSecret}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedSecret);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedKey ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold">สร้าง API Key ใหม่</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="ชื่อโปรแกรม เช่น Python Upload Bot"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleCreateApiKey}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
              >
                + สร้างคีย์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 7: NEW CHAPTER EDITOR */}
      {subView === 'new-chapter' && (
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateTo('studio')}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" /> ยกเลิก
            </button>
            <button
              onClick={() => {
                alert('เผยแพร่ตอนใหม่เรียบร้อย!');
                navigateTo('studio');
              }}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" /> เผยแพร่ตอนนี้
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <input
              type="text"
              placeholder="ตั้งชื่อตอนของคุณ..."
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              className="w-full text-xl font-bold border-none focus:outline-none"
            />
            <textarea
              rows={14}
              placeholder="พิมพ์เนื้อหานิยายของคุณที่นี่..."
              value={chapterContent}
              onChange={(e) => setChapterContent(e.target.value)}
              className="w-full text-sm leading-relaxed border-none focus:outline-none resize-none font-serif"
            />
          </div>
        </div>
      )}

      {/* SUB-VIEW 8: WALLET PAGE */}
      {subView === 'wallet' && (
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white rounded-3xl p-8 shadow-xl">
            <span className="text-amber-100 text-xs font-semibold uppercase">Coin Balance</span>
            <div className="text-5xl font-black">{coinBalance} <span className="text-base font-normal">เหรียญ</span></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-base font-bold">เติมเหรียญ (Coin Top-up)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { coins: 50, price: 35 },
                { coins: 100, price: 69 },
                { coins: 300, price: 199 },
                { coins: 500, price: 329 }
              ].map(pkg => (
                <button
                  key={pkg.coins}
                  onClick={() => {
                    setCoinBalance(prev => prev + pkg.coins);
                    alert(`เติมเงินสำเร็จ! ได้รับ ${pkg.coins} เหรียญ`);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition"
                >
                  <div className="text-2xl font-black">{pkg.coins} <span className="text-xs font-normal">เหรียญ</span></div>
                  <div className="text-amber-600 font-bold text-sm mt-2">฿{pkg.price}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 9: BOOKSHELF */}
      {subView === 'bookshelf' && (
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
          <h1 className="text-2xl font-bold">ชั้นหนังสือของฉัน (Bookshelf)</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockNovels.slice(0, 2).map((n) => (
              <div key={n.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex gap-4">
                <img src={n.coverUrl} alt={n.title} className="w-24 aspect-[3/4] object-cover rounded-xl shrink-0" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm line-clamp-1">{n.title}</h3>
                    <p className="text-xs text-slate-500">อ่านค้างที่: ตอนที่ 1</p>
                  </div>
                  <button
                    onClick={() => navigateTo('detail', n)}
                    className="w-full py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    อ่านต่อ &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
