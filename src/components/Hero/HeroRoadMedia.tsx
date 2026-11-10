import mediaManifest from "../../config/media.generated.json";

export function HeroRoadMedia({ reduced }: { reduced: boolean }) {
  const media: { poster: string; sources: { src: string; type: string }[] } =
    mediaManifest;
  const asset = (path: string) =>
    `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
  const poster = asset(media.poster || "/video/road-poster.svg");
  return (
    <div className="hero-road-media" aria-hidden="true">
      <img src={poster} alt="" width="1920" height="1080" />
      {!reduced && media.sources.length > 0 && (
        <video
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
