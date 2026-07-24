import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import HoverDemoVideo, { collectProjectVideos } from "./HoverDemoVideo.jsx";

const ACCENT = "#FF0000";
const BG = "#0a0a0a";
const FG = "#ffffff";

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
  const videos = collectProjectVideos(project);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden border border-neutral-800 text-white"
        style={{ backgroundColor: BG, color: FG }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-neutral-800 px-5 py-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{project.title}</h2>
            {project.subtitle && <p className="mt-1 text-base text-white">{project.subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border border-neutral-600 p-2 text-white transition-colors hover:border-[#FF0000] hover:text-[#FF0000]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="sticky top-[72px] z-10 flex items-center gap-3 border-b border-neutral-800 bg-[#0a0a0a] px-5 py-2">
          <span className="text-sm text-white">Brief</span>
          <button
            type="button"
            onClick={() => setIsTldr(!isTldr)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-sm border transition-colors ${
              isTldr ? "border-[#FF0000] bg-[#FF0000]" : "border-neutral-600 bg-transparent"
            }`}
            aria-pressed={isTldr}
          >
            <span
              className={`inline-block h-4 w-4 transform bg-white transition-transform ${
                isTldr ? "ml-0.5 translate-x-1" : "translate-x-6"
              }`}
            />
          </button>
          <span className="text-sm text-white">Detailed</span>
        </div>

        <div className="portfolio-scroll max-h-[calc(90vh-140px)] overflow-y-auto px-5 py-5">
          {videos.length > 0 && (
            <section className="mb-6 grid gap-3 sm:grid-cols-2">
              {videos.slice(0, 2).map((video) => (
                <HoverDemoVideo key={video.url} url={video.url} title={video.title} />
              ))}
            </section>
          )}

          {project.links?.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {project.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border px-3 py-2 text-base transition-colors"
                  style={{ borderColor: ACCENT, color: ACCENT }}
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {isTldr ? (
            <>
              <section className="mb-6">
                <p className="max-w-2xl text-lg leading-relaxed text-white">
                  {typeof shortSummary === "string" ? shortSummary : ""}
                </p>
              </section>
              {highlights.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-2 font-mono text-sm uppercase tracking-[0.14em] text-white">At a glance</h3>
                  <p className="text-base leading-relaxed text-white">{highlights.join(" ")}</p>
                </section>
              )}
              {project.impact?.achievements?.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-2 font-mono text-sm uppercase tracking-[0.14em] text-white">Results</h3>
                  <p className="text-base leading-relaxed text-white">{project.impact.achievements.join(" ")}</p>
                </section>
              )}
              {project.technologies?.length > 0 && (
                <section>
                  <h3 className="mb-2 font-mono text-sm uppercase tracking-[0.14em] text-white">Tech</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="border px-2 py-1 font-mono text-sm text-white"
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
            <>
              <section className="mb-6">
                <h3 className="mb-2 font-mono text-sm uppercase tracking-[0.14em] text-white">Overview</h3>
                <div className="text-base leading-relaxed text-white">
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

              {project.impact?.achievements?.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-2 font-mono text-sm uppercase tracking-[0.14em] text-white">Results</h3>
                  <ul className="space-y-1.5 text-base text-white">
                    {project.impact.achievements.map((a, i) => (
                      <li key={i} className="flex gap-2">
                        <span style={{ color: ACCENT }}>—</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {project.timeline?.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 font-mono text-sm uppercase tracking-[0.14em] text-white">Phases</h3>
                  <div className="space-y-4">
                    {project.timeline.map((phase, idx) => (
                      <div key={idx} className="border border-neutral-800 p-4">
                        <h4 className="mb-2 text-base font-semibold text-white">{phase.title}</h4>
                        {phase.description && <p className="mb-3 text-base text-white">{phase.description}</p>}
                        {phase.videoUrl && (
                          <div className="mb-3 max-w-md">
                            <HoverDemoVideo url={phase.videoUrl} title={phase.title} />
                          </div>
                        )}
                        {phase.features?.length > 0 && (
                          <ul className="space-y-1 text-base text-white">
                            {phase.features.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        )}
                        {phase.technologies?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {phase.technologies.map((t, i) => (
                              <span
                                key={i}
                                className="border px-2 py-0.5 font-mono text-sm text-white"
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

              {project.architectureSections?.length > 0 && (
                <section className="mb-6">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === "arch" ? null : "arch")}
                    className="flex w-full items-center justify-between border-b border-neutral-800 py-2 font-mono text-base uppercase tracking-[0.14em] text-white hover:text-white"
                  >
                    <span>Architecture & design</span>
                    <span>{openSection === "arch" ? "−" : "+"}</span>
                  </button>
                  {openSection === "arch" && (
                    <div className="space-y-4 pt-4">
                      {project.architectureSections.map((sec, i) => (
                        <div key={i} className="border-l-2 pl-4" style={{ borderColor: ACCENT }}>
                          <h5 className="mb-2 text-base font-semibold text-white">{sec.title}</h5>
                          {sec.content && <p className="mb-2 text-base text-white">{sec.content}</p>}
                          {sec.subsections?.map((sub, j) => (
                            <div key={j} className="mb-3">
                              <h6 className="mb-1 text-sm font-semibold text-white">{sub.title}</h6>
                              {sub.content && <p className="mb-1 text-base text-white">{sub.content}</p>}
                              {sub.points?.length > 0 && (
                                <ul className="space-y-0.5 text-base text-white">
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

              {project.technologies?.length > 0 && (
                <section>
                  <h3 className="mb-2 font-mono text-sm uppercase tracking-[0.14em] text-white">Tech</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((t, i) => (
                      <span
                        key={i}
                        className="border px-2 py-1 font-mono text-sm text-white"
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
