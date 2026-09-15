import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, AlertCircle, Loader2 } from 'lucide-react';
import type { CustomSectionVideoConfig } from '../../data';

interface SectionVideoPlayerProps {
  src: string;
  config?: CustomSectionVideoConfig;
  className?: string;
  poster?: string;
}

export default function SectionVideoPlayer({
  src,
  config,
  className = '',
  poster,
}: SectionVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(config ? config.muted : true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const autoplay = config?.autoplay ?? true;
  const loop = config?.loop ?? true;
  const showControls = config?.controls ?? false;
  const wantsSound = config ? !config.muted : false;

  // Aspect ratio class
  const aspectRatioClass =
    config?.aspectRatio === '21/9'
      ? 'aspect-[21/9]'
      : config?.aspectRatio === '4/3'
        ? 'aspect-[4/3]'
        : config?.aspectRatio === '1/1'
          ? 'aspect-square'
          : 'aspect-[16/9]';

  // Height class
  const heightClass =
    config?.height === 'compact'
      ? 'max-h-[380px] md:max-h-[420px]'
      : config?.height === 'immersive'
        ? 'max-h-[75vh] min-h-[460px]'
        : 'max-h-[500px] md:max-h-[580px]';

  // Optimización de rendimiento: IntersectionObserver para reproducir solo cuando entra en pantalla
  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video || !autoplay) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.muted = isMuted;
            video
              .play()
              .then(() => setIsPlaying(true))
              .catch(() => {
                // Si el navegador bloquea autoplay con audio, reproducimos silenciado
                video.muted = true;
                setIsMuted(true);
                video.play().then(() => setIsPlaying(true)).catch(() => {});
              });
          } else {
            // Pausar fuera de vista para ahorrar GPU, CPU y batería
            if (!video.paused) {
              video.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src, autoplay, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    setUserInteracted(true);
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-black/40 border border-white/10 text-white/70 text-sm ${aspectRatioClass} ${heightClass} ${className}`}>
        <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
        <p className="font-medium">No se pudo reproducir el video.</p>
        <span className="text-xs text-white/50 mt-1">Verificá que el enlace o archivo sea un formato web válido (.mp4, .webm).</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative group overflow-hidden bg-black/30 rounded-sm border border-hairline/30 shadow-2xl ${aspectRatioClass} ${heightClass} ${className}`}
    >
      {/* Shimmer / Spinner mientras carga los metadatos */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper-soft/10 backdrop-blur-sm z-10">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      )}

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoplay}
        muted={isMuted}
        loop={loop}
        controls={showControls}
        playsInline
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setError(true)}
        onClick={togglePlay}
        className={`w-full h-full object-cover cursor-pointer transition-opacity duration-700 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      />

      {/* Botón flotante para activar audio si se configuró con sonido pero arrancó silenciado por política del navegador */}
      {wantsSound && isMuted && !userInteracted && isLoaded && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-5 left-5 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/25 text-white text-xs font-medium shadow-2xl transition-all hover:scale-105"
          title="Activar audio"
        >
          <VolumeX className="w-4 h-4 text-brand-400 animate-pulse" />
          <span>Activar sonido</span>
        </button>
      )}

      {/* Barra de controles minimalistas si showControls es false */}
      {!showControls && isLoaded && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            onClick={toggleSound}
            className="p-2.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white hover:bg-black/90 hover:scale-110 transition-all shadow-lg"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-300" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="p-2.5 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white hover:bg-black/90 hover:scale-110 transition-all shadow-lg"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </button>
        </div>
      )}
    </div>
  );
}
