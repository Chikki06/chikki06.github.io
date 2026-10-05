import { useEffect, useRef } from "react";
import {
  isDesktopLikeDevice,
  preloadStoryAssets,
  whenImagesSettled,
} from "../lib/storyAssets.js";

/**
 * On desktop/laptop: after the static portfolio's images settle, warm 3D assets.
 * On mobile: never prefetch — `/3` loads assets only when that route is opened.
 */
export function usePrefetchStoryAssets(rootRef, { enabled = true } = {}) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!enabled || startedRef.current) return undefined;
    if (typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    if (!isDesktopLikeDevice()) return undefined;

    let cancelled = false;
    let idleId;
    let timeoutId;

    const warm = () => {
      if (cancelled || startedRef.current) return;
      startedRef.current = true;
      // Warm the `/3` route chunk, then its GLTF/texture cache.
      import("../components/ScrollStory.jsx")
        .then(() => preloadStoryAssets({ heavy: true }))
        .catch(() => {
          // Prefetch is best-effort; `/3` will load normally if this fails.
        });
    };

    const start = async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;
      await whenImagesSettled(rootRef?.current ?? document.getElementById("root"));
      if (cancelled) return;
      if (typeof requestIdleCallback === "function") {
        idleId = requestIdleCallback(warm, { timeout: 1200 });
      } else {
        timeoutId = window.setTimeout(warm, 300);
      }
    };
    start();

    return () => {
      cancelled = true;
      if (idleId != null) window.cancelIdleCallback?.(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [enabled, rootRef]);
}
