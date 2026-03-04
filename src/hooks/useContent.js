import { useCallback, useEffect, useState } from "react";
import { timelineData as staticTimeline } from "../data/timelineData.js";
import defaultSite from "../../content/site.json";

export function useContent() {
  const [timeline, setTimeline] = useState(staticTimeline);
  const [site, setSite] = useState(defaultSite);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    // In production (GitHub Pages), we rely on the bundled JSON content only.
    if (import.meta.env.PROD) {
      setTimeline(staticTimeline);
      setSite(defaultSite);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dev-content");

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const nextTimeline = Array.isArray(data.timeline)
        ? data.timeline
        : staticTimeline;
      const nextSite =
        data.site && typeof data.site === "object" ? data.site : defaultSite;

      setTimeline(nextTimeline);
      setSite(nextSite);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        "[useContent] Falling back to bundled content:",
        err?.message || err,
      );
      setError(err);
      setTimeline(staticTimeline);
      setSite(defaultSite);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    timeline,
    site,
    loading,
    error,
    reload: load,
  };
}

