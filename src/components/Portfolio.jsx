import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mail, Linkedin, Github } from "lucide-react";
import { useContent } from "../hooks/useContent.js";
import ProjectModal from "./ProjectModal.jsx";
import HoverDemoVideo, { collectProjectVideos } from "./HoverDemoVideo.jsx";

const ACCENT = "#FF0000";
const BG = "#0a0a0a";
const FG = "#ffffff";

const FILTERS = [
  { value: "work", label: "Work" },
  { value: "projects", label: "Projects" },
  { value: "all", label: "All" },
];

const CISL_RELATED_PROJECT_IDS = [
  { id: "cisl-inference-pipeline", label: "Inference pipeline" },
  { id: "cisl-web-viewer", label: "Web viewer" },
];

function groupByYearPreservingOrder(nodes) {
  const groupedMap = new Map();
  const yearsInOrder = [];
  nodes.forEach((node) => {
    const y = node.year ?? 0;
    if (!groupedMap.has(y)) {
      groupedMap.set(y, []);
      yearsInOrder.push(y);
    }
    groupedMap.get(y).push(node);
  });
  return { groupedMap, years: yearsInOrder };
}

function NodeMedia({ node, videos = [] }) {
  const images = node.images && Array.isArray(node.images) ? node.images : [];
  if (!images.length && !videos.length) return null;

  return (
    <aside className="mt-3 md:mt-0 md:ml-4 md:w-56">
      <div className="portfolio-scroll flex h-auto max-h-52 flex-col gap-2 overflow-y-auto md:max-h-64">
        {videos.slice(0, 2).map((video) => (
          <HoverDemoVideo
            key={video.url}
            url={video.url}
            title={video.title}
            compact
            className="w-full shrink-0"
          />
        ))}
        {images.map((img) => (
          <div key={img.src} className="shrink-0 md:w-full">
            <div className="relative h-24 w-full overflow-hidden border border-neutral-800 bg-neutral-950">
              <img src={img.src} alt={img.alt || ""} className="h-full w-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function TimelineNode({ node, onProjectClick, onOpenProject, relatedProjectLinks, relatedVideos }) {
  const baseClasses = "border border-neutral-800 px-4 py-4 text-base leading-relaxed text-white";
  const projectVideos = collectProjectVideos(node.project);
  const mediaVideos = relatedVideos?.length ? relatedVideos : projectVideos;

  if (node.type === "project") {
    const hasDetails = node.project?.hasDetails && node.project;
    const Wrapper = hasDetails ? "button" : "article";
    const wrapperProps = hasDetails
      ? {
          type: "button",
          className: `${baseClasses} w-full text-left cursor-pointer hover:border-[#FF0000] transition-colors`,
          onClick: () => onProjectClick?.(node.project),
        }
      : { className: baseClasses };

    return (
      <Wrapper {...wrapperProps}>
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
            {node.project?.highlights && (
              <ul className="mt-2 space-y-1 text-sm text-white">
                {node.project.highlights.slice(0, 3).map((h, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[5px] h-[1px] w-4 shrink-0 bg-[#FF0000]" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
            {node.project?.links?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {node.project.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="border px-2 py-1 font-mono text-sm transition-colors hover:border-[#FF0000]"
                    style={{ borderColor: "#404040", color: ACCENT }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {link.label}
                  </a>
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
          <NodeMedia node={node} videos={projectVideos} />
        </div>
      </Wrapper>
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
                {node.bullets.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[5px] h-[1px] w-3 shrink-0 bg-[#FF0000]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
            {node.semesters && (
              <div className="mb-3 grid gap-2 text-sm text-white md:grid-cols-2">
                {node.semesters.map((sem) => (
                  <div key={sem.term}>
                    <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-white">{sem.term}</div>
                    <ul className="mt-1 space-y-0.5">
                      {sem.courses.map((course) => (
                        <li key={course}>{course}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {node.events && (
              <div className="space-y-2 border-t border-neutral-800 pt-3 text-sm text-white">
                {node.events.map((event) => (
                  <div key={event.title}>
                    <div className="font-mono text-xs uppercase tracking-[0.16em] text-white">{event.dateLabel}</div>
                    <div className="text-sm font-semibold text-white">{event.title}</div>
                    <p className="text-white">{event.description}</p>
                    {event.links && (
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        {event.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="border border-neutral-700 px-2 py-1 font-mono text-xs hover:border-[#FF0000]"
                            style={{ color: ACCENT }}
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <NodeMedia node={node} />
        </div>
      </article>
    );
  }

  if (node.type === "career") {
    const showRelatedProjects =
      relatedProjectLinks?.length > 0 && typeof onOpenProject === "function";
    return (
      <article className={baseClasses}>
        <div className="md:flex md:items-stretch md:justify-between md:gap-4">
          <div className="md:flex-1">
            <header className="mb-2">
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-white">
                {node.dateLabel} · CAREER
              </div>
              <h3 className="mt-1 text-lg font-semibold text-white">{node.title}</h3>
              <p className="text-sm text-white">
                {node.organization}
                {node.location ? ` · ${node.location}` : null}
              </p>
            </header>
            {node.summary && <p className="mb-3 whitespace-pre-line text-base text-white">{node.summary}</p>}
            {node.bullets && (
              <ul className="mt-2 space-y-1 text-sm text-white">
                {node.bullets.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[5px] h-[1px] w-3 bg-[#FF0000]" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
            {showRelatedProjects && (
              <div className="mt-3 flex flex-wrap gap-2">
                {relatedProjectLinks.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onOpenProject(id)}
                    className="border px-2 py-1 font-mono text-sm transition-colors hover:border-[#FF0000]"
                    style={{ borderColor: "#404040", color: ACCENT }}
                  >
                    {label} →
                  </button>
                ))}
              </div>
            )}
          </div>
          <NodeMedia node={node} videos={mediaVideos} />
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
                {node.notes.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <NodeMedia node={node} />
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
              {node.details.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          )}
        </div>
        <NodeMedia node={node} />
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
}) {
  const embedded = mode === "monitor" || mode === "fullscreen";
  const { timeline, site, loading, error } = useContent();
  const [activeYear, setActiveYear] = useState(null);
  const [filter, setFilter] = useState("work");
  const [modalProject, setModalProject] = useState(null);
  const [returnToWorkOnModalClose, setReturnToWorkOnModalClose] = useState(false);
  const [endSpacerPx, setEndSpacerPx] = useState(280);
  const timelineContainerRef = useRef(null);
  const pinnedYearRef = useRef(null);
  const pinReleaseTimerRef = useRef(null);
  const overscrollHintAtRef = useRef(0);

  const hero = site?.hero || {};
  const contactEmail = site?.contact?.email || "Akshatshahi2006@gmail.com";
  const socials = Array.isArray(site?.socials)
    ? site.socials
    : [
        { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/akshat-shahi-651684217/" },
        { id: "github", label: "GitHub", url: "https://github.com/Chikki06" },
      ];

  const projectsById = useMemo(() => {
    const map = new Map();
    for (const node of Array.isArray(timeline) ? timeline : []) {
      if (node.type === "project" && node.project?.id) map.set(node.project.id, node.project);
    }
    return map;
  }, [timeline]);

  const filteredData = useMemo(() => {
    const base = Array.isArray(timeline) ? timeline : [];
    if (filter === "work") return base.filter((n) => n.type === "career");
    if (filter === "projects") return base.filter((n) => n.type === "project");
    return base;
  }, [filter, timeline]);

  const grouped = useMemo(() => groupByYearPreservingOrder(filteredData), [filteredData]);

  useEffect(() => {
    if (!grouped.years.length) return;
    setActiveYear(grouped.years[0]);
  }, [grouped.years]);

  useEffect(() => () => clearTimeout(pinReleaseTimerRef.current), []);

  // Enough trailing space that the last year can become majority-visible.
  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container) return undefined;
    const update = () => setEndSpacerPx(Math.max(Math.round(container.clientHeight * 0.45), 160));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [embedded, grouped.years, filter]);

  const resolveActiveYearFromScroll = useCallback(() => {
    const container = timelineContainerRef.current;
    if (!container || !grouped.years.length) return null;

    const { scrollTop, clientHeight, scrollHeight } = container;
    const containerRect = container.getBoundingClientRect();
    const viewTop = scrollTop;
    const viewBottom = scrollTop + clientHeight;

    // At the hard bottom, the last year always wins — thin cards included.
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
  }, [grouped.years]);

  // Majority-visible year spy; clicks pin the destination until the smooth scroll settles.
  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      if (pinnedYearRef.current != null) {
        setActiveYear(pinnedYearRef.current);
        return;
      }
      const nextYear = resolveActiveYearFromScroll();
      if (nextYear != null) setActiveYear((prev) => (prev === nextYear ? prev : nextYear));
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [grouped.years, resolveActiveYearFromScroll]);

  // Fullscreen: keep scrolling at the bottom nudges the exit control.
  useEffect(() => {
    if (mode !== "fullscreen" || !onBottomOverscroll) return undefined;
    const container = timelineContainerRef.current;
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
  }, [mode, onBottomOverscroll]);

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
    const element = timelineContainerRef.current;
    if (!element) return false;
    const delta = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? element.clientHeight : 1);
    const atTop = element.scrollTop <= 0;
    const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
    if ((delta < 0 && atTop) || (delta > 0 && atBottom) || delta === 0) return false;
    element.scrollTop += delta;
    return true;
  }, []);

  useEffect(() => {
    if (!onScrollControllerChange) return undefined;
    onScrollControllerChange(consumeWheel);
    return () => onScrollControllerChange(null);
  }, [consumeWheel, onScrollControllerChange]);

  const openProjectById = useCallback((projectId) => {
    const timelineNode = Array.isArray(timeline)
      ? timeline.find((n) => n.type === "project" && n.project?.id === projectId)
      : null;
    if (timelineNode?.project) {
      setReturnToWorkOnModalClose(true);
      setFilter("projects");
      setModalProject(timelineNode.project);
    }
  }, [timeline]);

  const handleCloseProjectModal = useCallback(() => {
    if (returnToWorkOnModalClose) {
      setFilter("work");
      setReturnToWorkOnModalClose(false);
    }
    setModalProject(null);
  }, [returnToWorkOnModalClose]);

  const handleYearClick = (year) => {
    pinnedYearRef.current = year;
    setActiveYear(year);
    clearTimeout(pinReleaseTimerRef.current);

    const container = timelineContainerRef.current;
    if (!container) return;
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
    const scrollTop = container.scrollTop;
    const sectionTop = rect.top - containerRect.top + scrollTop;
    const maxScroll = Math.max(container.scrollHeight - container.clientHeight, 0);
    const targetY = Math.min(Math.max(sectionTop - 24, 0), maxScroll);
    container.scrollTo({ top: targetY, behavior: "smooth" });

    const releasePin = () => {
      pinnedYearRef.current = null;
      const nextYear = resolveActiveYearFromScroll();
      if (nextYear != null) setActiveYear(nextYear);
    };

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
    "relative overflow-hidden text-white",
    mode === "page" ? "min-h-screen" : "flex h-full min-h-0 flex-col",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      style={{ backgroundColor: BG, color: FG, fontFamily: "system-ui, sans-serif", ...style }}
    >
      <header className="relative z-10 border-b border-neutral-900 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {hero.name || "Akshat Kumar Shahi"}
          </h1>
          {hero.tagline && <p className="mt-2 max-w-2xl text-base text-white">{hero.tagline}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-base">
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-2 border-b border-transparent transition-colors hover:border-[#FF0000]"
              style={{ color: ACCENT }}
            >
              <Mail className="h-5 w-5" />
              {contactEmail}
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
                  {Icon && <Icon className="h-5 w-5" />}
                  {social.label}
                </a>
              );
            })}
          </div>
        </div>
      </header>

      <div
        className={`relative z-10 mx-auto flex max-w-6xl gap-6 px-4 pb-16 pt-10 md:px-8 md:pt-14 ${
          embedded ? "min-h-0 flex-1" : ""
        }`}
      >
        <aside className="hidden w-32 shrink-0 md:block">
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
                    className={`flex w-full cursor-pointer items-center gap-2 border-l-2 px-2 py-1.5 text-left font-mono transition-colors ${
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

        <main className={`flex-1 ${embedded ? "flex min-h-0 flex-col" : ""}`}>
          <div className="sticky top-0 z-20 border-b border-neutral-900 pb-4 pt-2" style={{ backgroundColor: BG }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-white">Timeline</h2>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-white">View</span>
                <div className="flex border border-neutral-800 bg-neutral-950/80">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFilter(f.value)}
                      className="cursor-pointer border-r border-neutral-800 px-3 py-2 font-mono text-sm uppercase tracking-[0.14em] transition-colors last:border-r-0 hover:bg-neutral-800/80"
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
            className={`portfolio-scroll relative mt-6 overflow-y-auto ${embedded ? "mt-3 min-h-0 flex-1" : ""}`}
            style={embedded ? undefined : { maxHeight: "calc(100vh - 210px)" }}
          >
            <div className="absolute bottom-0 left-[10px] top-0 hidden w-px bg-neutral-900 md:block" />

            <div className="space-y-10">
              {grouped.years.map((year) => {
                const nodesForYear = grouped.groupedMap.get(year) || [];
                const yearNodes = nodesForYear.map((node) => {
                  const isCislCareer =
                    node.type === "career" &&
                    (node.organization?.includes("CISL") ||
                      node.organization?.includes("Chemical Imaging") ||
                      node.id === "2024-cisl-career");
                  const relatedVideos = isCislCareer
                    ? CISL_RELATED_PROJECT_IDS.flatMap(({ id }) => collectProjectVideos(projectsById.get(id)))
                    : undefined;
                  return (
                    <TimelineNode
                      key={node.id}
                      node={node}
                      onProjectClick={setModalProject}
                      onOpenProject={openProjectById}
                      relatedProjectLinks={isCislCareer ? CISL_RELATED_PROJECT_IDS : undefined}
                      relatedVideos={relatedVideos}
                    />
                  );
                });

                return (
                  <section key={year} id={`year-${year}`} className="scroll-mt-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="hidden items-center gap-3 md:flex">
                        <div
                          className="h-[9px] w-[9px] border"
                          style={{
                            borderColor: year === activeYear ? ACCENT : "#525252",
                            backgroundColor: year === activeYear ? ACCENT : "transparent",
                          }}
                        />
                        <div className="font-mono text-xs uppercase tracking-[0.18em] text-white">{year}</div>
                      </div>
                      <div className="md:hidden">
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
        </main>
      </div>

      <ProjectModal project={modalProject} isOpen={!!modalProject} onClose={handleCloseProjectModal} />
    </div>
  );
}
