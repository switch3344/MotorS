import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { gsap } from "gsap";
import { NativeTimeline } from "./NativeTimeline";
import "./speedometer-video.css";

const asset = (file: string) => `${import.meta.env.BASE_URL}video/${file}`;
const PREVIEW = asset("gtr-preview-v3.mp4");
const FULL_VIDEO = asset("gtr_final_ready_v2.mp4");
const POSTER = asset("gtr-poster-v1.jpg");
const SOURCE = "https://www.youtube.com/watch?v=3LI1MHnLwB0";
export function SpeedometerVideo({ reduced }: { reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const watchButton = useRef<HTMLButtonElement>(null);
  const [showFull, setShowFull] = useState(false);
  const fullVisible = useRef(false);
  const warmTimer = useRef(0);
  const warmed = useRef(false);
  const stalls = useRef(0);
  const fullStarted = useRef(false);
  const [wanted, setWanted] = useState(!reduced);
  const [watching, setWatching] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(70);
  const [fullscreen, setFullscreen] = useState(false);
  const [status, setStatus] = useState("loading");
  const desired = useRef(wanted);
  const mode = useRef(watching);
  const previousWatching = useRef(false);
  const visible = useRef(false);
  desired.current = wanted;
  mode.current = watching;
  const sync = useRef<() => void>(() => {});

  useEffect(() => {
    if (previousWatching.current && !watching) watchButton.current?.focus({ preventScroll: true });
    previousWatching.current = watching;
  }, [watching]);

  useEffect(() => {
    const surface = root.current;
    const button = watchButton.current;
    if (!surface || !button || showFull || reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    gsap.set(button, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    const moveX = gsap.quickTo(button, "x", { duration: 0.45, ease: "power3.out" });
    const moveY = gsap.quickTo(button, "y", { duration: 0.45, ease: "power3.out" });
    const move = (event: PointerEvent) => {
      const bounds = surface.getBoundingClientRect();
      const halfWidth = button.offsetWidth / 2 + 20;
      const halfHeight = button.offsetHeight / 2 + 20;
      moveX(Math.max(halfWidth, Math.min(bounds.width - halfWidth, event.clientX - bounds.left)) - bounds.width / 2);
      moveY(Math.max(160, Math.min(bounds.height - halfHeight, event.clientY - bounds.top)) - bounds.height / 2);
    };
    const reset = () => { moveX(0); moveY(0); };
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerleave", reset);
    return () => {
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", reset);
      gsap.killTweensOf(button);
    };
  }, [reduced, showFull]);

  useEffect(() => { if (reduced && !mode.current) setWanted(false); }, [reduced]);
  useEffect(() => { sync.current(); }, [wanted]);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const requestPlay = (element: HTMLVideoElement) => {
    void element.play().catch((error: DOMException) => {
      if (error.name !== "AbortError" && visible.current && !document.hidden) setStatus("blocked");
    });
  };
  const warmFullVideo = () => {
    if (warmed.current) return;
    warmed.current = true;
    warmTimer.current = window.setTimeout(() => {
      if (!mode.current && visible.current && !document.hidden) video.current!.preload = "auto";
      else warmed.current = false;
    }, 1000);
  };
  useEffect(() => {
    const full = video.current!;
    const clip = preview.current!;
    const reconcile = () => {
      if (!visible.current || document.hidden) {
        full.pause(); clip.pause();
        if (mode.current) { desired.current = false; setWanted(false); }
      } else if (desired.current) {
        if (mode.current) requestPlay(full);
        else { clip.muted = true; requestPlay(clip); }
      } else { full.pause(); clip.pause(); }
    };
    sync.current = reconcile;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting && entry.intersectionRatio > 0.05;
      reconcile();
    }, { threshold: [0, 0.05, 0.15] });
    observer.observe(root.current!.closest(".hero-card")!);
    document.addEventListener("visibilitychange", reconcile);
    const metrics = window.setInterval(() => {
      const active = fullVisible.current ? full : clip;
      if (!visible.current || document.hidden || active.paused) return;
      const quality = active.getVideoPlaybackQuality?.();
      if (quality) {
        root.current!.dataset.droppedFrames = String(quality.droppedVideoFrames);
        root.current!.dataset.totalFrames = String(quality.totalVideoFrames);
      }
      root.current!.dataset.bufferStalls = String(stalls.current);
      root.current!.dataset.readyState = String(active.readyState);
    }, 1000);
    return () => {
      observer.disconnect();
      window.clearTimeout(warmTimer.current);
      window.clearInterval(metrics);
      document.removeEventListener("visibilitychange", reconcile);
      sync.current = () => {};
      full.pause(); clip.pause();
    };
  }, []);

  const watch = () => {
    const element = video.current;
    if (!element) return;
    mode.current = true;
    desired.current = true;
    setWatching(true);
    setWanted(true);
    if (element.currentTime > 0) element.currentTime = 0;
    element.muted = false;
    element.volume = (volume || 70) / 100;
    setMuted(false);
    setStatus("buffering");
    // Both video elements keep stable sources. Keep the preview visible until
    // the warmed full player produces its first playing frame.
    requestPlay(element);
  };
  const exitWatch = () => {
    mode.current = false;
    fullVisible.current = false;
    fullStarted.current = false;
    video.current!.pause();
    video.current!.muted = true;
    setWatching(false);
    setShowFull(false);
    setMuted(true);
    desired.current = !reduced;
    setWanted(!reduced);
    setStatus(reduced ? "paused" : "playing");
    if (document.fullscreenElement === root.current) void document.exitFullscreen().catch(() => {});
    if (!reduced && visible.current && !document.hidden) requestPlay(preview.current!);
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mode.current && !document.fullscreenElement) exitWatch();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [reduced]);
  const playing = wanted && (status === "playing" || status === "buffering");
  const togglePlayback = () => {
    const element = video.current;
    if (!element) return;
    if (status === "ended") element.currentTime = 0;
    desired.current = !playing;
    setWanted(!playing);
    if (playing) element.pause();
    else void element.play().catch(() => setStatus("blocked"));
  };
  const toggleMute = () => {
    const element = video.current;
    if (!element) return;
    element.muted = !element.muted;
    if (!element.muted && element.volume === 0) element.volume = (volume || 70) / 100;
    setMuted(element.muted);
  };
  const seek = (value: number) => {
    const element = video.current!;
    element.currentTime = value;
    if (visible.current && !document.hidden && desired.current) requestPlay(element);
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void root.current?.requestFullscreen().catch(() => {});
  };
  return (
    <div className="hero-speedometer-video" ref={root} data-state={status}
      data-mode={watching ? "watching" : "preview"} data-display={showFull ? "full" : "preview"} data-muted={muted} >
      <div className="hero-video-frame" onClick={(event) => {
        if ((event.target as HTMLElement).closest("button, a")) return;
        if (showFull) togglePlayback();
        else if (status !== "loading" && !watching) watch();
      }}>
        <video className={`hero-native-video hero-preview-video${showFull ? "" : " is-active"}`}
          ref={preview} src={PREVIEW} poster={POSTER} playsInline preload="auto" muted loop
          onCanPlay={() => { if (!mode.current) { setStatus(preview.current!.paused ? "paused" : "playing"); sync.current(); } }}
          onPlaying={() => { if (!mode.current) setStatus("playing"); warmFullVideo(); }}
          onPause={() => { if (!mode.current) setStatus("paused"); }}
          onError={() => { if (!mode.current) setStatus("unavailable"); }} />
        <video className={`hero-native-video hero-full-video${showFull ? " is-active" : ""}`}
          ref={video} src={FULL_VIDEO} poster={POSTER} playsInline preload="metadata"
          onPlaying={() => {
            if (!mode.current) { video.current!.pause(); return; }
            fullVisible.current = true;
            fullStarted.current = true;
            setShowFull(true);
            preview.current!.pause();
            setStatus("playing");
          }}
          onPause={() => { if (mode.current) setStatus("paused"); }}
          onWaiting={() => {
            if (!mode.current) return;
            if (fullStarted.current && !video.current!.seeking) stalls.current++;
            setStatus("buffering");
          }}
          onError={() => { if (mode.current) setStatus("unavailable"); }}
          onVolumeChange={(event) => { if (mode.current) setMuted(event.currentTarget.muted || event.currentTarget.volume === 0); }}
          onEnded={() => { setStatus("ended"); setWanted(false); desired.current = false; }} />
        {!showFull && status !== "unavailable" && (
          <button className="hero-video-watch" ref={watchButton} type="button" onClick={watch}
            disabled={status === "loading" || (watching && status === "buffering")} aria-label="Просмотреть видео со звуком">
            <Play size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            <span>{watching ? "Запускаем…" : status === "loading" ? "Загрузка…" : "Просмотреть видео"}</span>
          </button>
        )}
        {status === "unavailable" && (
          <a className="hero-video-fallback" href={SOURCE} target="_blank" rel="noreferrer">
            <Play size={32} /><span>Открыть исходное видео</span>
          </a>
        )}
      </div>
      {watching && (
        <button className="hero-video-exit" type="button" onClick={exitWatch} aria-label="Выйти из просмотра видео">
          <X size={16} /><span>Закрыть видео</span><kbd>Esc</kbd>
        </button>
      )}
      {showFull && status !== "unavailable" && (
        <div className="hero-video-controls video-support" role="group" aria-label="Управление видео">
          <NativeTimeline media={video} onSeek={seek} />
          <div className="hero-video-control-row">
            <button type="button" onClick={togglePlayback}
              aria-label={status === "ended" ? "Смотреть ещё раз" : playing ? "Приостановить видео" : "Воспроизвести видео"}>
              {status === "ended" ? <RotateCcw size={18} /> : playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button type="button" onClick={toggleMute} aria-label={muted ? "Включить звук" : "Выключить звук"}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input className="hero-video-volume" type="range" min="0" max="100" value={muted ? 0 : volume}
              aria-label="Громкость" onChange={(event) => {
                const value = Number(event.target.value);
                setVolume(value);
                if (video.current) {
                  video.current.volume = value / 100;
                  video.current.muted = value === 0;
                }
                setMuted(!value);
              }} />
            <button className="hero-video-fullscreen" type="button" onClick={toggleFullscreen}
              aria-label={fullscreen ? "Выйти из полноэкранного режима" : "На весь экран"}>
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      )}
      <div className="hero-video-footer video-support">
        <a href={SOURCE} target="_blank" rel="noreferrer">
          Авторевю · Nissan GT-R <ArrowUpRight size={14} />
        </a>
        {!watching && (
          <button className="hero-preview-toggle" type="button" onClick={() => setWanted(!wanted)}
            aria-label={wanted ? "Остановить превью" : "Продолжить превью"}>
            {wanted ? <Pause size={15} /> : <Play size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}
