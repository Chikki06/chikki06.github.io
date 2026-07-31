import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Mail, Linkedin, Github } from "lucide-react";
import { useContent } from "../hooks/useContent.js";
import ProjectModal from "./ProjectModal.jsx";
import HoverDemoVideo, { resolveDemo } from "./HoverDemoVideo.jsx";
import OutboundLink from "./OutboundLink.jsx";

const ACCENT = "#FF0000";
const BG = "#0a0a0a";
const FG = "#ffffff";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "projects", label: "Projects" },
  { value: "work", label: "Work" },
];

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}

/** Modal payload from a project node or a career node with `detail`. */
function detailFromNode(node) {
  if (!node) return null;
  if (node.type === "project" && node.project?.hasDetails) {
    return {
      ...node.project,
      demo: node.project.demo || node.demo,
      images: node.project.images || node.images || [],
    };
  }
  if (node.type === "career" && node.hasDetails && node.detail) {
    return {
      ...node.detail,
      demo: node.detail.demo || node.demo,
      images: node.detail.images || node.images || [],
    };
  }
  return null;
}

function demoFromNode(node) {
  return resolveDemo(node?.project) || resolveDemo(node?.detail) || resolveDemo(node);
}

/** Ongoing roles ("Present") group under the current calendar year. */
function resolveGroupYear(node) {
  const label = String(node?.dateLabel ?? "");
  if (/\bPresent\b/i.test(label)) return new Date().getFullYear();
  return node?.year ?? 0;
}

function groupByYearPreservingOrder(nodes) {
  const groupedMap = new Map();
  nodes.forEach((node) => {
    const y = resolveGroupYear(node);
    if (!groupedMap.has(y)) groupedMap.set(y, []);
    groupedMap.get(y).push(node);
  });
  // Newest → oldest so All (education @ 2028 + ongoing roles) never follows JSON insertion order.
  const years = [...groupedMap.keys()].sort((a, b) => b - a);
  return { groupedMap, years };
}

function nodesForFilter(timeline, nextFilter) {
  const base = Array.isArray(timeline) ? timeline : [];
  if (nextFilter === "work") return base.filter((n) => n.type === "career");
  if (nextFilter === "projects") return base.filter((n) => n.type === "project");
  return base;
}

/** Year to highlight after a view switch — avoid one paint with a stale active year. */
function activeYearForFilterSwitch(years, prevYear, scrollTop, resetToTop) {
  if (!years.length) return null;
  if (resetToTop || scrollTop < 8) return years[0];
  if (prevYear != null && years.includes(prevYear)) return prevYear;
  return years[0];
}

function NodeMedia({ node, demo, clipScroll = false, mediaEnabled = true }) {
  const images = node.images && Array.isArray(node.images) ? node.images : [];
  if (!images.length && !demo) return null;

  return (
    <aside className="mt-3 md:mt-0 md:ml-4 md:w-56 md:shrink-0">
      <div
        className={`portfolio-scroll flex h-auto max-h-52 flex-col gap-2 md:max-h-64 ${
          clipScroll ? "overflow-clip" : "overflow-y-auto"
        }`}
      >
        {demo && (
          <HoverDemoVideo
            src={demo.src}
            href={demo.href}
            title={demo.label || node.title || "Demo"}
            compact
            enabled={mediaEnabled}
            className="w-full shrink-0"
          />
        )}
        {images.map((img) => (
          <div key={img.src} className="shrink-0 border border-neutral-800 bg-neutral-950 md:w-full">
            <img
              src={img.src}
              alt={img.alt || ""}
              className="h-auto w-full object-contain"
            />
          </div>
        ))}
      </div>
    </aside>
  );
}

function featurePreviewLines(project) {
  if (Array.isArray(project?.features) && project.features.length) {
    return project.features.slice(0, 3).map((f) =>
      typeof f === "string" ? f : f.title || f.description,
    );
  }
  if (Array.isArray(project?.highlights)) return project.highlights.slice(0, 3);
  return [];
}

function TimelineNode({ node, onOpenDetail, clipMedia = false, mediaEnabled = true }) {
  const baseClasses = "border border-neutral-800 px-4 py-4 text-base leading-relaxed text-white";
  const demo = demoFromNode(node);
  const detail = detailFromNode(node);

  if (node.type === "project") {
    const hasDetails = Boolean(detail);
    const preview = featurePreviewLines(node.project);
    const openDetail = hasDetails ? () => onOpenDetail?.(detail) : undefined;

    return (
      <article
        className={`${baseClasses} ${
          hasDetails
            ? "w-full cursor-pointer transition-colors hover:border-[#FF0000] has-[a:hover]:border-neutral-800"
            : ""
        }`}
        onClick={openDetail}
        onKeyDown={
          openDetail
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDetail();
                }
              }
            : undefined
        }
        role={hasDetails ? "button" : undefined}
        tabIndex={hasDetails ? 0 : undefined}
      >
        <div className="md:flex md:items-stretch md:justify-between md:gap-4">
          <div className="md:flex-1">
            <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-white">
                  {node.dateLabel} · PROJECT
                </div>
                <h3 className="mt-1 text-lg font-semibold text-white">{node.title}</h3>
              </div>
              <div className="text-right text-xs text-white">
                <span className="font-mono">{node.project?.id}</span>
                {hasDetails && <span className="ml-1 font-mono text-[#FF0000]">→</span>}
              </div>
            </header>
            {node.summary && <p className="mb-3 whitespace-pre-line text-white">{node.summary}</p>}
            {preview.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-white">
                {preview.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-[5px] h-[1px] w-4 shrink-0 bg-[#FF0000]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
            {node.project?.links?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {node.project.links.map((link) => (
                  <OutboundLink
                    key={`${link.label}-${link.url}`}
                    link={link}
                    compact
                    onClick={(event) => event.stopPropagation()}
                  />
                ))}
              </div>
            )}
            {node.project?.tags && (
              <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-white">
                {node.project.tags.slice(0, 6).map((tag) => (
                  <span key={tag} className="border border-neutral-700 px-1.5 py-0.5 text-white">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <NodeMedia node={node} demo={demo} clipScroll={clipMedia} mediaEnabled={mediaEnabled} />
        </div>
      </article>
    );
  }

  if (node.type === "education") {
    const org = node.organization || node.institution;
    const loc = node.location;
    return (
      <article className={baseClasses}>
        <div className="md:flex md:items-stretch md:justify-between md:gap-4">
          <div className="md:flex-1">
            <header className="mb-2">
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-white">
                {node.dateLabel} · EDUCATION
              </div>
              <h3 className="mt-1 text-lg font-semibold text-white">{node.title}</h3>
              {(org || node.program) && (
                <p className="text-sm text-white">{[org, node.program, loc].filter(Boolean).join(" · ")}</p>
              )}
            </header>
            {node.summary && <p className="mb-3 whitespace-pre-line text-base text-white">{node.summary}</p>}
            {node.bullets?.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-white">
                {node.bullets.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-[5px] h-[1px] w-3 shrink-0 bg-[#FF0000]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <NodeMedia node={node} demo={demo} clipScroll={clipMedia} mediaEnabled={mediaEnabled} />
        </div>
      </article>
    );
  }

  if (node.type === "career") {
    const hasDetails = Boolean(detail);
    const openDetail = hasDetails ? () => onOpenDetail?.(detail) : undefined;

    return (
      <article
        className={`${baseClasses} ${
          hasDetails
            ? "w-full cursor-pointer transition-colors hover:border-[#FF0000]"
            : ""
        }`}
        onClick={openDetail}
        onKeyDown={
          openDetail
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDetail();
                }
              }
            : undefined
        }
        role={hasDetails ? "button" : undefined}
        tabIndex={hasDetails ? 0 : undefined}
      >
        <div className="md:flex md:items-stretch md:justify-between md:gap-4">
          <div className="md:flex-1">
            <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-white">
                  {node.dateLabel} · CAREER
                </div>
                <h3 className="mt-1 text-lg font-semibold text-white">{node.title}</h3>
                <p className="text-sm text-white">
                  {node.organization}
                  {node.location ? ` · ${node.location}` : null}
                </p>
              </div>
              {hasDetails && <span className="font-mono text-xs text-[#FF0000]">Details →</span>}
            </header>
            {node.summary && <p className="mb-3 whitespace-pre-line text-base text-white">{node.summary}</p>}
            {node.bullets && (
              <ul className="mt-2 space-y-1 text-sm text-white">
                {node.bullets.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-[5px] h-[1px] w-3 shrink-0 bg-[#FF0000]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <NodeMedia node={node} demo={demo} clipScroll={clipMedia} mediaEnabled={mediaEnabled} />
        </div>
      </article>
    );
  }

  if (node.type === "trip") {
    return (
      <article className={baseClasses}>
        <div className="md:flex md:items-stretch md:justify-between md:gap-4">
          <div className="md:flex-1">
            <header className="mb-2">
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-white">
                {node.dateLabel} · TRIP
              </div>
              <h3 className="mt-1 text-lg font-semibold text-white">{node.title}</h3>
              {node.location && <p className="text-sm text-white">{node.location}</p>}
            </header>
            {node.summary && <p className="mb-3 whitespace-pre-line text-base text-white">{node.summary}</p>}
            {node.notes && (
              <ul className="mt-2 space-y-1 text-sm text-white">
                {node.notes.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <NodeMedia node={node} demo={demo} clipScroll={clipMedia} mediaEnabled={mediaEnabled} />
        </div>
      </article>
    );
  }

  return (
    <article className={baseClasses}>
      <div className="md:flex md:items-stretch md:justify-between md:gap-4">
        <div className="md:flex-1">
          <header className="mb-2">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-white">
              {node.dateLabel} · LIFE
            </div>
            <h3 className="mt-1 text-lg font-semibold text-white">{node.title}</h3>
            {node.location && <p className="text-sm text-white">{node.location}</p>}
          </header>
          {node.summary && <p className="mb-3 whitespace-pre-line text-base text-white">{node.summary}</p>}
          {node.details && (
            <ul className="mt-2 space-y-1 text-sm text-white">
              {node.details.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
        <NodeMedia node={node} demo={demo} clipScroll={clipMedia} mediaEnabled={mediaEnabled} />
      </div>
    </article>
  );
}

/**
 * @param {"page" | "monitor" | "fullscreen"} [mode="page"]
 * @param {(controller: ((deltaY: number, deltaMode?: number) => boolean) | null) => void} [onScrollControllerChange]
 */
export default function Portfolio({
  mode = "page",
  onScrollControllerChange,
  onBottomOverscroll,
  className = "",
  style,
  /** When false, skip attaching demo video sources (hidden 3D monitor clone). */
  loadMedia = true,
}) {
  const embedded = mode === "monitor" || mode === "fullscreen";
  const isMonitor = mode === "monitor";
  // Phones + short landscape (width often >767 but height is tiny) need one-page scroll.
  const isCompact = useMediaQuery("(max-width: 767px), ((max-height: 540px) and (max-width: 1100px))");
  const isShort = useMediaQuery("(max-height: 540px)");
  const mobileUnifiedScroll = isCompact && mode === "fullscreen";
  const { timeline, site, loading, error } = useContent();
  const [activeYear, setActiveYear] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modalProject, setModalProject] = useState(null);
  const [endSpacerPx, setEndSpacerPx] = useState(280);
  const [monitorOffset, setMonitorOffset] = useState(0);
  const pageScrollRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const timelineContentRef = useRef(null);
  const monitorOffsetRef = useRef(0);
  const monitorAnimRef = useRef(0);
  const pinnedYearRef = useRef(null);
  const pinReleaseTimerRef = useRef(null);
  const overscrollHintAtRef = useRef(0);
  const modalOpenRef = useRef(false);
  modalOpenRef.current = Boolean(modalProject);

  const hero = site?.hero || {};
  const contactEmail = site?.contact?.email || "Akshatshahi2006@gmail.com";
  const socials = Array.isArray(site?.socials)
    ? site.socials
    : [
        { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/akshat-kumar-shahi/" },
        { id: "github", label: "GitHub", url: "https://github.com/Chikki06" },
      ];

  const filteredData = useMemo(() => nodesForFilter(timeline, filter), [filter, timeline]);

  const grouped = useMemo(() => groupByYearPreservingOrder(filteredData), [filteredData]);

  useEffect(() => () => {
    clearTimeout(pinReleaseTimerRef.current);
    cancelAnimationFrame(monitorAnimRef.current);
  }, []);

  // Reset transform scroll when the monitor list contents change (filter handler also resets eagerly).
  useEffect(() => {
    if (!isMonitor) return;
    monitorOffsetRef.current = 0;
    setMonitorOffset(0);
  }, [filter, grouped.years, isMonitor]);

  // Enough trailing space that the last year can become majority-visible.
  useEffect(() => {
    const container = mobileUnifiedScroll ? pageScrollRef.current : timelineContainerRef.current;
    if (!container) return undefined;
    const update = () => {
      setEndSpacerPx(Math.max(Math.round(container.clientHeight * 0.45), 160));
      if (!isMonitor) return;
      const content = timelineContentRef.current;
      if (!content) return;
      const maxScroll = Math.max(content.offsetHeight - container.clientHeight, 0);
      if (monitorOffsetRef.current > maxScroll) {
        monitorOffsetRef.current = maxScroll;
        setMonitorOffset(maxScroll);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    const content = timelineContentRef.current;
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, [embedded, grouped.years, filter, isMonitor, mobileUnifiedScroll]);

  const getScrollMetrics = useCallback(() => {
    if (isMonitor) {
      const container = timelineContainerRef.current;
      const content = timelineContentRef.current;
      if (!container || !content) return null;
      return {
        container,
        scrollTop: monitorOffsetRef.current,
        clientHeight: container.clientHeight,
        scrollHeight: content.offsetHeight,
      };
    }
    const container = mobileUnifiedScroll ? pageScrollRef.current : timelineContainerRef.current;
    if (!container) return null;
    return {
      container,
      scrollTop: container.scrollTop,
      clientHeight: container.clientHeight,
      scrollHeight: container.scrollHeight,
    };
  }, [isMonitor, mobileUnifiedScroll]);

  const resolveActiveYearFromScroll = useCallback(() => {
    const metrics = getScrollMetrics();
    if (!metrics || !grouped.years.length) return null;

    const { container, scrollTop, clientHeight, scrollHeight } = metrics;
    const containerRect = container.getBoundingClientRect();
    const viewTop = scrollTop;
    const viewBottom = scrollTop + clientHeight;

    // At the hard top/bottom, prefer edge years — thin cards (e.g. 2028 education) otherwise lose to taller neighbors.
    if (scrollTop <= 3) {
      return grouped.years[0];
    }
    if (scrollTop + clientHeight >= scrollHeight - 3) {
      return grouped.years[grouped.years.length - 1];
    }

    let bestYear = grouped.years[0];
    let bestVisible = -1;
    for (const year of grouped.years) {
      const el = document.getElementById(`year-${year}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const sectionTop = rect.top - containerRect.top + scrollTop;
      const sectionBottom = sectionTop + rect.height;
      const visible = Math.max(0, Math.min(sectionBottom, viewBottom) - Math.max(sectionTop, viewTop));
      if (visible > bestVisible) {
        bestVisible = visible;
        bestYear = year;
      }
    }
    return bestYear;
  }, [getScrollMetrics, grouped.years]);

  const syncActiveYearFromScroll = useCallback(() => {
    if (pinnedYearRef.current != null) {
      setActiveYear(pinnedYearRef.current);
      return;
    }
    const nextYear = resolveActiveYearFromScroll();
    if (nextYear != null) setActiveYear((prev) => (prev === nextYear ? prev : nextYear));
  }, [resolveActiveYearFromScroll]);

  const setMonitorScrollOffset = useCallback((next) => {
    monitorOffsetRef.current = next;
    setMonitorOffset(next);
    syncActiveYearFromScroll();
  }, [syncActiveYearFromScroll]);

  const handleFilterChange = (nextFilter) => {
    if (nextFilter === filter) return;
    pinnedYearRef.current = null;
    clearTimeout(pinReleaseTimerRef.current);

    const { years } = groupByYearPreservingOrder(nodesForFilter(timeline, nextFilter));
    const scrollContainer = mobileUnifiedScroll ? pageScrollRef.current : timelineContainerRef.current;
    const scrollTop = isMonitor
      ? 0
      : scrollContainer?.scrollTop ?? 0;

    if (isMonitor) {
      cancelAnimationFrame(monitorAnimRef.current);
      monitorOffsetRef.current = 0;
      setMonitorOffset(0);
    } else if (scrollContainer && scrollTop < 8) {
      scrollContainer.scrollTop = 0;
    }

    setFilter(nextFilter);
    setActiveYear((prev) => activeYearForFilterSwitch(years, prev, scrollTop, isMonitor));
  };

  // Majority-visible year spy; layout sync avoids a paint with a stale highlight after list changes.
  useLayoutEffect(() => {
    syncActiveYearFromScroll();
  }, [grouped.years, syncActiveYearFromScroll]);

  useEffect(() => {
    if (isMonitor) return undefined;
    const container = mobileUnifiedScroll ? pageScrollRef.current : timelineContainerRef.current;
    if (!container) return undefined;

    const handleScroll = () => syncActiveYearFromScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [grouped.years, isMonitor, mobileUnifiedScroll, syncActiveYearFromScroll]);

  // Fullscreen: keep scrolling at the bottom nudges the exit control.
  useEffect(() => {
    if (mode !== "fullscreen" || !onBottomOverscroll || modalProject) return undefined;
    const container = mobileUnifiedScroll ? pageScrollRef.current : timelineContainerRef.current;
    if (!container) return undefined;

    const onWheel = (event) => {
      if (event.deltaY <= 0) return;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 3;
      if (!atBottom) return;
      const now = performance.now();
      if (now - overscrollHintAtRef.current < 700) return;
      overscrollHintAtRef.current = now;
      onBottomOverscroll();
    };

    container.addEventListener("wheel", onWheel, { passive: true });
    return () => container.removeEventListener("wheel", onWheel);
  }, [mode, modalProject, mobileUnifiedScroll, onBottomOverscroll]);

  useEffect(() => {
    if (embedded) return undefined;
    const container = timelineContainerRef.current;
    if (!container) return undefined;
    const BOUNDARY = 4;
    const onWheel = (e) => {
      const { scrollTop, clientHeight, scrollHeight } = container;
      const atTop = scrollTop <= BOUNDARY;
      const atBottom = scrollTop + clientHeight >= scrollHeight - BOUNDARY;
      if ((atBottom && e.deltaY > 0) || (atTop && e.deltaY < 0)) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
      }
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [embedded]);

  const consumeWheel = useCallback((deltaY, deltaMode = 0) => {
    // Absorb wheel while a detail modal is open so the timeline stays put.
    if (modalOpenRef.current) return true;
    const metrics = getScrollMetrics();
    if (!metrics) return false;
    const { scrollTop, clientHeight, scrollHeight } = metrics;
    const delta = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? clientHeight : 1);
    const BOUNDARY = 2;
    const maxScroll = Math.max(scrollHeight - clientHeight, 0);
    const atTop = scrollTop <= BOUNDARY;
    const atBottom = scrollTop >= maxScroll - BOUNDARY;
    if ((delta < 0 && atTop) || (delta > 0 && atBottom) || delta === 0) return false;

    if (isMonitor) {
      const next = Math.min(Math.max(scrollTop + delta, 0), maxScroll);
      setMonitorScrollOffset(next);
      return true;
    }

    metrics.container.scrollTop += delta;
    return true;
  }, [getScrollMetrics, isMonitor, setMonitorScrollOffset]);

  useEffect(() => {
    if (!onScrollControllerChange) return undefined;
    onScrollControllerChange(consumeWheel);
    return () => onScrollControllerChange(null);
  }, [consumeWheel, onScrollControllerChange]);

  const handleCloseProjectModal = useCallback(() => {
    setModalProject(null);
  }, []);

  const animateMonitorOffset = useCallback((targetY, onDone) => {
    cancelAnimationFrame(monitorAnimRef.current);
    const start = monitorOffsetRef.current;
    const delta = targetY - start;
    if (Math.abs(delta) < 1) {
      setMonitorScrollOffset(targetY);
      onDone?.();
      return;
    }
    const startTime = performance.now();
    const duration = 420;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - (1 - t) ** 3;
      setMonitorScrollOffset(start + delta * eased);
      if (t < 1) {
        monitorAnimRef.current = requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    };
    monitorAnimRef.current = requestAnimationFrame(tick);
  }, [setMonitorScrollOffset]);

  const handleYearClick = (year) => {
    pinnedYearRef.current = year;
    setActiveYear(year);
    clearTimeout(pinReleaseTimerRef.current);
    cancelAnimationFrame(monitorAnimRef.current);

    const metrics = getScrollMetrics();
    if (!metrics) return;
    const { container, scrollTop, clientHeight, scrollHeight } = metrics;
    const containerRect = container.getBoundingClientRect();
    if (!embedded) {
      const winScrollTop = window.scrollY || window.pageYOffset;
      window.scrollTo({
        top: Math.max(containerRect.top + winScrollTop - 110, 0),
        behavior: "smooth",
      });
    }
    const el = document.getElementById(`year-${year}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const sectionTop = rect.top - containerRect.top + scrollTop;
    const maxScroll = Math.max(scrollHeight - clientHeight, 0);
    const stickyClearance = mobileUnifiedScroll ? 72 : 24;
    const targetY = Math.min(Math.max(sectionTop - stickyClearance, 0), maxScroll);

    const releasePin = () => {
      pinnedYearRef.current = null;
      const nextYear = resolveActiveYearFromScroll();
      if (nextYear != null) setActiveYear(nextYear);
    };

    if (isMonitor) {
      animateMonitorOffset(targetY, () => {
        clearTimeout(pinReleaseTimerRef.current);
        releasePin();
      });
      // Fallback if animation is interrupted.
      pinReleaseTimerRef.current = setTimeout(releasePin, 900);
      return;
    }

    container.scrollTo({ top: targetY, behavior: "smooth" });

    const onScrollEnd = () => {
      container.removeEventListener("scrollend", onScrollEnd);
      clearTimeout(pinReleaseTimerRef.current);
      releasePin();
    };
    container.addEventListener("scrollend", onScrollEnd, { once: true });
    // Fallback for browsers without scrollend.
    pinReleaseTimerRef.current = setTimeout(() => {
      container.removeEventListener("scrollend", onScrollEnd);
      releasePin();
    }, 900);
  };

  const rootClassName = [
    "relative text-white",
    mobileUnifiedScroll
      ? `h-full portfolio-scroll ${modalProject ? "overflow-hidden" : "overflow-y-auto overscroll-contain"}`
      : "overflow-hidden",
    mode === "page" ? "min-h-screen" : mobileUnifiedScroll ? "" : "flex h-full min-h-0 flex-col",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={mobileUnifiedScroll ? pageScrollRef : undefined}
      className={rootClassName}
      style={{ backgroundColor: BG, color: FG, fontFamily: "system-ui, sans-serif", ...style }}
    >
      <header
        className={`relative z-10 border-b border-neutral-900 px-4 md:px-8 ${
          isShort ? "py-2.5" : "py-5 md:py-10"
        }`}
      >
        <div className="mx-auto max-w-6xl">
          <h1
            className={`font-semibold tracking-tight text-white ${
              isShort ? "text-xl leading-tight" : "text-3xl md:text-4xl"
            }`}
          >
            {hero.name || "Akshat Kumar Shahi"}
          </h1>
          {hero.tagline && !isShort && (
            <p className="mt-2 max-w-2xl text-base text-white">{hero.tagline}</p>
          )}
          <div
            className={`flex flex-wrap items-center gap-x-5 gap-y-1 ${
              isShort ? "mt-1.5 text-sm" : "mt-3 text-base md:mt-4"
            }`}
          >
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-2 border-b border-transparent transition-colors hover:border-[#FF0000]"
              style={{ color: ACCENT }}
            >
              <Mail className={isShort ? "h-4 w-4" : "h-5 w-5"} />
              {isShort ? "Email" : contactEmail}
            </a>
            {socials.map((social) => {
              const key = social.id || social.label || social.url;
              const id = (social.id || "").toLowerCase();
              const Icon = id === "github" ? Github : id === "linkedin" ? Linkedin : null;
              return (
                <a
                  key={key}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 border-b border-transparent transition-colors hover:border-[#FF0000]"
                  style={{ color: ACCENT }}
                >
                  {Icon && <Icon className={isShort ? "h-4 w-4" : "h-5 w-5"} />}
                  {social.label}
                </a>
              );
            })}
          </div>
        </div>
      </header>

      <div
        className={`relative z-10 mx-auto flex max-w-6xl gap-6 px-4 md:px-8 ${
          isShort ? "pb-8 pt-2" : "pb-16 pt-3 md:pt-14"
        } ${embedded && !mobileUnifiedScroll ? "min-h-0 flex-1" : ""}`}
      >
        <aside className={`w-32 shrink-0 ${isCompact ? "hidden" : "hidden md:block"}`}>
          <div className={embedded ? "sticky top-0" : "sticky top-16"}>
            <div className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-white">Years</div>
            <nav className="space-y-0.5 text-sm">
              {grouped.years.map((year) => {
                const isActive = year === activeYear;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearClick(year)}
                    className={`flex w-full cursor-pointer items-center gap-2 border-l-2 px-2 py-1.5 text-left font-mono ${
                      isActive ? "" : "hover:border-white hover:text-white"
                    }`}
                    style={{
                      borderColor: isActive ? ACCENT : "#262626",
                      color: isActive ? ACCENT : "#ffffff",
                    }}
                  >
                    <span>{year}</span>
                    {isActive && <span className="h-[1px] flex-1" style={{ backgroundColor: ACCENT }} />}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className={`flex-1 ${embedded && !mobileUnifiedScroll ? "flex min-h-0 flex-col" : ""}`}>
          <div
            className={`sticky top-0 z-20 border-b border-neutral-900 ${
              isShort ? "pb-2 pt-1" : "pb-3 pt-2 md:pb-4"
            }`}
            style={{ backgroundColor: BG }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
              <h2 className={`font-semibold tracking-tight text-white ${isShort ? "text-base" : "text-xl"}`}>
                Timeline
              </h2>
              <div className="flex items-center gap-2">
                {!isShort && (
                  <span className="font-mono text-xs uppercase tracking-wider text-white">View</span>
                )}
                <div className="flex border border-neutral-800 bg-neutral-950/80">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => handleFilterChange(f.value)}
                      className={`cursor-pointer border-r border-neutral-800 font-mono uppercase tracking-[0.14em] transition-colors last:border-r-0 hover:bg-neutral-800/80 ${
                        isShort ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-sm"
                      }`}
                      style={{
                        backgroundColor: filter === f.value ? ACCENT : "transparent",
                        color: filter === f.value ? BG : FG,
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {isCompact && grouped.years.length > 0 && (
              <nav
                className={`portfolio-scroll mt-2 flex gap-1.5 overflow-x-auto pb-1 ${isShort ? "" : "md:hidden"}`}
                aria-label="Jump to year"
              >
                {grouped.years.map((year) => {
                  const isActive = year === activeYear;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearClick(year)}
                      className="shrink-0 rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em]"
                      style={{
                        borderColor: isActive ? ACCENT : "#404040",
                        color: isActive ? ACCENT : "#ffffff",
                        backgroundColor: isActive ? "rgba(255,0,0,0.12)" : "transparent",
                      }}
                    >
                      {year}
                    </button>
                  );
                })}
              </nav>
            )}
            {loading && (
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-white">
                Loading latest content…
              </div>
            )}
            {error && (
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-[#FF0000]">
                Using bundled content. Admin API not reachable.
              </div>
            )}
          </div>

          <div
            ref={timelineContainerRef}
            className={`portfolio-scroll relative ${
              mobileUnifiedScroll
                ? "mt-3"
                : modalProject
                  ? embedded
                    ? "mt-3 min-h-0 flex-1 overflow-hidden"
                    : "mt-6 overflow-hidden"
                  : mode === "monitor"
                    ? "mt-3 min-h-0 flex-1 overflow-clip"
                    : embedded
                      ? "mt-3 min-h-0 flex-1 overflow-y-auto"
                      : "mt-6 overflow-y-auto"
            }`}
            style={embedded || mobileUnifiedScroll ? undefined : { maxHeight: "calc(100vh - 210px)" }}
          >
            <div className={`absolute bottom-0 left-[10px] top-0 w-px bg-neutral-900 ${isCompact ? "hidden" : "hidden md:block"}`} />

            <div
              ref={timelineContentRef}
              style={isMonitor ? { transform: `translate3d(0, ${-monitorOffset}px, 0)` } : undefined}
            >
              <div className={isShort ? "space-y-6" : "space-y-10"}>
                {grouped.years.map((year) => {
                  const nodesForYear = grouped.groupedMap.get(year) || [];
                  const yearNodes = nodesForYear.map((node) => (
                    <TimelineNode
                      key={node.id}
                      node={node}
                      onOpenDetail={setModalProject}
                      clipMedia={isMonitor}
                      mediaEnabled={loadMedia}
                    />
                  ));

                  return (
                    <section key={year} id={`year-${year}`} className="scroll-mt-20 md:scroll-mt-6">
                      <div className="mb-3 flex items-center gap-3">
                        <div className={`items-center gap-3 ${isCompact ? "hidden" : "hidden md:flex"}`}>
                          <div
                            className="h-[9px] w-[9px] border"
                            style={{
                              borderColor: year === activeYear ? ACCENT : "#525252",
                              backgroundColor: year === activeYear ? ACCENT : "transparent",
                            }}
                          />
                          <div className="font-mono text-xs uppercase tracking-[0.18em] text-white">{year}</div>
                        </div>
                        <div className={isCompact ? "block" : "md:hidden"}>
                          <div className="font-mono text-xs uppercase tracking-[0.18em] text-white">{year}</div>
                        </div>
                        <div className="h-px flex-1 bg-neutral-900" />
                      </div>
                      <div className="space-y-3">{yearNodes}</div>
                    </section>
                  );
                })}
              </div>
              <div aria-hidden="true" style={{ height: endSpacerPx }} />
            </div>
          </div>
        </main>
      </div>

      <ProjectModal project={modalProject} isOpen={!!modalProject} onClose={handleCloseProjectModal} />
    </div>
  );
}
