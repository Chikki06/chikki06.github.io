import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

const ACCENT = "#c41a1a";
const BG = "#0a0a0a";
const FG = "#ededed";

export default function ProjectModal({ project, isOpen, onClose }) {
  const [isTldr, setIsTldr] = useState(false);
  const [openSection, setOpenSection] = useState("overview");

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const shortSummary =
    project.shortDescription ||
    (Array.isArray(project.overview) ? project.overview[0] : project.overview) ||
    project.title;
  const highlights = project.highlights || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden border border-neutral-800"
        style={{ backgroundColor: BG, color: FG }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-50 md:text-3xl">
              {project.title}
            </h2>
            {project.subtitle && (
              <p className="mt-1 text-base text-neutral-300">{project.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border border-neutral-600 text-neutral-400 hover:border-[#c41a1a] hover:text-[#c41a1a] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TLDR / Detailed toggle */}
        <div className="sticky top-[72px] z-10 flex items-center gap-3 border-b border-neutral-800 px-5 py-2 bg-[#0a0a0a]">
          <span className="text-sm text-neutral-400">Brief</span>
          <button
            type="button"
            onClick={() => setIsTldr(!isTldr)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-sm border transition-colors ${
              isTldr ? "border-[#c41a1a] bg-[#c41a1a]" : "border-neutral-600 bg-transparent"
            }`}
            aria-pressed={isTldr}
          >
            <span
              className={`inline-block h-4 w-4 bg-neutral-50 transform transition-transform ${
                isTldr ? "translate-x-1 ml-0.5" : "translate-x-6"
              }`}
            />
          </button>
          <span className="text-sm text-neutral-400">Detailed</span>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-5 py-5">
          {/* Links */}
          {project.links && project.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {project.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 border text-base transition-colors"
                  style={{ borderColor: ACCENT, color: ACCENT }}
                >
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {isTldr ? (
            /* TLDR: condensed, direct. No bullet dumps with "+N more". */
            <>
              <section className="mb-6">
                <p className="text-lg leading-relaxed text-neutral-100 max-w-2xl">
                  {typeof shortSummary === "string" ? shortSummary : ""}
                </p>
              </section>
              {highlights.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-neutral-400 mb-2">
                    At a glance
                  </h3>
                  <p className="text-base leading-relaxed text-neutral-200">
                    {highlights.join(" ")}
                  </p>
                </section>
              )}
              {project.impact?.achievements && project.impact.achievements.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-neutral-400 mb-2">
                    Results
                  </h3>
                  <p className="text-base leading-relaxed text-neutral-200">
                    {project.impact.achievements.join(" ")}
                  </p>
                </section>
              )}
              {project.technologies && project.technologies.length > 0 && (
                <section>
                  <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-neutral-400 mb-2">
                    Tech
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 border text-sm font-mono text-neutral-300"
                        style={{ borderColor: "#404040" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            /* Detailed view: full content */
            <>
              <section className="mb-6">
                <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-neutral-400 mb-2">
                  Overview
                </h3>
                <div className="text-base leading-relaxed text-neutral-100">
                  {Array.isArray(project.overview) ? (
                    project.overview.map((p, i) => (
                      <p key={i} className="mb-3">
                        {p}
                      </p>
                    ))
                  ) : (
                    <p>{project.overview || shortSummary}</p>
                  )}
                </div>
              </section>

              {project.impact?.achievements && project.impact.achievements.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-neutral-400 mb-2">
                    Results
                  </h3>
                  <ul className="space-y-1.5 text-base text-neutral-200">
                    {project.impact.achievements.map((a, i) => (
                      <li key={i} className="flex gap-2">
                        <span style={{ color: ACCENT }}>—</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {project.timeline && project.timeline.length > 0 && (
                <section className="mb-6">
                  <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-neutral-400 mb-3">
                    Phases
                  </h3>
                  <div className="space-y-4">
                    {project.timeline.map((phase, idx) => (
                      <div
                        key={idx}
                        className="border border-neutral-800 p-4"
                      >
                        <h4 className="text-base font-semibold text-neutral-100 mb-2">
                          {phase.title}
                        </h4>
                        {phase.description && (
                          <p className="text-base text-neutral-200 mb-3">
                            {phase.description}
                          </p>
                        )}
                        {phase.videoUrl && (
                          <div className="mb-3 max-w-md">
                            <div className="relative pt-[56.25%] border border-neutral-800">
                              <iframe
                                className="absolute inset-0 w-full h-full"
                                src={phase.videoUrl}
                                title={phase.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}
                        {phase.features && phase.features.length > 0 && (
                          <ul className="text-base text-neutral-200 space-y-1">
                            {phase.features.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        )}
                        {phase.technologies && phase.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {phase.technologies.map((t, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 border text-sm font-mono text-neutral-400"
                                style={{ borderColor: "#404040" }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {project.architectureSections && project.architectureSections.length > 0 && (
                <section className="mb-6">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === "arch" ? null : "arch")}
                    className="w-full flex items-center justify-between text-base font-mono uppercase tracking-[0.14em] text-neutral-300 hover:text-neutral-100 py-2 border-b border-neutral-800"
                  >
                    <span>Architecture & design</span>
                    <span>{openSection === "arch" ? "−" : "+"}</span>
                  </button>
                  {openSection === "arch" && (
                    <div className="pt-4 space-y-4">
                      {project.architectureSections.map((sec, i) => (
                        <div key={i} className="border-l-2 pl-4" style={{ borderColor: ACCENT }}>
                          <h5 className="text-base font-semibold text-neutral-100 mb-2">
                            {sec.title}
                          </h5>
                          {sec.content && (
                            <p className="text-base text-neutral-200 mb-2">{sec.content}</p>
                          )}
                          {sec.subsections?.map((sub, j) => (
                            <div key={j} className="mb-3">
                              <h6 className="text-sm font-semibold text-neutral-200 mb-1">
                                {sub.title}
                              </h6>
                              {sub.content && (
                                <p className="text-base text-neutral-200 mb-1">{sub.content}</p>
                              )}
                              {sub.points && sub.points.length > 0 && (
                                <ul className="text-base text-neutral-200 space-y-0.5">
                                  {sub.points.map((point, k) => (
                                    <li key={k}>{point}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {project.technologies && project.technologies.length > 0 && (
                <section>
                  <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-neutral-400 mb-2">
                    Tech
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 border text-sm font-mono text-neutral-300"
                        style={{ borderColor: "#404040" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
