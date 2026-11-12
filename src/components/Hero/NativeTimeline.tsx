import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const stamp = (seconds: number) => {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
};

/** The media clock updates only these two DOM nodes, never the video tree. */
export function NativeTimeline({ media, onSeek }: {
  media: RefObject<HTMLVideoElement | null>;
  onSeek: (seconds: number, resume: boolean) => void;
}) {
  const range = useRef<HTMLInputElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const dragging = useRef(false);
  const resume = useRef(false);
  const pending = useRef(0);
  const debounce = useRef(0);
  const seekCallback = useRef(onSeek);
  seekCallback.current = onSeek;
  useEffect(() => {
    const video = media.current!;
    let raf = 0, last = 0, previousLabel = "";
    const paint = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 66;
      range.current!.max = String(duration);
      if (!dragging.current && !debounce.current) range.current!.value = String(video.currentTime);
      const current = dragging.current || debounce.current ? pending.current : video.currentTime;
      range.current!.style.setProperty("--progress", `${duration > 0 ? current / duration * 100 : 0}%`);
      const text = `${stamp(current)} / ${stamp(duration)}`;
      if (text !== previousLabel) {
        label.current!.textContent = text;
        range.current!.setAttribute("aria-valuetext", text);
        previousLabel = text;
      }
    };
    const tick = (time: number) => {
      raf = 0;
      if (video.paused || video.ended || document.hidden) return;
      if (time - last >= 32) { paint(); last = time; }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; paint(); };
    const events = ["loadedmetadata", "durationchange", "seeked", "timeupdate"];
    events.forEach((event) => video.addEventListener(event, paint));
    video.addEventListener("play", start);
    video.addEventListener("pause", stop);
    video.addEventListener("ended", stop);
    paint();
    if (!video.paused) start();
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(debounce.current);
      events.forEach((event) => video.removeEventListener(event, paint));
      video.removeEventListener("play", start);
      video.removeEventListener("pause", stop);
      video.removeEventListener("ended", stop);
    };
  }, [media]);
  const commit = () => {
    window.clearTimeout(debounce.current);
    debounce.current = 0;
    dragging.current = false;
    seekCallback.current(pending.current, resume.current);
  };
  return (
    <div className="hero-video-timeline">
      <input className="hero-video-seek" ref={range} type="range" min="0" max="66" step="0.05"
        defaultValue="0" aria-label="Позиция видео"
        onPointerDown={() => {
          window.clearTimeout(debounce.current); debounce.current = 0;
          dragging.current = true;
          resume.current = !media.current!.paused;
          pending.current = Number(range.current!.value);
          media.current!.pause();
        }}
        onPointerUp={() => { if (dragging.current) commit(); }}
        onPointerCancel={() => {
          pending.current = media.current!.currentTime;
          if (dragging.current) commit();
        }}
        onBlur={() => { if (dragging.current || debounce.current) commit(); }}
        onChange={(event) => {
          pending.current = Number(event.currentTarget.value);
          event.currentTarget.style.setProperty("--progress", `${pending.current / Number(event.currentTarget.max) * 100}%`);
          if (dragging.current) return;
          resume.current = !media.current!.paused;
          window.clearTimeout(debounce.current);
          debounce.current = window.setTimeout(commit, 140);
        }} />
      <span className="hero-video-time" ref={label}>0:00 / 1:06</span>
    </div>
  );
}
