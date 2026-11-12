import mediaManifest from "../../config/media.generated.json";
import { useEffect, useRef } from "react";

export function HeroMedia({
  reduced,
}: {
  reduced: boolean;
}) {
  const player = useRef<HTMLVideoElement>(null);
  const media: { poster: string; sources: { src: string; type: string }[] } =
    mediaManifest;
  const asset = (path: string) =>
    `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
  const poster = media.poster ? asset(media.poster) : "";
  useEffect(() => {
    const video = player.current;
    if (!video) return;
    let visible = false;
    const sync = () => {
      if (visible && !document.hidden && !reduced) video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(video.closest(".hero-card")!);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [reduced]);
  if (!poster && !media.sources.length) return null;
  return (
    <div
      className="instrument-media"
      aria-hidden="true"
    >
      {poster && <img src={poster} alt="" width="1920" height="1080" />}
      {!reduced && media.sources.length > 0 && (
        <video
          ref={player}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        >
          {media.sources.map((source) => (
            <source
              key={source.src}
              src={asset(source.src)}
              type={source.type}
            />
          ))}
        </video>
      )}
    </div>
  );
}
