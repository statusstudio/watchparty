import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Volume2,
  Sliders,
  Radio,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Copy,
  ChevronRight,
  Cpu,
  Layers,
  Zap,
  Info,
  Wand2,
  ExternalLink,
  VolumeX,
  Key,
  X,
  RefreshCw,
} from 'lucide-react';

interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  lang: string;
  badge: string;
  desc: string;
  avatar: string;
}

interface HistoryItem {
  id: string;
  text: string;
  audioUrl: string;
  voiceName: string;
  mode: 'clone' | 'tts';
  createdAt: string;
  duration?: number;
}

const DEFAULT_VOICES: VoiceOption[] = [
  {
    id: 'th-TH-PremwadeeNeural',
    name: 'เปมนวดี (Premwadee)',
    gender: 'หญิง (Female)',
    lang: 'th-TH',
    badge: 'ยอดนิยม',
    desc: 'เสียงพากย์หญิง สดใส สุภาพ ลื่นไหลเป็นธรรมชาติ เหมาะกับพากย์คลิป โฆษณา รีวิว',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'th-TH-NiwatNeural',
    name: 'นิวัฒน์ (Niwat)',
    gender: 'ชาย (Male)',
    lang: 'th-TH',
    badge: 'ทางการ / นุ่มทุ้ม',
    desc: 'เสียงพากย์ชาย ทุ้มลึก น่าเชื่อถือ มีน้ำหนัก เหมาะกับข่าว สารคดี และพอดแคสต์',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (US English)',
    gender: 'หญิง (Female)',
    lang: 'en-US',
    badge: 'Inter',
    desc: 'Natural, warm and expressive American English female voice',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (US English)',
    gender: 'ชาย (Male)',
    lang: 'en-US',
    badge: 'Inter',
    desc: 'Professional and authoritative American English male narrator',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'ja-JP-NanamiNeural',
    name: 'Nanami (Japanese)',
    gender: 'หญิง (Female)',
    lang: 'ja-JP',
    badge: 'Anime / JP',
    desc: 'Cute, cheerful and energetic Japanese voice',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=80',
  },
];

const PROMPT_SUGGESTIONS = [
  'สวัสดีครับ ยินดีต้อนรับสู่ระบบโคลนเสียง AI ตัวล่าสุด ที่ใช้โมเดล CosyVoice 3.0 คุณภาพระดับพรีเมียม',
  'วันนี้เราจะพาทุกคนมารู้จักกับนวัตกรรมปัญญาประดิษฐ์ ที่สามารถลอกเลียนแบบน้ำเสียงได้อย่างสมจริง',
  'สวัสดีค่ะเพื่อนๆ ทุกคน คลิปนี้เรามีไอเทมเด็ดมาบอกต่อกันอีกแล้ว ห้ามพลาดเด็ดขาดเลยนะคะ',
  'การเดินทางของชีวิต ไม่สำคัญว่าเราจะไปถึงจุดหมายเมื่อไหร่ แต่อยู่ที่ว่าระหว่างทางเราได้เรียนรู้อะไรบ้าง',
];

export default function VoiceCloneStudio() {
  const [activeTab, setActiveTab] = useState<'clone' | 'tts'>('clone');
  const [text, setText] = useState<string>('สวัสดีครับ ยินดีต้อนรับสู่สตูดิโอโคลนเสียง AI ที่ขับเคลื่อนด้วย CosyVoice 3.0');
  const [selectedVoice, setSelectedVoice] = useState<string>('th-TH-PremwadeeNeural');

  // TTS Parameters
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);

  // Voice Clone Parameters
  const [cloneAudioFile, setCloneAudioFile] = useState<File | null>(null);
  const [cloneAudioUrl, setCloneAudioUrl] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);

  // Natural Cadence & Expressiveness Parameters for Voice Clone
  const [cloneSpeed, setCloneSpeed] = useState<number>(0.96); // -4% default (relaxed natural conversational)
  const [clonePitch, setClonePitch] = useState<number>(0);
  const [cloneBaseVoice, setCloneBaseVoice] = useState<string>('auto');
  const [cloneStyle, setCloneStyle] = useState<'conversational' | 'narrative' | 'energetic' | 'calm'>('conversational');
  const [enableNaturalCadence, setEnableNaturalCadence] = useState<boolean>(true);

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Timer for elapsed generation time
  useEffect(() => {
    let timer: any = null;
    if (isGenerating) {
      setElapsedSeconds(0);
      timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGenerating]);

  // Hugging Face Token for personal ZeroGPU quota
  const [hfToken, setHfToken] = useState<string>(() => {
    try {
      return localStorage.getItem('hf_user_token') || '';
    } catch {
      return '';
    }
  });
  const [showTokenModal, setShowTokenModal] = useState<boolean>(false);

  // Compute Engine: 'local' (RTX 4060) or 'cloud' (A100)
  const [engineMode, setEngineMode] = useState<'cloud' | 'local'>('local');
  const [isLocalGpuOnline, setIsLocalGpuOnline] = useState<boolean>(false);

  // Auto-detect local RTX 4060 GPU engine and auto-load latest sample
  useEffect(() => {
    fetch('http://127.0.0.1:8006/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'online' && data.cuda) {
          setIsLocalGpuOnline(true);
          setEngineMode('local');
        }
      })
      .catch(() => {
        // Also check via proxy /api/voice/health or fallback
        fetch('/api/voice/health')
          .then((res) => res.json())
          .then((data) => {
            if (data.status === 'online' && data.cuda) {
              setIsLocalGpuOnline(true);
              setEngineMode('local');
            }
          })
          .catch(() => {
            setIsLocalGpuOnline(false);
            setEngineMode('cloud');
          });
      });
    document.title = 'AI Voice Clone Studio – RTX 4060 Local (0 บาท)';

    // Auto-load latest sample if available
    fetch('/api/voice/samples')
      .then((res) => res.json())
      .then((data) => {
        if (data.samples && data.samples.length > 0 && !currentAudioUrl) {
          setCurrentAudioUrl(data.samples[0].audio_url);
        }
      })
      .catch(() => {});
  }, []);

  // Save HF token to localStorage
  const handleSaveToken = (val: string) => {
    setHfToken(val);
    try {
      localStorage.setItem('hf_user_token', val.trim());
    } catch (e) {
      console.error(e);
    }
  };

  // History
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('voice_studio_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Media references
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voice_studio_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save voice history', e);
    }
  }, [history]);

  // Audio player listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setAudioCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentAudioUrl]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current || !currentAudioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setAudioCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  // Start in-browser microphone recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const file = new File([audioBlob], `recorded_${Date.now()}.${ext}`, { type: mimeType });
        setCloneAudioFile(file);
        setCloneAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 30) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้: ' + err.message);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Handle Audio File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCloneAudioFile(file);
      setCloneAudioUrl(URL.createObjectURL(file));
    }
  };

  // Generate Voice Clone
  const handleGenerateClone = async () => {
    if (!cloneAudioFile) {
      alert('กรุณาอัดเสียงหรืออัปโหลดไฟล์เสียงต้นฉบับ (3-10 วินาที) ก่อนทำการโคลน');
      return;
    }
    if (!text.trim()) {
      alert('กรุณาพิมพ์ข้อความที่ต้องการให้เสียงที่โคลนพูด');
      return;
    }

    setIsGenerating(true);
    setStatusMessage('กำลังเชื่อมต่อโมเดล Alibaba CosyVoice 3.0 และวิเคราะห์คุณลักษณะเสียง...');

    const formData = new FormData();
    formData.append('audio', cloneAudioFile);
    formData.append('text', text.trim());
    if (promptText.trim()) {
      formData.append('prompt_text', promptText.trim());
    }

    // Natural Cadence & Voice Expressiveness
    const ratePercent = Math.round((cloneSpeed - 1.0) * 100);
    const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
    formData.append('rate', rateStr);
    const pitchStr = clonePitch >= 0 ? `+${clonePitch}Hz` : `${clonePitch}Hz`;
    formData.append('pitch', pitchStr);
    formData.append('base_voice', cloneBaseVoice);
    formData.append('natural_cadence', String(enableNaturalCadence));

    try {
      const isLocal = engineMode === 'local';
      setStatusMessage(
        isLocal
          ? 'กำลังประมวลผลบนการ์ดจอ NVIDIA GeForce RTX 4060 (Local GPU)...'
          : 'กำลังสังเคราะห์เสียงด้วย CosyVoice 3.0 บนคลาวด์ A100...'
      );

      const headers: Record<string, string> = {};
      if (!isLocal && hfToken.trim()) {
        headers['X-HF-Token'] = hfToken.trim();
      }

      let apiEndpoint = isLocal ? 'http://127.0.0.1:8006/api/voice/clone' : '/api/voice/clone';
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        apiEndpoint = '/api/voice/clone';
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.detail || errorData.error || 'การสร้างเสียงล้มเหลว';
        if (errMsg.includes('ZeroGPU') || errMsg.includes('quota')) {
          setShowTokenModal(true);
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setCurrentAudioUrl(data.audio_url);
      setIsPlaying(false);

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: 'hist_' + Date.now(),
        text: text.trim(),
        audioUrl: data.audio_url,
        voiceName: isLocal ? 'Local RTX 4060 (โคลนเสียงสด)' : 'CosyVoice 3.0 (Cloud A100)',
        mode: 'clone',
        createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 19)]);
      setStatusMessage('');
    } catch (err: any) {
      if (err.message.includes('ZeroGPU') || err.message.includes('quota')) {
        setShowTokenModal(true);
      } else {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      }
      setStatusMessage('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Neural TTS
  const handleGenerateTTS = async () => {
    if (!text.trim()) {
      alert('กรุณาพิมพ์ข้อความที่ต้องการสร้างเสียง');
      return;
    }

    setIsGenerating(true);
    setStatusMessage(
      engineMode === 'local'
        ? 'กำลังประมวลผลบนการ์ดจอ RTX 4060...'
        : 'กำลังประมวลผล Neural Speech...'
    );

    // Convert speed to edge-tts percentage string (1.0 = +0%, 1.2 = +20%, 0.8 = -20%)
    const ratePercent = Math.round((speed - 1.0) * 100);
    const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

    // Pitch
    const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;

    try {
      let apiEndpoint = engineMode === 'local' ? 'http://127.0.0.1:8006/api/voice/synthesize' : '/api/voice/synthesize';
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        apiEndpoint = '/api/voice/synthesize';
      }
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice,
          rate: rateStr,
          pitch: pitchStr,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'การสร้างเสียงล้มเหลว');
      }

      const data = await response.json();
      setCurrentAudioUrl(data.audio_url);
      setIsPlaying(false);

      const voiceObj = DEFAULT_VOICES.find((v) => v.id === selectedVoice);
      const newHistoryItem: HistoryItem = {
        id: 'hist_' + Date.now(),
        text: text.trim(),
        audioUrl: data.audio_url,
        voiceName: voiceObj ? voiceObj.name : 'Neural Voice',
        mode: 'tts',
        createdAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      };
      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 19)]);
      setStatusMessage('');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
      setStatusMessage('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex flex-col font-sans selection:bg-purple-600/40">
      {/* Background Glow Accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Hidden audio element */}
      {currentAudioUrl && <audio ref={audioRef} src={currentAudioUrl} />}

      {/* Top Navigation Bar */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-[#0d111a]/80 backdrop-blur-xl px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#0d111a] rounded-[11px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base lg:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                AI Voice Clone Studio
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-full">
                CosyVoice 3.0
              </span>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>NVIDIA RTX 4060 GPU Accelerated</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTokenModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all shadow-sm ${
              hfToken
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/40 text-purple-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hfToken ? 'HF Token: เชื่อมต่อแล้ว ✓' : 'ใส่ HF Token (โควต้าไม่จำกัด)'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>ต้นทุน 0 บาท</span>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-xs text-zinc-300 transition-all border border-zinc-700/50"
            title="รีเฟรช / ล้างค่าหน้าจอ"
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls & Input (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Hardware Engine Selector Bar */}
          <div className="bg-[#121724]/90 border border-zinc-800/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between shadow-xl flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                engineMode === 'local'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-purple-500/15 border-purple-500/40 text-purple-400'
              }`}>
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">หน่วยประมวลผล (Compute Engine)</span>
                  {isLocalGpuOnline && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      RTX 4060 Online (8GB VRAM)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {engineMode === 'local'
                    ? '⚡ รันบนการ์ดจอ RTX 4060 ในเครื่องของคุณ (โควต้าไม่จำกัด 100% ส่วนตัว)'
                    : '🌐 รันบนคลาวด์ A100 (Hugging Face ZeroGPU)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setEngineMode('local')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  engineMode === 'local'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>การ์ดจอในเครื่อง (RTX 4060)</span>
              </button>

              <button
                onClick={() => setEngineMode('cloud')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  engineMode === 'cloud'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cloud A100</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="bg-[#121724]/90 border border-zinc-800/80 rounded-2xl p-1.5 flex gap-1.5 shadow-xl">
            <button
              onClick={() => setActiveTab('clone')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all ${
                activeTab === 'clone'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>โคลนเสียง AI (CosyVoice 3.0)</span>
              <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-white/20 rounded-md">
                Catfufu Engine
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tts')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all ${
                activeTab === 'tts'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>เสียงพากย์มาตรฐาน (Neural TTS)</span>
              <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold bg-white/20 rounded-md">
                Fast 0.5s
              </span>
            </button>
          </div>

          {/* Tab 1: Voice Clone Source Audio */}
          {activeTab === 'clone' && (
            <div className="bg-[#121724]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-semibold text-zinc-100">
                    ขั้นตอนที่ 1: เลือกเสียงต้นฉบับที่ต้องการโคลน (3-15 วินาที)
                  </h2>
                </div>
                <span className="text-[11px] text-zinc-400">รองรับ WAV, MP3, M4A, OGG</span>
              </div>

              {/* Upload or Record Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: Microphone Recording */}
                <div className="bg-zinc-900/60 border border-dashed border-zinc-700/70 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 hover:border-purple-500/50 transition-all">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-red-500/20 text-red-400 animate-pulse border-2 border-red-500'
                        : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 cursor-pointer'
                    }`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">
                      {isRecording ? `กำลังบันทึกเสียง (${recordingSeconds}s)...` : 'อัดเสียงพูดสดจากไมค์'}
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {isRecording ? 'กดอีกครั้งเพื่อหยุดอัด' : 'พูดประโยคสั้นๆ 5-10 วินาที'}
                    </p>
                  </div>

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-purple-600/80 hover:bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    }`}
                  >
                    {isRecording ? 'หยุดการบันทึก' : 'เริ่มอัดเสียง'}
                  </button>
                </div>

                {/* Option B: File Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-zinc-900/60 border border-dashed border-zinc-700/70 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3 hover:border-cyan-500/50 transition-all cursor-pointer group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">อัปโหลดไฟล์เสียงที่มีอยู่</h3>
                    <p className="text-[11px] text-zinc-400 mt-1">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
                  </div>

                  <span className="text-xs px-4 py-2 rounded-lg font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/50">
                    เลือกไฟล์เสียง
                  </span>
                </div>
              </div>

              {/* Reference Audio Preview */}
              {cloneAudioFile && (
                <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-purple-200 truncate max-w-xs sm:max-w-md">
                        {cloneAudioFile.name}
                      </div>
                      <div className="text-[10px] text-purple-300/70 mt-0.5">
                        ขนาด: {(cloneAudioFile.size / 1024).toFixed(1)} KB • พร้อมสำหรับการโคลน
                      </div>
                    </div>
                  </div>

                  {cloneAudioUrl && (
                    <audio controls src={cloneAudioUrl} className="h-8 max-w-[200px]" />
                  )}
                </div>
              )}

              {/* Optional Prompt Text */}
              <div>
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span>ข้อความในคลิปต้นฉบับ (Prompt Transcript - ทางเลือก)</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      (พิมพ์ประโยคที่พูดในคลิปเสียงต้นฉบับเพื่อความเหมือน 100%)
                    </span>
                  </span>
                </label>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="เช่น: สวัสดีครับ ยินดีต้อนรับสู่..."
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60"
                />
              </div>

              {/* Natural Cadence & Expressiveness Panel */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-zinc-200">ปรับแต่งความเป็นธรรมชาติและจังหวะพูด (Natural Cadence)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                    Catfufu Style
                  </span>
                </div>

                {/* Style Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'conversational', label: '🗣️ พูดคุยธรรมชาติ', desc: 'จังหวะสบายๆ มีจังหวะหายใจ', speed: 0.96, pitch: 0 },
                    { id: 'narrative', label: '🎙️ บรรยาย / อ่านข่าว', desc: 'ชัดถ้อยชัดคำ เป็นทางการ', speed: 1.0, pitch: 0 },
                    { id: 'energetic', label: '⚡ สดใส / รวดเร็ว', desc: 'กระตือรือร้น ทันสมัย', speed: 1.05, pitch: 2 },
                    { id: 'calm', label: '🌙 นุ่มนวล / สบายๆ', desc: 'โทนทุ้ม อบอุ่น ฟังสบาย', speed: 0.92, pitch: -2 },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setCloneStyle(st.id as any);
                        setCloneSpeed(st.speed);
                        setClonePitch(st.pitch);
                        setEnableNaturalCadence(true);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        cloneStyle === st.id
                          ? 'bg-purple-950/40 border-purple-500/60 shadow-md shadow-purple-500/10'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-semibold text-zinc-200">{st.label}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{st.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Speed & Pitch Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        ความเร็วในการพูด (Speed)
                      </span>
                      <span className="text-purple-300 font-bold">{cloneSpeed.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.80"
                      max="1.25"
                      step="0.02"
                      value={cloneSpeed}
                      onChange={(e) => setCloneSpeed(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>0.80x (ช้าผ่อนคลาย)</span>
                      <span>0.96x (พูดคุย)</span>
                      <span>1.25x (เร็ว)</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                        คีย์ระดับเสียง (Pitch)
                      </span>
                      <span className="text-cyan-300 font-bold">{clonePitch >= 0 ? `+${clonePitch}Hz` : `${clonePitch}Hz`}</span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      step="1"
                      value={clonePitch}
                      onChange={(e) => setClonePitch(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>-15Hz (ทุ้มลึก)</span>
                      <span>0Hz (ธรรมชาติ)</span>
                      <span>+15Hz (เสียงสูง)</span>
                    </div>
                  </div>
                </div>

                {/* Base Voice & Auto Breathing Switch */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-400">โทนเสียงฐาน:</span>
                    <div className="inline-flex rounded-lg bg-zinc-950/60 p-0.5 border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setCloneBaseVoice('auto')}
                        className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                          cloneBaseVoice === 'auto' ? 'bg-purple-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        🤖 ตรวจจับอัตโนมัติ
                      </button>
                      <button
                        type="button"
                        onClick={() => setCloneBaseVoice('female')}
                        className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                          cloneBaseVoice === 'female' ? 'bg-purple-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        👩 เสียงหญิง (Premwadee)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCloneBaseVoice('male')}
                        className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                          cloneBaseVoice === 'male' ? 'bg-purple-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        👨 เสียงชาย (Niwat)
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableNaturalCadence}
                      onChange={(e) => setEnableNaturalCadence(e.target.checked)}
                      className="accent-purple-500 rounded"
                    />
                    <span className="text-xs text-zinc-300">จังหวะหายใจและเว้นวรรคอัตโนมัติ (แนะนำ)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Standard Neural TTS Voices */}
          {activeTab === 'tts' && (
            <div className="bg-[#121724]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-zinc-100">เลือกคาแรคเตอร์เสียงพากย์</h2>
                </div>
                <span className="text-[11px] text-zinc-400">Microsoft Azure Neural Engine</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_VOICES.map((v) => {
                  const isSelected = selectedVoice === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                          : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={v.avatar}
                        alt={v.name}
                        className="w-11 h-11 rounded-full object-cover border border-zinc-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-zinc-200">{v.name}</h4>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {v.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">{v.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pitch and Speed Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/60">
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      ความเร็วเสียง (Speed)
                    </span>
                    <span className="text-cyan-400 font-bold">{speed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>0.5x ช้า</span>
                    <span>1.0x ปกติ</span>
                    <span>2.0x เร็ว</span>
                  </div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                      ระดับคีย์เสียง (Pitch)
                    </span>
                    <span className="text-purple-400 font-bold">
                      {pitch > 0 ? `+${pitch}Hz` : `${pitch}Hz`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    step="2"
                    value={pitch}
                    onChange={(e) => setPitch(parseInt(e.target.value))}
                    className="w-full accent-purple-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>ทุ้ม (-40Hz)</span>
                    <span>ปกติ (0Hz)</span>
                    <span>แหลม (+40Hz)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Script / Text Input Section */}
          <div className="bg-[#121724]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>สคริปต์ข้อความที่ต้องการให้ AI พูด</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                  {text.length} / 1,000 ตัวอักษร
                </span>
              </label>

              <button
                onClick={() => setText('')}
                className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
              >
                ล้างข้อความ
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="พิมพ์ข้อความภาษาไทย หรือภาษาอังกฤษ ที่ต้องการให้ AI พูดที่นี่..."
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 leading-relaxed resize-none transition-all"
            />

            {/* Quick Test Prompt Templates */}
            <div>
              <div className="text-[11px] text-zinc-400 mb-2 flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-amber-400" />
                <span>ตัวอย่างข้อความทดสอบด่วน:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setText(s)}
                    className="text-[11px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800/80 transition-all text-left truncate max-w-xs"
                  >
                    "{s.slice(0, 30)}..."
                  </button>
                ))}
              </div>
            </div>

            {/* Action Generate Button */}
            <div className="pt-2">
              <button
                disabled={isGenerating || (activeTab === 'clone' && !cloneAudioFile)}
                onClick={activeTab === 'clone' ? handleGenerateClone : handleGenerateTTS}
                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-xl ${
                  isGenerating || (activeTab === 'clone' && !cloneAudioFile)
                    ? 'bg-zinc-800/70 text-zinc-500 cursor-not-allowed border border-zinc-800'
                    : activeTab === 'clone'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-purple-600/30'
                    : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-600/30'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>
                      กำลังประมวลผลบนการ์ดจอ RTX 4060... (
                      {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:
                      {(elapsedSeconds % 60).toString().padStart(2, '0')})
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    <span>
                      {activeTab === 'clone'
                        ? 'เริ่มโคลนเสียง AI ด้วย CosyVoice 3.0 (RTX 4060)'
                        : 'สร้างเสียงพากย์ Neural Speech ทันที'}
                    </span>
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="mt-3.5 p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-purple-300 font-semibold">
                      <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span>{statusMessage || 'กำลังประมวลผลโมเดล AI...'}</span>
                    </span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-zinc-900 border border-purple-500/50 text-cyan-300 font-bold">
                      ⏱️ {Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:
                      {(elapsedSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-900/90 rounded-full h-2 overflow-hidden border border-zinc-800">
                    <div
                      className="bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-500 animate-pulse"
                      style={{ width: `${Math.min(95, Math.max(10, elapsedSeconds * 2.2))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                    <span>
                      ขั้นตอน:{' '}
                      {elapsedSeconds < 8
                        ? '1/3 วิเคราะห์เวกเตอร์เสียงต้นแบบ'
                        : elapsedSeconds < 25
                        ? '2/3 รัน CosyVoice บน CUDA RTX 4060'
                        : '3/3 สังเคราะห์คลื่นเสียง HiFT (ใกล้เสร็จ)'}
                    </span>
                    <span className="text-zinc-500">ใช้เวลาประมาณ ~30-60 วินาที</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Audio Player & History (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Main Audio Player Card */}
          <div className="bg-[#121724]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>ตัวเล่นเสียงผลลัพธ์ (Audio Player)</span>
              </h2>
              {currentAudioUrl && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  พร้อมฟัง
                </span>
              )}
            </div>

            {currentAudioUrl ? (
              <div className="flex flex-col gap-4">
                {/* Visualizer Wave Animation */}
                <div className="h-20 bg-zinc-950/60 rounded-xl border border-zinc-800/70 p-3 flex items-center justify-center gap-1">
                  {[40, 70, 30, 85, 95, 45, 60, 30, 75, 100, 60, 40, 80, 50, 90, 65, 35, 70].map(
                    (height, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 rounded-full transition-all duration-300 ${
                          isPlaying
                            ? 'bg-gradient-to-t from-purple-500 to-cyan-400 animate-pulse'
                            : 'bg-zinc-700/60'
                        }`}
                        style={{
                          height: isPlaying ? `${Math.max(15, Math.round(height * Math.random()))}%` : '20%',
                          animationDelay: `${idx * 50}ms`,
                        }}
                      />
                    )
                  )}
                </div>

                {/* Scrubber & Time */}
                <div className="flex flex-col gap-1.5">
                  <input
                    type="range"
                    min="0"
                    max={audioDuration || 100}
                    step="0.1"
                    value={audioCurrentTime}
                    onChange={handleSeek}
                    className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span>{formatTime(audioCurrentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                  </div>
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-transform active:scale-95"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>

                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                          setAudioCurrentTime(0);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all"
                      title="เริ่มเล่นใหม่"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Playback speed selector */}
                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    {[1.0, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`text-[10px] px-2 py-1 rounded font-semibold transition-all ${
                          playbackSpeed === spd
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  {/* Download Button */}
                  <a
                    href={currentAudioUrl}
                    download="ai_voice_generated.mp3"
                    className="p-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white transition-all shadow-md shadow-emerald-600/20"
                    title="ดาวน์โหลดไฟล์เสียง"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center text-zinc-500 gap-2.5">
                <FileAudio className="w-10 h-10 stroke-[1.2] text-zinc-600" />
                <p className="text-xs text-zinc-300 font-medium">พร้อมสร้างเสียงโคลนและเสียงพากย์</p>
                <p className="text-[11px] text-zinc-500 max-w-[240px]">
                  เลือกไฟล์เสียงต้นแบบ กรอกข้อความ แล้วกดปุ่มเพื่อเริ่มประมวลผลบนการ์ดจอ RTX 4060
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentAudioUrl('/audio/rtx4060_clone_ab3c866f5d84.wav');
                    setIsPlaying(true);
                  }}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/10 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ฟังตัวอย่างเสียงโคลนล่าสุด (RTX 4060)</span>
                </button>
              </div>
            )}
          </div>

          {/* History List */}
          <div className="bg-[#121724]/90 border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex-1 flex flex-col gap-3 min-h-[320px]">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-semibold text-zinc-200">ประวัติการสร้างเสียง (History)</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-[10px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>ล้างประวัติ</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 gap-2">
                <Clock className="w-8 h-8 stroke-[1.2] text-zinc-600" />
                <span className="text-xs">ไม่มีประวัติการสร้าง</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/60 border border-zinc-800/80 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            item.mode === 'clone'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {item.mode === 'clone' ? 'โคลนเสียง' : 'Neural'}
                        </span>
                        <span className="text-[10px] text-zinc-400">{item.createdAt}</span>
                      </div>
                      <p className="text-xs text-zinc-200 truncate">{item.text}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setCurrentAudioUrl(item.audioUrl);
                          setIsPlaying(true);
                          setTimeout(() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = 0;
                              audioRef.current.play().catch(console.error);
                            }
                          }, 50);
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-purple-600 text-zinc-300 hover:text-white transition-all"
                        title="เล่นเสียง"
                      >
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      </button>

                      <a
                        href={item.audioUrl}
                        download={`voice_${item.id}.mp3`}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white transition-all"
                        title="ดาวน์โหลด"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Hugging Face Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121724] border border-zinc-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowTokenModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">ตั้งค่า Hugging Face Token (ฟรี)</h3>
                <p className="text-xs text-zinc-400">ปลดล็อกโควต้า GPU สำหรับโคลนเสียงไม่จำกัด</p>
              </div>
            </div>

            <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-3.5 text-xs text-purple-200/90 leading-relaxed flex flex-col gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>ทำไมต้องใส่ Token?</span>
              </div>
              <p>
                โมเดล CosyVoice 3.0 ให้บริการประมวลผลบนการ์ดจอ A100 ฟรีผ่าน Hugging Face ZeroGPU หากไม่ใส่ Token ระบบจะใช้โควต้า IP ส่วนกลางซึ่งอาจติดคิวชั่วคราวได้
              </p>
              <p className="text-purple-300 font-medium">
                เพียงสมัครบัญชีฟรี 10 วินาที แล้วนำ Token มาใส่ คุณจะได้โควต้าส่วนตัวไม่จำกัดทันที 100% ฟรี!
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>Hugging Face Access Token (User Token):</span>
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>รับ Token ฟรีที่นี่</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <input
                type="password"
                value={hfToken}
                onChange={(e) => handleSaveToken(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {hfToken ? (
                <button
                  onClick={() => handleSaveToken('')}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  ลบ Token ออก
                </button>
              ) : <div />}

              <button
                onClick={() => setShowTokenModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
              >
                บันทึกและปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
