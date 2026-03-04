import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mail, Linkedin, Github } from "lucide-react";
import { useContent } from "../hooks/useContent.js";
import ProjectModal from "./ProjectModal.jsx";
import BackgroundFireOverlay from "./BackgroundFireOverlay.jsx";

const ACCENT = "#c41a1a";
const BG = "#0a0a0a";
const FG = "#ededed";

const FILTERS = [
  { value: "work", label: "Work" },
  { value: "projects", label: "Projects" },
  { value: "all", label: "All" },
];

// Project IDs to show as "View project" links on the CISL work entry.
const CISL_RELATED_PROJECT_IDS = [
  { id: "cisl-inference-pipeline", label: "Inference pipeline" },
  { id: "cisl-web-viewer", label: "Web viewer" },
];

// Group nodes by year preserving array order (years in first-occurrence order).
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

function NodeImages({ node }) {
  const images = node.images && Array.isArray(node.images) ? node.images : [];
  if (!images.length) return null;

  return (
    <aside className="mt-3 md:mt-0 md:ml-4 md:w-52">
      <div className="h-28 overflow-x-auto flex gap-2 md:h-40 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
        {images.map((img) => (
          <div key={img.src} className="shrink-0 md:w-full">
            <div className="relative h-24 w-32 overflow-hidden rounded border border-neutral-800 bg-neutral-950 md:h-24 md:w-full">
              <img
                src={img.src}
                alt={img.alt || ""}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function TimelineNode({ node, onProjectClick, onOpenProject, relatedProjectLinks }) {
  const baseClasses =
    "border border-neutral-800 px-4 py-4 text-base leading-relaxed";

  if (node.type === "project") {
    const hasDetails = node.project?.hasDetails && node.project;
    const Wrapper = hasDetails ? "button" : "article";
    const wrapperProps = hasDetails
      ? {
          type: "button",
          className: `${baseClasses} w-full text-left cursor-pointer hover:border-[#c41a1a] transition-colors`,
          onClick: () => onProjectClick?.(node.project),
        }
      : { className: baseClasses };

    return (
      <Wrapper {...wrapperProps}>
        <div className="md:flex md:items-stretch md:justify-between md:gap-4">
          <div className="md:flex-1">
            <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                  {node.dateLabel} · PROJECT
                </div>
                <h3 className="mt-1 text-lg font-semibold text-neutral-50">
                  {node.title}
                </h3>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <span className="font-mono">{node.project?.id}</span>
                {hasDetails && (
                  <span className="ml-1 text-[#c41a1a] font-mono">→</span>
                )}
              </div>
            </header>
            {node.summary && (
              <p className="mb-3 text-neutral-200 whitespace-pre-line">
                {node.summary}
              </p>
            )}
            {node.project?.highlights && (
              <ul className="mt-2 space-y-1 text-sm text-neutral-300">
                {node.project.highlights.slice(0, 3).map((h, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[5px] h-[1px] w-4 bg-neutral-700 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
            {node.project?.links && node.project.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {node.project.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm border px-2 py-1 font-mono hover:border-[#c41a1a] transition-colors"
                    style={{ borderColor: "#404040", color: ACCENT }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            {node.project?.tags && (
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-mono uppercase tracking-[0.16em] text-neutral-500">
                {node.project.tags.slice(0, 6).map((tag) => (
                  <span
                    key={tag}
                    className="border border-neutral-700 px-1.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <NodeImages node={node} />
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
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                {node.dateLabel} · EDUCATION
              </div>
              <h3 className="mt-1 text-lg font-semibold text-neutral-50">
                {node.title}
              </h3>
              {(org || node.program) && (
                <p className="text-sm text-neutral-400">
                  {[org, node.program, loc].filter(Boolean).join(" · ")}
                </p>
              )}
            </header>
            {node.summary && (
              <p className="mb-3 text-base text-neutral-200 whitespace-pre-line">
                {node.summary}
              </p>
            )}
            {node.bullets && node.bullets.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-neutral-300">
                {node.bullets.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[5px] h-[1px] w-3 bg-neutral-700 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
            {node.semesters && (
              <div className="mb-3 grid gap-2 text-sm text-neutral-300 md:grid-cols-2">
                {node.semesters.map((sem) => (
                  <div key={sem.term}>
                    <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      {sem.term}
                    </div>
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
              <div className="space-y-2 border-t border-neutral-800 pt-3 text-sm text-neutral-200">
                {node.events.map((event) => (
                  <div key={event.title}>
                    <div className="font-mono text-xs uppercase tracking-[0.16em] text-neutral-500">
                      {event.dateLabel}
                    </div>
                    <div className="text-sm font-semibold text-neutral-100">
                      {event.title}
                    </div>
                    <p className="text-neutral-300">{event.description}</p>
                    {event.links && (
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        {event.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="border border-neutral-700 px-2 py-1 font-mono text-xs hover:border-[#c41a1a]"
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
          <NodeImages node={node} />
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
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                {node.dateLabel} · CAREER
              </div>
              <h3 className="mt-1 text-lg font-semibold text-neutral-50">
                {node.title}
              </h3>
              <p className="text-sm text-neutral-400">
                {node.organization}
                {node.location ? ` · ${node.location}` : null}
              </p>
            </header>
            {node.summary && (
              <p className="mb-3 text-base text-neutral-200 whitespace-pre-line">
                {node.summary}
              </p>
            )}
            {node.bullets && (
              <ul className="mt-2 space-y-1 text-sm text-neutral-300">
                {node.bullets.map((line, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-[5px] h-[1px] w-3 bg-neutral-700" />
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
                    className="text-sm border px-2 py-1 font-mono hover:border-[#c41a1a] transition-colors"
                    style={{ borderColor: "#404040", color: ACCENT }}
                  >
                    {label} →
                  </button>
                ))}
              </div>
            )}
          </div>
          <NodeImages node={node} />
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
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                {node.dateLabel} · TRIP
              </div>
              <h3 className="mt-1 text-lg font-semibold text-neutral-50">
                {node.title}
              </h3>
              {node.location && (
                <p className="text-sm text-neutral-400">{node.location}</p>
              )}
            </header>
            {node.summary && (
              <p className="mb-3 text-base text-neutral-200 whitespace-pre-line">
                {node.summary}
              </p>
            )}
            {node.notes && (
              <ul className="mt-2 space-y-1 text-sm text-neutral-300">
                {node.notes.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <NodeImages node={node} />
        </div>
      </article>
    );
  }

  // life_event / default
  return (
    <article className={baseClasses}>
      <div className="md:flex md:items-stretch md:justify-between md:gap-4">
        <div className="md:flex-1">
          <header className="mb-2">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              {node.dateLabel} · LIFE
            </div>
            <h3 className="mt-1 text-lg font-semibold text-neutral-50">
              {node.title}
            </h3>
            {node.location && (
              <p className="text-sm text-neutral-400">{node.location}</p>
            )}
          </header>
          {node.summary && (
            <p className="mb-3 text-base text-neutral-200 whitespace-pre-line">
              {node.summary}
            </p>
          )}
          {node.details && (
            <ul className="mt-2 space-y-1 text-sm text-neutral-300">
              {node.details.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          )}
        </div>
        <NodeImages node={node} />
      </div>
    </article>
  );
}

export default function Portfolio() {
  const { timeline, site, loading, error } = useContent();
  const [activeYear, setActiveYear] = useState(null);
  const [filter, setFilter] = useState("work");
  const [modalProject, setModalProject] = useState(null);
  const [returnToWorkOnModalClose, setReturnToWorkOnModalClose] = useState(false);
  const timelineContainerRef = useRef(null);

  const hero = site?.hero || {};
  const contactEmail = site?.contact?.email || "Akshatshahi2006@gmail.com";
  const socials = Array.isArray(site?.socials)
    ? site.socials
    : [
        {
          id: "linkedin",
          label: "LinkedIn",
          url: "https://www.linkedin.com/in/akshat-shahi-651684217/",
        },
        {
          id: "github",
          label: "GitHub",
          url: "https://github.com/Chikki06",
        },
      ];

  const filteredData = useMemo(() => {
    const base = Array.isArray(timeline) ? timeline : [];
    if (filter === "work") {
      return base.filter((n) => n.type === "career");
    }
    if (filter === "projects") {
      return base.filter((n) => n.type === "project");
    }
    return base;
  }, [filter, timeline]);

  const grouped = useMemo(() => {
    return groupByYearPreservingOrder(filteredData);
  }, [filteredData]);

  useEffect(() => {
    if (!grouped.years.length) return;
    // First year in list (order comes from timeline array)
    setActiveYear(grouped.years[0]);
  }, [grouped.years]);

  // Keep the active year in sync with scroll position inside the timeline container
  // by tracking which year section is closest to a probe point in that container.
  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!grouped.years.length) return;

      const scrollTop = container.scrollTop;
      const containerRect = container.getBoundingClientRect();
      const containerTop = scrollTop;
      const containerBottom = scrollTop + (container.clientHeight || 0);

      let bestYear = null;
      let bestVisible = 0;

      for (const year of grouped.years) {
        const el = document.getElementById(`year-${year}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const sectionTop = rect.top - containerRect.top + scrollTop;
        const sectionBottom = sectionTop + rect.height;

        const visibleTop = Math.max(sectionTop, containerTop);
        const visibleBottom = Math.min(sectionBottom, containerBottom);
        const visibleHeight = Math.max(visibleBottom - visibleTop, 0);

        if (visibleHeight > bestVisible) {
          bestVisible = visibleHeight;
          bestYear = year;
        }
      }

      // Fallback to the most recent year if something goes wrong.
      const nextYear = bestYear ?? grouped.years[0] ?? null;
      if (nextYear !== null && nextYear !== activeYear) {
        setActiveYear(nextYear);
      }
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [grouped.years, activeYear]);

  // When timeline is at top/bottom, pass wheel through to page so one continuous
  // scroll brings timeline into view, scrolls it, then continues the page.
  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container) return;

    const BOUNDARY = 4;

    const onWheel = (e) => {
      const { scrollTop, clientHeight, scrollHeight } = container;
      const atTop = scrollTop <= BOUNDARY;
      const atBottom = scrollTop + clientHeight >= scrollHeight - BOUNDARY;
      const scrollingDown = e.deltaY > 0;
      const scrollingUp = e.deltaY < 0;

      if (atBottom && scrollingDown) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
      } else if (atTop && scrollingUp) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
      }
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

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
    setActiveYear(year);
    const container = timelineContainerRef.current;

    if (container) {
      // Ensure the whole timeline window itself is comfortably in view
      // by scrolling the main page so the container sits below the hero header.
      const containerRect = container.getBoundingClientRect();
      const winScrollTop = window.scrollY || window.pageYOffset;
      const PAGE_OFFSET = 110;
      const pageTargetTop = Math.max(
        containerRect.top + winScrollTop - PAGE_OFFSET,
        0,
      );
      window.scrollTo({ top: pageTargetTop, behavior: "smooth" });

      const el = document.getElementById(`year-${year}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight || 0;
        const containerHeight = container.clientHeight || 0;

        // Position of the section top within the scroll container:
        const sectionTop = rect.top - containerRect.top + scrollTop;
        const sectionHeight = rect.height;

        // Try to center the clicked year section within the timeline window
        // so navigation visibly moves, even when the user hasn't scrolled yet.
        let targetY =
          sectionTop - (containerHeight - sectionHeight) / 2;

        // Clamp so that when navigating to the last card, its bottom is still visible.
        const maxScroll = Math.max(scrollHeight - containerHeight, 0);
        targetY = Math.min(Math.max(targetY, 0), maxScroll);

        container.scrollTo({ top: targetY, behavior: "smooth" });
        return;
      }
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: BG, color: FG, fontFamily: "system-ui, sans-serif" }}
    >
      <BackgroundFireOverlay />

      {/* Hero: name + socials */}
      <header className="relative z-10 border-b border-neutral-900 px-4 py-10 md:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50 md:text-4xl">
            {hero.name || "Akshat Kumar Shahi"}
          </h1>
          {hero.tagline && (
            <p className="mt-2 max-w-2xl text-base text-neutral-300">
              {hero.tagline}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-base">
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-2 border-b border-transparent hover:border-[#c41a1a] transition-colors"
              style={{ color: ACCENT }}
            >
              <Mail className="h-5 w-5" />
              {contactEmail}
            </a>
            {socials.map((social) => {
              const key = social.id || social.label || social.url;
              const id = (social.id || "").toLowerCase();
              const Icon =
                id === "github" ? Github : id === "linkedin" ? Linkedin : null;
              return (
                <a
                  key={key}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 border-b border-transparent hover:border-[#c41a1a] transition-colors"
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

      <div className="relative z-10 mx-auto flex max-w-6xl gap-6 px-4 pb-16 pt-10 md:px-8 md:pt-14">
        {/* Sticky year navigation */}
        <aside className="hidden w-32 shrink-0 md:block">
          <div className="sticky top-16">
            <div className="mb-4 text-xs font-mono uppercase tracking-[0.18em] text-neutral-500">
              Years
            </div>
            <nav className="space-y-0.5 text-sm">
              {grouped.years.map((year) => {
                const isActive = year === activeYear;
                return (
                  <button
                    key={year}
                    onClick={() => handleYearClick(year)}
                    className={`flex w-full items-center gap-2 border-l-2 px-2 py-1.5 text-left font-mono transition-colors cursor-pointer ${
                      isActive ? "" : "hover:border-neutral-500 hover:text-neutral-200"
                    }`}
                    style={{
                      borderColor: isActive ? ACCENT : "#262626",
                      color: isActive ? ACCENT : "#a3a3a3",
                    }}
                  >
                    <span>{year}</span>
                    {isActive && (
                      <span
                        className="h-[1px] flex-1"
                        style={{ backgroundColor: ACCENT }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Timeline */}
        <main className="flex-1">
          <div
            className="sticky top-0 z-20 border-b border-neutral-900 pb-4 pt-2"
            style={{ backgroundColor: BG }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-neutral-50">
                Timeline
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                  View
                </span>
                <div className="flex border border-neutral-800 bg-neutral-950/80">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className="px-3 py-2 text-sm font-mono uppercase tracking-[0.14em] transition-colors cursor-pointer border-r border-neutral-800 last:border-r-0 hover:bg-neutral-800/80"
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
              <div className="mt-2 text-xs font-mono uppercase tracking-[0.16em] text-neutral-500">
                Loading latest content…
              </div>
            )}
            {error && (
              <div className="mt-2 text-xs font-mono uppercase tracking-[0.16em] text-[#c41a1a]">
                Using bundled content. Admin API not reachable.
              </div>
            )}
          </div>

          <div
            ref={timelineContainerRef}
            className="relative mt-6 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 210px)" }}
          >
            <div className="absolute left-[10px] top-0 bottom-0 hidden w-px bg-neutral-900 md:block" />

            <div className="space-y-10">
              {grouped.years.map((year) => {
                const nodesForYear = grouped.groupedMap.get(year) || [];
                const yearNodes = nodesForYear.map((node) => (
                  <TimelineNode
                    key={node.id}
                    node={node}
                    onProjectClick={setModalProject}
                    onOpenProject={openProjectById}
                    relatedProjectLinks={
                      node.type === "career" &&
                      (node.organization?.includes("CISL") ||
                        node.organization?.includes("Chemical Imaging") ||
                        node.id === "2024-cisl-career")
                        ? CISL_RELATED_PROJECT_IDS
                        : undefined
                    }
                  />
                ));

                return (
                  <section
                    key={year}
                    id={`year-${year}`}
                    className="scroll-mt-20"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="hidden items-center gap-3 md:flex">
                        <div
                          className="h-[9px] w-[9px] border"
                          style={{
                            borderColor: year === activeYear ? ACCENT : "#525252",
                            backgroundColor:
                              year === activeYear ? ACCENT : "transparent",
                          }}
                        />
                        <div className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                          {year}
                        </div>
                      </div>
                      <div className="md:hidden">
                        <div className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
                          {year}
                        </div>
                      </div>
                      <div className="h-px flex-1 bg-neutral-900" />
                    </div>

                    <div className="space-y-3">{yearNodes}</div>
                  </section>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <ProjectModal
        project={modalProject}
        isOpen={!!modalProject}
        onClose={handleCloseProjectModal}
      />
    </div>
  );
}
