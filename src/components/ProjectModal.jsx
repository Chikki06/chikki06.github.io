import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import HoverDemoVideo, { resolveDemo } from "./HoverDemoVideo.jsx";
import OutboundLink from "./OutboundLink.jsx";

const ACCENT = "#FF0000";
const BG = "#0a0a0a";
const FG = "#ffffff";

/**
 * Concise project / experience detail modal.
 * Layout: header → two columns (copy + features | autoplay demo) → tech + links.
 * Portaled to document.body so fixed positioning works inside the CSS3D monitor Html.
 * z-index sits above SiteNav (70) and the mobile sticky chrome (65).
 */
export default function ProjectModal({ project, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };

    // Keep wheel/touch on the backdrop from scrolling the site behind the portal.
    const blockBackgroundScroll = (event) => {
      if (event.target?.closest?.("[data-project-modal-scroll]")) return;
      event.preventDefault();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape, true);
    window.addEventListener("wheel", blockBackgroundScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", blockBackgroundScroll, { passive: false, capture: true });

    return () => {
      document.removeEventListener("keydown", handleEscape, true);
      window.removeEventListener("wheel", blockBackgroundScroll, { capture: true });
      window.removeEventListener("touchmove", blockBackgroundScroll, { capture: true });
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const summary = project.shortDescription || project.summary || "";
  const features = Array.isArray(project.features) ? project.features : [];
  const highlights =
    features.length === 0 && Array.isArray(project.highlights) ? project.highlights : [];
  const technologies = project.technologies || project.tags || [];
  const links = project.links || [];
  const demo = resolveDemo(project);
  const images = Array.isArray(project.images) ? project.images : [];
  const hasMedia = Boolean(demo) || images.length > 0;

  return createPortal(
    <div
      data-project-modal
      className="pointer-events-auto fixed inset-0 z-[100] flex items-stretch justify-center md:items-center md:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div
        className="relative flex h-dvh w-full max-w-5xl flex-col overflow-hidden text-white md:h-auto md:max-h-[min(90dvh,880px)] md:border md:border-neutral-800"
        style={{ backgroundColor: BG, color: FG }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="z-10 flex shrink-0 items-start justify-between gap-3 border-b border-neutral-800 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:gap-4 md:px-5 md:py-4 md:pt-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-white md:text-3xl">
              {project.title}
            </h2>
            {project.subtitle && (
              <p className="mt-1 text-sm text-neutral-300 md:text-base">{project.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-neutral-600 p-2 text-white transition-colors hover:border-[#FF0000] hover:text-[#FF0000]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          data-project-modal-scroll
          className="portfolio-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-5 md:py-5"
        >
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,38%)] md:items-start md:gap-6">
            <div className="min-w-0">
              {summary && (
                <p className="text-sm leading-relaxed text-white md:text-lg">{summary}</p>
              )}

              {features.length > 0 && (
                <section className="mt-5 md:mt-6">
                  <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-neutral-400 md:text-sm">
                    At a glance
                  </h3>
                  <ul className="space-y-3.5 md:space-y-4">
                    {features.map((feature) => {
                      const title =
                        typeof feature === "string" ? feature : feature.title;
                      const description =
                        typeof feature === "string" ? null : feature.description;
                      return (
                        <li key={title} className="border-l-2 pl-3" style={{ borderColor: ACCENT }}>
                          <div className="text-sm font-semibold text-white md:text-base">{title}</div>
                          {description && (
                            <p className="mt-1 text-sm leading-relaxed text-neutral-300">
                              {description}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {highlights.length > 0 && (
                <section className="mt-5 md:mt-6">
                  <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-neutral-400 md:text-sm">
                    Highlights
                  </h3>
                  <ul className="space-y-2">
                    {highlights.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-white">
                        <span className="mt-[7px] h-px w-3 shrink-0 bg-[#FF0000]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {technologies.length > 0 && (
                <section className="mt-5 md:mt-6">
                  <h3 className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-neutral-400 md:text-sm">
                    Tech
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {technologies.map((tech) => (
                      <span
                        key={tech}
                        className="border border-neutral-700 px-2 py-1 font-mono text-xs text-white md:text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {links.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2 md:mt-6">
                  {links.map((link) => (
                    <OutboundLink key={`${link.label}-${link.url}`} link={link} />
                  ))}
                </div>
              )}
            </div>

            {hasMedia && (
              <aside className="order-first space-y-3 md:order-none md:sticky md:top-0">
                {demo && (
                  <>
                    <HoverDemoVideo
                      src={demo.src}
                      href={demo.href}
                      title={demo.label || project.title}
                    />
                    {demo.href && demo.label && (
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500 md:text-xs">
                        Click video → {demo.label}
                      </p>
                    )}
                  </>
                )}
                {images.map((img) => (
                  <div
                    key={img.src}
                    className="overflow-hidden border border-neutral-800 bg-neutral-950"
                  >
                    <img
                      src={img.src}
                      alt={img.alt || project.title}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                ))}
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
