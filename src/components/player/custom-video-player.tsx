'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, FastForward, Rewind } from 'lucide-react';
import { motion } from 'framer-motion';
import { extractYouTubeId } from '@/lib/video-helper';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function CustomVideoPlayer({ 
  videoId, 
  onProgress, 
  initialTime = 0 
}: { 
  videoId: string; 
  onProgress?: (time: number) => void; 
  initialTime?: number; 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanVideoId = extractYouTubeId(videoId);

  useEffect(() => {
    // Carrega a API do YouTube
    if (typeof window !== 'undefined' && !window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      const targetId = `youtube-player-${cleanVideoId}`;
      const el = document.getElementById(targetId);
      if (!el || !window.YT || !window.YT.Player) return;

      try {
        if (playerRef.current?.destroy) {
          playerRef.current.destroy();
        }
      } catch {}

      try {
        playerRef.current = new window.YT.Player(targetId, {
          videoId: cleanVideoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            start: Math.floor(initialTime),
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              try {
                setDuration(event.target.getDuration());
                event.target.setVolume(volume);
              } catch {}
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                onProgress?.(event.target.getCurrentTime());
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                onProgress?.(event.target.getCurrentTime());
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player note:', err);
            },
          },
        });
      } catch (err) {
        console.warn('Erro ao inicializar YouTube player:', err);
      }
    };

    let timer: NodeJS.Timeout | null = null;
    if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
      timer = setTimeout(initPlayer, 50);
    } else if (typeof window !== 'undefined') {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (timer) clearTimeout(timer);
      try {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          onProgress?.(playerRef.current.getCurrentTime());
        }
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, [cleanVideoId, initialTime, onProgress, volume]);

  // Sincronizar o progresso a cada segundo e salvar a cada 10s
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && playerRef.current?.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        
        if (Math.floor(time) % 10 === 0 && Math.floor(time) > 0) {
          onProgress?.(time);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, onProgress]);

  const togglePlay = () => {
    if (isPlaying) playerRef.current?.pauseVideo();
    else playerRef.current?.playVideo();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    playerRef.current?.seekTo(time);
  };

  const skip = (seconds: number) => {
    if (playerRef.current) {
      const newTime = playerRef.current.getCurrentTime() + seconds;
      playerRef.current.seekTo(newTime);
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      playerRef.current?.unMute();
      setIsMuted(false);
    } else {
      playerRef.current?.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    playerRef.current?.setVolume(val);
    if (val === 0) setIsMuted(true);
    else if (isMuted) setIsMuted(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '00:00';
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl border border-white/5"
    >
      {/* IFrame invisível para cliques diretos */}
      <div className="absolute inset-0 w-full h-full pointer-events-none opacity-100 scale-[1.02]">
        <div id={`youtube-player-${cleanVideoId}`} className="w-full h-full" />
      </div>
      
      {/* Overlay transparente bloqueando interação direta com o YouTube */}
      <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay} />

      {/* Interface de Controles Premium */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end"
      >
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        <div className="relative p-6 space-y-4 pointer-events-auto">
          {/* Progress Bar */}
          <div className="flex items-center gap-4 group/slider">
            <span className="text-white/80 text-sm font-medium w-12 text-center tabular-nums">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer hover:h-2 transition-all"
              style={{
                background: `linear-gradient(to right, #BFA783 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`
              }}
            />
            <span className="text-white/80 text-sm font-medium w-12 text-center tabular-nums">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:text-[#BFA783] transition-transform hover:scale-110 active:scale-95">
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current pl-1" />}
              </button>
              
              <button onClick={() => skip(-10)} className="text-white/80 hover:text-white transition-colors" title="Voltar 10s">
                <Rewind className="w-5 h-5 fill-current" />
              </button>
              <button onClick={() => skip(10)} className="text-white/80 hover:text-white transition-colors" title="Avançar 10s">
                <FastForward className="w-5 h-5 fill-current" />
              </button>

              <div className="flex items-center gap-2 group/volume relative ml-4">
                <button onClick={toggleMute} className="text-white hover:text-[#BFA783] transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, white ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%)`
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <select 
                value={playbackRate}
                onChange={(e) => {
                  const rate = Number(e.target.value);
                  setPlaybackRate(rate);
                  playerRef.current?.setPlaybackRate(rate);
                }}
                className="bg-transparent text-white text-sm font-medium outline-none cursor-pointer hover:text-[#BFA783] transition-colors appearance-none"
              >
                <option value={1} className="bg-[#050806]">1.0x</option>
                <option value={1.25} className="bg-[#050806]">1.25x</option>
                <option value={1.5} className="bg-[#050806]">1.5x</option>
                <option value={2} className="bg-[#050806]">2.0x</option>
              </select>

              <button onClick={toggleFullscreen} className="text-white hover:text-[#BFA783] transition-colors hover:scale-110">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
