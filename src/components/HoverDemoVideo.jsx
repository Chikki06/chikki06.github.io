import { useMemo, useState } from "react";

/** Collect demo embeds from a project root and its phases. */
export function collectProjectVideos(project) {
  if (!project) return [];
  const videos = [];
  const seen = new Set();
  const push = (url, title) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    videos.push({ url, title: title || project.title || "Demo" });
  };
  push(project.videoUrl, project.title);
  for (const phase of project.timeline || []) {
    push(phase.videoUrl, phase.title);
  }
  return videos;
}

export function youtubeIdFromUrl(url) {
  if (!url) return null;
  const match = String(url).match(
    /(?:embed\/|v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{6,})/,
  );
  return match?.[1] || null;
}

function toEmbedSrc(url, { autoplay = false } = {}) {
  const id = youtubeIdFromUrl(url);
  if (!id) return null;
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (autoplay) {
    params.set("autoplay", "1");
    params.set("mute", "1");
    params.set("controls", "0");
    params.set("loop", "1");
    params.set("playlist", id);
  }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

/**
 * YouTube demo that shows a poster, then autoplays muted on hover/focus.
 */
export default function HoverDemoVideo({
  url,
  title = "Demo",
  className = "",
  compact = false,
}) {
  const [active, setActive] = useState(false);
  const id = useMemo(() => youtubeIdFromUrl(url), [url]);
  const poster = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  const idleSrc = useMemo(() => toEmbedSrc(url, { autoplay: false }), [url]);
  const playSrc = useMemo(() => toEmbedSrc(url, { autoplay: true }), [url]);

  if (!id || !idleSrc) return null;

  return (
    <div
      className={`group/video relative overflow-hidden border border-neutral-800 bg-black ${className}`}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      tabIndex={0}
      role="img"
      aria-label={`${title} video preview`}
    >
      <div className={`relative w-full ${compact ? "aspect-video" : "aspect-video"}`}>
        {active ? (
          <iframe
            key="playing"
            className="absolute inset-0 h-full w-full"
            src={playSrc}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {poster && (
              <img
                src={poster}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <span
              className={`absolute bottom-2 right-2 bg-[#FF0000] font-mono text-white ${
                compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"
              }`}
            >
              Hover to play
            </span>
          </>
        )}
      </div>
    </div>
  );
}
