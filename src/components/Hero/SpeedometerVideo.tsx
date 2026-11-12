import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize, Minimize, Play, Volume2, VolumeX, X } from "lucide-react";
import { gsap } from "gsap";
import "./speedometer-video.css";

const asset = (file: string) => `${import.meta.env.BASE_URL}video/${file}`;
const PREVIEW = asset("gtr-preview-v5.mp4");
const FULL_VIDEO = asset("gtr_final_ready_v7.mp4");
const POSTER = asset("gtr-poster-v2.jpg");
const SOURCE = "https://www.youtube.com/watch?v=3LI1MHnLwB0";

export function SpeedometerVideo({
  reduced,
  completed,
  onComplete,
}: {
  reduced: boolean;
  completed: boolean;
  onComplete: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const preview = useRef<HTMLVideoElement>(null);
  const watchButton = useRef<HTMLButtonElement>(null);
  const [watching, setWatching] = useState(false);
  const [wanted, setWanted] = useState(!reduced);
  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [status, setStatus] = useState("loading");
  const [controls, setControls] = useState(true);
  const finished = useRef(completed);
  const mode = useRef(false);
  const desired = useRef(wanted);
  const visible = useRef(false);
  const started = useRef(false);
  const previousWatching = useRef(false);
  const warmTimer = useRef(0);
  const idleTimer = useRef(0);
  const warmed = useRef(false);
  const stalls = useRef(0);
  const sync = useRef<() => void>(() => {});
  mode.current = watching;
  desired.current = wanted;
  const playing = wanted && (status === "playing" || status === "buffering");

  const revealControls = () => {
    setControls(true);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setControls(false), 2000);
  };
  const requestPlay = (element: HTMLVideoElement) => {
    void element.play().catch((error: DOMException) => {
      if (error.name !== "AbortError" && visible.current && !document.hidden)
        setStatus("blocked");
    });
  };
  useLayoutEffect(() => {
    if (previousWatching.current && !watching)
      (finished.current
        ? document.getElementById("hero-title")
        : watchButton.current
      )?.focus({ preventScroll: true });
    previousWatching.current = watching;
    if (!watching) return;
    const overflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    const gutter = document.documentElement.style.scrollbarGutter;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.scrollbarGutter = "auto";
    return () => {
      document.body.style.overflow = overflow;
      document.documentElement.style.overflow = rootOverflow;
      document.documentElement.style.scrollbarGutter = gutter;
    };
  }, [watching]);
  useEffect(() => {
    const surface = root.current;
    const button = watchButton.current;
    if (!surface || !button || watching || reduced || completed) return;
    const query = matchMedia(
      "(min-width: 700px) and (hover: hover) and (pointer: fine)",
    );
    gsap.set(button, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
    const x = gsap.quickTo(button, "x", { duration: 0.45, ease: "power3.out" });
    const y = gsap.quickTo(button, "y", { duration: 0.45, ease: "power3.out" });
    const move = (event: PointerEvent) => {
      if (!query.matches) return;
      const r = surface.getBoundingClientRect();
      const hw = button.offsetWidth / 2 + 20,
        hh = button.offsetHeight / 2 + 20;
      x(
        Math.max(hw, Math.min(r.width - hw, event.clientX - r.left)) -
          r.width / 2,
      );
      y(
        Math.max(160, Math.min(r.height - hh, event.clientY - r.top)) -
          r.height / 2,
      );
    };
    const reset = () => {
      x(0);
      y(0);
    };
    window.addEventListener("resize", reset);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("resize", reset);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", reset);
      gsap.killTweensOf(button);
    };
  }, [watching, reduced, completed]);
  useEffect(() => {
    if (reduced && !mode.current) setWanted(false);
  }, [reduced]);
  useEffect(() => {
    sync.current();
  }, [wanted]);
  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === dialog.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const warm = () => {
    if (warmed.current || finished.current) return;
    warmed.current = true;
    const prepare = () => {
      if (
        finished.current ||
        mode.current ||
        !visible.current ||
        document.hidden
      ) {
        warmed.current = false;
        return;
      }
      if (root.current?.closest("[inert]")) {
        warmTimer.current = window.setTimeout(prepare, 500);
        return;
      }
      video.current!.preload = "auto";
    };
    warmTimer.current = window.setTimeout(prepare, 1000);
  };
  useEffect(() => {
    const full = video.current!,
      clip = preview.current!;
    const reconcile = () => {
      if (finished.current || !visible.current || document.hidden) {
        full.pause();
        clip.pause();
        if (mode.current) {
          desired.current = false;
          setWanted(false);
        }
      } else if (desired.current) {
        if (mode.current) requestPlay(full);
        else {
          clip.muted = true;
          requestPlay(clip);
        }
      } else {
        full.pause();
        clip.pause();
      }
    };
    sync.current = reconcile;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current =
          entry.isIntersecting && entry.intersectionRatio > 0.05;
        reconcile();
      },
      { threshold: [0, 0.05, 0.15] },
    );
    observer.observe(root.current!.closest(".hero-card")!);
    document.addEventListener("visibilitychange", reconcile);
    const metrics = window.setInterval(() => {
      const active = mode.current ? full : clip;
      if (!visible.current || document.hidden || active.paused) return;
      const q = active.getVideoPlaybackQuality?.();
      if (q) {
        root.current!.dataset.droppedFrames = String(q.droppedVideoFrames);
        root.current!.dataset.totalFrames = String(q.totalVideoFrames);
      }
      root.current!.dataset.bufferStalls = String(stalls.current);
      root.current!.dataset.readyState = String(active.readyState);
    }, 1000);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", reconcile);
      window.clearInterval(metrics);
      window.clearTimeout(warmTimer.current);
      window.clearTimeout(idleTimer.current);
      sync.current = () => {};
      full.pause();
      clip.pause();
    };
  }, []);

  const watch = () => {
    if (finished.current || completed) return;
    const full = video.current!;
    mode.current = true;
    desired.current = true;
    setWatching(true);
    setWanted(true);
    setMuted(false);
    setStatus("buffering");
    started.current = false;
    if (full.currentTime > 0) full.currentTime = 0;
    full.muted = false;
    full.volume = 0.7;
    if (!dialog.current!.open) dialog.current!.showModal();
    revealControls();
    requestPlay(full);
  };
  const exit = () => {
    mode.current = false;
    video.current!.pause();
    video.current!.muted = true;
    setWatching(false);
    setMuted(true);
    setWanted(!reduced && !finished.current);
    desired.current = !reduced && !finished.current;
    setStatus(finished.current ? "completed" : reduced ? "paused" : "playing");
    window.clearTimeout(idleTimer.current);
    if (document.fullscreenElement === dialog.current)
      void document.exitFullscreen().catch(() => {});
    dialog.current?.close();
    if (!finished.current && !reduced && visible.current && !document.hidden)
      requestPlay(preview.current!);
  };
  const finish = () => {
    finished.current = true;
    preview.current!.pause();
    onComplete();
    exit();
  };
  const toggle = () => {
    if (finished.current || completed) return;
    desired.current = !playing;
    setWanted(!playing);
    if (playing) video.current!.pause();
    else requestPlay(video.current!);
    revealControls();
  };
  const toggleMute = () => {
    const full = video.current!;
    full.muted = !full.muted;
    if (!full.muted && !full.volume) full.volume = 0.7;
    setMuted(full.muted);
    revealControls();
  };
  const toggleFullscreen = () => {
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => {});
    else void dialog.current?.requestFullscreen().catch(() => {});
  };

  return (
    <>
      <div
        className="hero-speedometer-video"
        ref={root}
        data-state={status}
        data-completed={completed}
        data-mode={watching ? "watching" : "preview"}
        data-muted={muted}
      >
        <div
          className="hero-video-frame"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button, a")) return;
            if (!completed && !watching && status !== "loading") watch();
          }}
        >
          <video
            className="hero-native-video"
            ref={preview}
            src={PREVIEW}
            poster={POSTER}
            playsInline
            preload="auto"
            muted
            loop={!completed}
            onCanPlay={() => {
              if (!mode.current && !finished.current) {
                setStatus(preview.current!.paused ? "paused" : "playing");
                sync.current();
              }
            }}
            onPlaying={() => {
              if (finished.current) {
                preview.current!.pause();
                return;
              }
              if (!mode.current) setStatus("playing");
              warm();
            }}
            onPause={() => {
              if (!mode.current && !finished.current) setStatus("paused");
            }}
            onError={() => {
              if (!mode.current && !finished.current) setStatus("unavailable");
            }}
          />
          {!completed && !watching && status !== "unavailable" && (
            <button
              className="hero-video-watch"
              ref={watchButton}
              type="button"
              onClick={watch}
              disabled={status === "loading"}
              aria-label="Просмотреть видео со звуком"
            >
              <Play
                size={14}
                fill="currentColor"
                strokeWidth={0}
                aria-hidden="true"
              />
              <span>
                {status === "loading" ? "Загрузка…" : "Просмотреть видео"}
              </span>
            </button>
          )}
          {!watching && status === "unavailable" && (
            <a
              className="hero-video-fallback"
              href={SOURCE}
              target="_blank"
              rel="noreferrer"
            >
              <Play size={32} />
              <span>Открыть исходное видео</span>
            </a>
          )}
        </div>
      </div>
      {createPortal(
        <dialog
          ref={dialog}
          className="hero-cinema"
          aria-label="Разгон Nissan GT-R — MotorServiceKRD"
          data-state={status}
          data-controls={controls || !playing ? "visible" : "hidden"}
          onPointerMove={revealControls}
          onCancel={(event) => {
            event.preventDefault();
            exit();
          }}
          onClose={() => {
            if (mode.current) exit();
          }}
        >
          <div
            className="cinema-frame"
            role={status !== "unavailable" ? "button" : undefined}
            tabIndex={0}
            aria-label={
              playing
                ? "Приостановить видео"
                : status === "ended"
                  ? "Повторить видео"
                  : "Продолжить видео"
            }
            onClick={(event) => {
              if (!(event.target as HTMLElement).closest("a")) toggle();
            }}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggle();
              }
            }}
          >
            <video
              className="cinema-video"
              ref={video}
              src={FULL_VIDEO}
              poster={POSTER}
              playsInline
              preload="metadata"
              onPlaying={() => {
                if (!mode.current) {
                  video.current!.pause();
                  return;
                }
                started.current = true;
                preview.current!.pause();
                setStatus("playing");
                revealControls();
              }}
              onPause={() => {
                if (mode.current) {
                  setStatus("paused");
                  setControls(true);
                }
              }}
              onWaiting={() => {
                if (mode.current) {
                  if (started.current) stalls.current++;
                  setStatus("buffering");
                }
              }}
              onError={() => {
                if (mode.current) setStatus("unavailable");
              }}
              onVolumeChange={(event) => {
                if (mode.current)
                  setMuted(
                    event.currentTarget.muted || !event.currentTarget.volume,
                  );
              }}
              onEnded={finish}
            />
            {!playing && status !== "unavailable" && status !== "ended" && (
              <Play
                className="cinema-pause-mark"
                size={34}
                fill="currentColor"
                strokeWidth={0}
                aria-hidden="true"
              />
            )}
            {status === "unavailable" && (
              <a
                className="hero-video-fallback"
                href={SOURCE}
                target="_blank"
                rel="noreferrer"
              >
                Открыть исходное видео
              </a>
            )}
          </div>
          <div
            className="cinema-actions"
            role="group"
            aria-label="Управление видео"
            onFocusCapture={() => setControls(true)}
          >
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Включить звук" : "Выключить звук"}
              title={muted ? "Включить звук" : "Выключить звук"}
            >
              {muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={
                fullscreen ? "Выйти из полноэкранного режима" : "На весь экран"
              }
              title="На весь экран"
            >
              {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <button
              type="button"
              onClick={exit}
              aria-label="Выйти из просмотра видео"
              title="Закрыть · Esc"
            >
              <X size={25} />
            </button>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
