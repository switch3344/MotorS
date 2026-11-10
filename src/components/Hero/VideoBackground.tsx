import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import mediaManifest from "../../config/media.generated.json";
const manifest: { poster: string; sources: { src: string; type: string }[] } =
  mediaManifest;
const media = {
  poster: manifest.poster
    ? `${import.meta.env.BASE_URL}${manifest.poster.slice(1)}`
    : "",
  sources: manifest.sources.map((source) => ({
    ...source,
    src: `${import.meta.env.BASE_URL}${source.src.slice(1)}`,
  })),
};
interface Connection {
  saveData?: boolean;
  addEventListener?: (type: string, callback: () => void) => void;
  removeEventListener?: (type: string, callback: () => void) => void;
}
export function VideoBackground({
  hero,
}: {
  hero: React.RefObject<HTMLElement | null>;
}) {
  const reduced = useReducedMotion();
  const [blocked, setBlocked] = useState(true);
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const connection = (navigator as Navigator & { connection?: Connection })
      .connection;
    const update = () => setBlocked(query.matches || !!connection?.saveData);
    update();
    query.addEventListener("change", update);
    connection?.addEventListener?.("change", update);
    return () => {
      query.removeEventListener("change", update);
      connection?.removeEventListener?.("change", update);
    };
  }, []);
  const canPlay = !blocked && !reduced && !failed && media.sources.length > 0;
  useEffect(() => {
    if (!canPlay || !video.current || !hero.current) return;
    const element = video.current;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden) {
        element.muted = true;
        element.play().catch(() => {});
      } else element.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    observer.observe(hero.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      element.pause();
    };
  }, [canPlay, hero]);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    let height = hero.current?.clientHeight ?? 900;
    const draw = () => {
      frame = 0;
      if (layer.current)
        layer.current.style.transform = `translate3d(0,${Math.min(Math.max(window.scrollY, 0), height) * 0.1}px,0)`;
    };
    const update = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(([entry]) => {
      height = entry.contentRect.height;
      update();
    });
    if (hero.current) resize.observe(hero.current);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [hero, reduced]);
  return (
    <>
      <div className="hero-media" ref={layer} aria-hidden="true">
        {media.poster && (
          <img
            className="hero-poster"
            src={media.poster}
            alt=""
            width="1920"
            height="1080"
            fetchPriority="high"
          />
        )}
        {canPlay && (
          <video
            ref={video}
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={media.poster}
            onError={() => setFailed(true)}
          >
            {media.sources.map((source) => (
              <source src={source.src} type={source.type} key={source.src} />
            ))}
          </video>
        )}
      </div>
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
    </>
  );
}
