import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Radio, VolumeOff, Headphones, Music, Heart } from 'lucide-react';
import { VideoState } from '../types/index.js';
import { FloatingReactions, FloatingItem } from './FloatingReactions.js';

interface VideoPlayerProps {
  video: VideoState;
  reactions: FloatingItem[];
  onRemoveReaction: (id: string) => void;
  isSomeoneSpeaking: boolean;
  isAudioDuckingEnabled: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onToggleAudioDucking: () => void;
  onPlay: (currentTime: number, duration?: number) => void;
  onPause: (currentTime: number, duration?: number) => void;
  onSeek: (currentTime: number, duration?: number) => void;
  onVideoEnd: () => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  reactions,
  onRemoveReaction,
  isSomeoneSpeaking,
  isAudioDuckingEnabled,
  isFavorite,
  onToggleFavorite,
  onToggleAudioDucking,
  onPlay,
  onPause,
  onSeek,
  onVideoEnd,
  onNextTrack,
  onPrevTrack,
  onShowToast,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted to guarantee browser autoplay
  const [showUnmutePrompt, setShowUnmutePrompt] = useState(true);

  // Keep latest props in refs to avoid stale closures
  const videoRef = useRef<VideoState>(video);
  videoRef.current = video;

  const isApplyingRemoteRef = useRef(false);
  const currentVideoIdRef = useRef(video.videoId);
  const lastDriftToastRef = useRef(0);
  const hasEndedRef = useRef(false);

  useEffect(() => {
    hasEndedRef.current = false;
  }, [video.videoId]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const calculateTargetTime = (targetVideo: VideoState): number => {
    let targetTime = targetVideo.currentTime || 0;
    if (targetVideo.isPlaying) {
      const elapsed = (Date.now() - targetVideo.lastUpdated) / 1000;
      if (targetVideo.duration && targetVideo.duration > 0) {
        targetTime = Math.min(targetVideo.duration, targetTime + elapsed);
      } else {
        targetTime = targetTime + elapsed;
      }
    }
    return Math.max(0, targetTime);
  };

  const initPlayer = () => {
    if (playerRef.current) return;

    if (!window.YT || !window.YT.Player) {
      setTimeout(initPlayer, 200);
      return;
    }

    const currentVid = videoRef.current;
    if (!currentVid.videoId) {
      return;
    }

    const iframeElem = document.getElementById('youtube-iframe');
    if (!iframeElem) {
      setTimeout(initPlayer, 100);
      return;
    }

    const startSec = Math.floor(calculateTargetTime(currentVid));

    playerRef.current = new window.YT.Player('youtube-iframe', {
      videoId: currentVid.videoId,
      playerVars: {
        autoplay: 1,
        mute: 1, // Muted autoplay is allowed by 100% of modern browsers!
        start: startSec > 0 ? startSec : 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        enablejsapi: 1,
      },
      events: {
        onReady: (event: any) => {
          setIsPlayerReady(true);
          const freshVideo = videoRef.current;
          applyRoomVideoState(freshVideo, true);
        },
        onStateChange: handlePlayerStateChange,
        onError: (e: any) => {
          console.warn('YouTube Player error:', e);
        },
      },
    });
  };

  // Handle local user actions on the player
  const handlePlayerStateChange = (event: any) => {
    const state = event.data;

    // 0: ENDED - Always trigger onVideoEnd immediately, even if remote sync was active
    if (state === 0) {
      if (!hasEndedRef.current) {
        hasEndedRef.current = true;
        onVideoEnd();
      }
      return;
    }

    if (!playerRef.current || isApplyingRemoteRef.current) {
      return;
    }

    const currentTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
    const duration = playerRef.current.getDuration ? playerRef.current.getDuration() : 0;

    // 1: PLAYING
    if (state === 1) {
      if (duration > 0 && currentTime < duration - 2) {
        hasEndedRef.current = false;
      }
      onPlay(currentTime, duration);
    }
    // 2: PAUSED
    else if (state === 2) {
      onPause(currentTime, duration);
    }
  };

  // Safely apply remote video state
  const applyRoomVideoState = useCallback(
    (targetVideo: VideoState, forceSeek = false) => {
      const player = playerRef.current;
      if (!player || !player.getPlayerState) return;

      isApplyingRemoteRef.current = true;

      try {
        const targetTime = calculateTargetTime(targetVideo);

        // If target video ID is empty (Standby mode)
        if (!targetVideo.videoId) {
          currentVideoIdRef.current = '';
          if (playerRef.current?.destroy) {
            try {
              playerRef.current.destroy();
            } catch (e) {}
            playerRef.current = null;
          }
          setIsPlayerReady(false);
          return;
        }

        // If video ID changed
        if (currentVideoIdRef.current !== targetVideo.videoId) {
          currentVideoIdRef.current = targetVideo.videoId;
          player.loadVideoById({
            videoId: targetVideo.videoId,
            startSeconds: targetTime,
          });
          if (!targetVideo.isPlaying) {
            setTimeout(() => {
              try {
                player.pauseVideo();
              } catch (e) {}
            }, 300);
          }
        } else {
          // Same video ID: check time drift & play/pause
          const localTime = player.getCurrentTime ? player.getCurrentTime() : 0;
          const drift = Math.abs(localTime - targetTime);

          // Only seek if difference is noticeable (> 2.0s) or forced
          if (forceSeek || drift > 2.0) {
            player.seekTo(targetTime, true);
          }

          const currentState = player.getPlayerState ? player.getPlayerState() : -1;
          if (targetVideo.isPlaying && currentState !== 1) {
            try {
              if (isMuted && player.mute) {
                player.mute();
              }
              player.playVideo();
            } catch (e) {}
          } else if (!targetVideo.isPlaying && currentState !== 2) {
            try {
              player.pauseVideo();
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error('Error applying remote video state:', err);
      } finally {
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 600);
      }
    },
    [isMuted]
  );

  // When room video updates from WebSocket
  useEffect(() => {
    if (!video.videoId) {
      currentVideoIdRef.current = '';
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
      setIsPlayerReady(false);
      return;
    }

    if (!isPlayerReady || !playerRef.current) {
      initPlayer();
      return;
    }
    applyRoomVideoState(video);
  }, [video, isPlayerReady, applyRoomVideoState]);

  // Periodic Drift Correction Engine:
  // Runs every 3 seconds ONLY WHEN local player is actually PLAYING (state === 1)
  useEffect(() => {
    if (!isPlayerReady || !video.isPlaying) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !player.getPlayerState || !player.getCurrentTime || isApplyingRemoteRef.current) {
        return;
      }

      // CRITICAL FIX: Only check drift if local player is actively PLAYING!
      // State 1 = PLAYING. If buffering (3), paused (2), unstarted (-1), skip!
      const playerState = player.getPlayerState();
      if (playerState !== 1) {
        return;
      }

      // If duration is 0 or livestream, skip drift correction
      const duration = player.getDuration ? player.getDuration() : 0;
      if (duration === 0) {
        return;
      }

      const localTime = player.getCurrentTime();

      // Fallback watchdog: if video is within 0.8s of the end or past duration
      if (duration > 5 && localTime >= duration - 0.8) {
        if (!hasEndedRef.current) {
          hasEndedRef.current = true;
          onVideoEnd();
        }
        return;
      }

      const expectedTime = calculateTargetTime(video);
      const drift = Math.abs(localTime - expectedTime);

      // If drift is significant (> 2.5s) and within video duration bounds
      if (drift > 2.5 && drift < duration) {
        isApplyingRemoteRef.current = true;
        player.seekTo(expectedTime, true);

        // Rate-limit toast: at most once every 25 seconds to prevent spam!
        const now = Date.now();
        if (now - lastDriftToastRef.current > 25000) {
          lastDriftToastRef.current = now;
          onShowToast('ซิงค์เวลาคลิปให้ตรงกับห้องอัตโนมัติ (Drift Correction)', 'info');
        }

        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 600);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlayerReady, video, onShowToast]);

  // Audio Ducking: Smoothly lower YouTube volume to 25% when someone on stage is speaking
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.setVolume) return;
    try {
      if (isAudioDuckingEnabled && isSomeoneSpeaking) {
        playerRef.current.setVolume(25);
      } else if (!isMuted) {
        playerRef.current.setVolume(100);
      }
    } catch (e) {
      // ignore
    }
  }, [isSomeoneSpeaking, isAudioDuckingEnabled, isMuted]);

  // Top-level HTML5 Audio Keep-Alive for background playback & lock screen control on mobile
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 1-second silent WAV base64
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    audio.loop = true;
    audio.volume = 0.05;
    silentAudioRef.current = audio;

    const startAudioOnInteraction = () => {
      if (silentAudioRef.current && silentAudioRef.current.paused) {
        silentAudioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', startAudioOnInteraction, { once: true });
    window.addEventListener('touchstart', startAudioOnInteraction, { once: true });

    return () => {
      window.removeEventListener('click', startAudioOnInteraction);
      window.removeEventListener('touchstart', startAudioOnInteraction);
      audio.pause();
      audio.src = '';
      silentAudioRef.current = null;
    };
  }, []);

  // MediaSession API integration (Lock screen, Dynamic Island, Control Center, Bluetooth earphones)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !video.videoId) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: video.title || 'pleng.online Music',
        artist: video.channel || 'pleng.online',
        album: 'pleng.online',
        artwork: [
          {
            src: `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
            sizes: '480x360',
            type: 'image/jpeg',
          },
          {
            src: `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`,
            sizes: '320x180',
            type: 'image/jpeg',
          },
        ],
      });

      // Sync playback state to OS lock screen
      navigator.mediaSession.playbackState = video.isPlaying ? 'playing' : 'paused';

      // Keep silent audio loop in sync to retain background audio session on iOS/Android
      if (video.isPlaying) {
        silentAudioRef.current?.play().catch(() => {});
      } else {
        silentAudioRef.current?.pause();
      }

      navigator.mediaSession.setActionHandler('play', () => {
        silentAudioRef.current?.play().catch(() => {});
        if (playerRef.current?.playVideo) {
          playerRef.current.playVideo();
        }
        navigator.mediaSession.playbackState = 'playing';
        onPlay(videoRef.current.currentTime);
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        silentAudioRef.current?.pause();
        if (playerRef.current?.pauseVideo) {
          playerRef.current.pauseVideo();
        }
        navigator.mediaSession.playbackState = 'paused';
        onPause(videoRef.current.currentTime);
      });

      if (onNextTrack) {
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          onNextTrack();
        });
      }

      if (onPrevTrack) {
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          onPrevTrack();
        });
      }

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          if (playerRef.current?.seekTo) {
            playerRef.current.seekTo(details.seekTime, true);
          }
          onSeek(details.seekTime);
        }
      });
    } catch (err) {
      console.warn('MediaSession error:', err);
    }
  }, [video.videoId, video.title, video.channel, video.isPlaying, onNextTrack, onPrevTrack, onPlay, onPause, onSeek]);

  // Unmute handler
  const handleUnmute = () => {
    if (silentAudioRef.current && silentAudioRef.current.paused) {
      silentAudioRef.current.play().catch(() => {});
    }
    if (playerRef.current) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        setIsMuted(false);
        setShowUnmutePrompt(false);
        onShowToast('เปิดเสียงวิดีโอแล้ว 🔊', 'success');
      } catch (err) {
        console.warn('Unmute error:', err);
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      handleUnmute();
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => console.error(err));
      } else {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800/80 group flex items-center justify-center mx-auto"
    >
      {/* YouTube IFrame container or Standby UI */}
      {video.videoId ? (
        <div id="youtube-iframe" className="w-full h-full pointer-events-auto" />
      ) : (
        <div className="flex flex-col items-center justify-center text-[#615d59] gap-3 p-6 text-center select-none animate-fade-in max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#e6e6e6] flex items-center justify-center text-[#0075de] shadow-xs">
            <Music className="w-8 h-8 text-[#0075de] animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm sm:text-base font-bold text-white">ห้องอยู่ในโหมด Standby 🎵</h3>
            <p className="text-xs text-white/80 leading-relaxed">
              ยังไม่มีเพลงกำลังเล่นในห้องนี้ — ค้นหาเพลงหรือวางลิงก์ YouTube ที่แถบคิวเพลงเพื่อเริ่มฟังพร้อมกันได้เลย!
            </p>
          </div>
        </div>
      )}

      {/* Floating Live Reactions Layer */}
      <FloatingReactions reactions={reactions} onRemove={onRemoveReaction} />

      {/* Prominent floating Unmute button overlay when video autoplays muted */}
      {showUnmutePrompt && isMuted && (
        <div className="absolute top-4 left-4 z-30 animate-fade-in">
          <button
            onClick={handleUnmute}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white font-semibold text-xs shadow-md border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <VolumeOff className="w-4 h-4 animate-bounce text-amber-300" />
            <span>แตะที่นี่เพื่อเปิดเสียง (Unmute)</span>
          </button>
        </div>
      )}

      {/* Audio Ducking Active Badge Indicator */}
      {isAudioDuckingEnabled && isSomeoneSpeaking && (
        <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-full bg-[#1aae39] text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md animate-pulse">
          <Headphones className="w-3.5 h-3.5 text-white" />
          <span>ลดเสียงคลิปชั่วคราว (เพื่อนกำลังพูด)</span>
        </div>
      )}

      {/* Quick Player Control Overlay (Top right) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-md p-1 rounded-full border border-[#e6e6e6] shadow-xs">
        {video.videoId && onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            title={isFavorite ? 'ลบออกจากเพลงโปรด' : 'บันทึกเพลงนี้เป็นเพลงโปรด ❤️'}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isFavorite
                ? 'text-rose-600 bg-rose-50'
                : 'text-[#615d59] hover:text-rose-600 hover:bg-black/5'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
        <button
          onClick={onToggleAudioDucking}
          title={isAudioDuckingEnabled ? 'เปิดระบบลดเสียงคลิปเวลาคนพูดอยู่ (คลิกเพื่อปิด)' : 'ปิดระบบลดเสียงคลิปเวลาคนพูดอยู่ (คลิกเพื่อเปิด)'}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            isAudioDuckingEnabled ? 'text-[#1aae39] bg-[#1aae39]/10' : 'text-[#615d59] hover:text-[#000000] hover:bg-black/5'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={toggleMute}
          title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
          className="p-1.5 rounded-full text-[#615d59] hover:text-[#000000] hover:bg-black/5 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleFullscreen}
          title="เต็มจอ (Fullscreen)"
          className="p-1.5 rounded-full text-[#615d59] hover:text-[#000000] hover:bg-black/5 transition-colors cursor-pointer"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
