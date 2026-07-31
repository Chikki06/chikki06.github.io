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
      className="pointer-events-auto fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.9)", zIndex: 60 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden border border-neutral-800 text-white"
        style={{ backgroundColor: BG, color: FG }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-neutral-800 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {project.title}
            </h2>
            {project.subtitle && (
              <p className="mt-1 text-base text-neutral-300">{project.subtitle}</p>
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
          className="portfolio-scroll max-h-[calc(90vh-88px)] overflow-y-auto overscroll-contain px-5 py-5"
        >
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,38%)] md:items-start">
            <div className="min-w-0">
              {summary && (
                <p className="text-base leading-relaxed text-white md:text-lg">{summary}</p>
              )}

              {features.length > 0 && (
                <section className="mt-6">
                  <h3 className="mb-3 font-mono text-sm uppercase tracking-[0.14em] text-neutral-400">
                    At a glance
                  </h3>
                  <ul className="space-y-4">
                    {features.map((feature) => {
                      const title =
                        typeof feature === "string" ? feature : feature.title;
                      const description =
                        typeof feature === "string" ? null : feature.description;
                      return (
                        <li key={title} className="border-l-2 pl-3" style={{ borderColor: ACCENT }}>
                          <div className="text-base font-semibold text-white">{title}</div>
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
                <section className="mt-6">
                  <h3 className="mb-3 font-mono text-sm uppercase tracking-[0.14em] text-neutral-400">
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
                <section className="mt-6">
                  <h3 className="mb-2 font-mono text-sm uppercase tracking-[0.14em] text-neutral-400">
                    Tech
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {technologies.map((tech) => (
                      <span
                        key={tech}
                        className="border border-neutral-700 px-2 py-1 font-mono text-sm text-white"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {links.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {links.map((link) => (
                    <OutboundLink key={`${link.label}-${link.url}`} link={link} />
                  ))}
                </div>
              )}
            </div>

            {hasMedia && (
              <aside className="space-y-3 md:sticky md:top-0">
                {demo && (
                  <>
                    <HoverDemoVideo
                      src={demo.src}
                      href={demo.href}
                      title={demo.label || project.title}
                    />
                    {demo.href && demo.label && (
                      <p className="font-mono text-xs uppercase tracking-[0.12em] text-neutral-500">
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
