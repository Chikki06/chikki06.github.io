import { useEffect, useRef, useState } from "react";
import { getCachedDemoSrc } from "../lib/demoVideoCache.js";

/** Normalize a demo object from project.detail / project.demo / legacy videoUrl. */
export function resolveDemo(source) {
  if (!source) return null;
  if (typeof source === "string") {
    return { src: source, href: null, label: "Demo" };
  }
  const demo = source.demo || null;
  if (demo?.src) {
    return {
      src: demo.src,
      href: demo.href || null,
      label: demo.label || "Demo",
    };
  }
  if (source.videoUrl) {
    return { src: source.videoUrl, href: null, label: "Demo" };
  }
  return null;
}

/** Collect demos for timeline side media (one primary demo per source). */
export function collectProjectVideos(project) {
  const demo = resolveDemo(project);
  if (!demo) return [];
  return [demo];
}

function isLocalVideo(src) {
  return /\.(webm|mp4|ogg)(\?|$)/i.test(String(src || ""));
}

/**
 * Autoplaying muted loop for local webm/mp4. Click opens href when set.
 * Falls back to a simple link for non-local URLs.
 * Local files only attach media once near the viewport, and share a session
 * blob cache so opening the modal does not re-download the same webm.
 */
export default function HoverDemoVideo({
  url,
  src,
  href,
  title = "Demo",
  className = "",
  compact = false,
  autoPlay = true,
  /** When false, never attach media (e.g. hidden 3D monitor clone). */
  enabled = true,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const mediaSrc = src || url;
  const [inView, setInView] = useState(false);
  const [playbackSrc, setPlaybackSrc] = useState(null);
  const shouldLoad = Boolean(enabled && mediaSrc && inView);

  useEffect(() => {
    if (!enabled || !mediaSrc) return undefined;
    const node = containerRef.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, mediaSrc]);

  useEffect(() => {
    if (!shouldLoad || !mediaSrc) {
      setPlaybackSrc(null);
      return undefined;
    }
    if (!isLocalVideo(mediaSrc)) {
      setPlaybackSrc(mediaSrc);
      return undefined;
    }
    let cancelled = false;
    getCachedDemoSrc(mediaSrc).then((resolved) => {
      if (!cancelled) setPlaybackSrc(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [shouldLoad, mediaSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay || !playbackSrc) return undefined;
    video.muted = true;
    const play = () => {
      video.play().catch(() => {});
    };
    play();
    video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, [playbackSrc, autoPlay]);

  if (!mediaSrc) return null;

  const frame = (
    <div
      ref={containerRef}
      className={`relative overflow-hidden border border-neutral-800 bg-black ${className}`}
    >
      <div className="relative aspect-video w-full">
        {isLocalVideo(mediaSrc) ? (
          playbackSrc ? (
            <video
              ref={videoRef}
              src={playbackSrc}
              muted
              loop
              playsInline
              autoPlay={autoPlay}
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover"
              aria-label={title}
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-950" aria-hidden="true" />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 px-3 text-center font-mono text-xs text-white">
            {title}
          </div>
        )}
        {href && (
          <span
            className={`pointer-events-none absolute bottom-2 right-2 bg-[#FF0000] font-mono text-white ${
              compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-1 text-[10px]"
            }`}
          >
            Open →
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="block transition-opacity hover:opacity-90"
        onClick={(event) => event.stopPropagation()}
        aria-label={`${title} — open link`}
      >
        {frame}
      </a>
    );
  }

  return frame;
}
