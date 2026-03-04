import { useState } from "react";

export default function AdminNodeModal({
  node,
  accentColor = "#c41a1a",
  onSave,
  onCancel,
}) {
  const [draft, setDraft] = useState(node);
  const [rawJson, setRawJson] = useState(
    JSON.stringify(node ?? {}, null, 2),
  );
  const [jsonError, setJsonError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateField = (field, value) => {
    setDraft((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const updateProjectField = (field, value) => {
    setDraft((prev) => ({
      ...(prev || {}),
      project: {
        ...(prev?.project || {}),
        [field]: value,
      },
    }));
  };

  const parseList = (value) =>
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(rawJson);
      setDraft(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError(err?.message || "Invalid JSON");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft?.id) return;
    onSave?.(draft);
  };

  const handleImagesChange = (updater) => {
    setDraft((prev) => {
      const current = prev || {};
      const nextImages = updater(current.images || []);
      return {
        ...current,
        images: nextImages,
      };
    });
  };

  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0 || !draft?.id) return;
    setIsUploading(true);
    setUploadError(null);
    const nodeId = draft.id;

    const toUpload = Array.from(files);

    const newImages = [];

    for (const file of toUpload) {
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/dev-upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId,
            dataUrl,
            originalName: file.name,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok || !data.src) {
          throw new Error(data.error || `Upload failed with ${res.status}`);
        }
        newImages.push({
          src: data.src,
          alt: file.name,
          caption: "",
        });
      } catch (err) {
        // Record the first error but keep attempting other files.
        if (!uploadError) {
          setUploadError(err?.message || "Failed to upload one or more images.");
        }
      }
    }

    if (newImages.length) {
      handleImagesChange((existing) => [...existing, ...newImages]);
    }

    setIsUploading(false);
  };

  const type = draft?.type || "project";
  const project = draft?.project || {};
  const images = draft?.images || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
      onClick={onCancel}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col border border-neutral-800 bg-neutral-950 text-neutral-50"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.16em] text-neutral-500">
              Edit timeline entry
            </div>
            <h2 className="text-base font-semibold text-neutral-50">
              {draft?.title || draft?.project?.title || draft?.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.16em] border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-neutral-50"
          >
            Close
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 divide-y divide-neutral-900 md:grid-cols-2 md:divide-y-0 md:divide-x md:divide-neutral-900"
          >
            <section className="flex flex-col gap-3 px-4 py-3 text-xs">
            <div className="font-mono uppercase tracking-[0.16em] text-neutral-400">
              Basics
            </div>
            <label className="block">
              <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                ID
              </div>
              <input
                type="text"
                value={draft?.id || ""}
                onChange={(e) => updateField("id", e.target.value)}
                className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block">
              <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Type
              </div>
              <select
                value={type}
                onChange={(e) => updateField("type", e.target.value)}
                className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
              >
                <option value="project">project</option>
                <option value="career">career</option>
                <option value="education">education</option>
                <option value="trip">trip</option>
                <option value="life_event">life_event</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Year
                </div>
                <input
                  type="number"
                  value={draft?.year ?? ""}
                  onChange={(e) =>
                    updateField("year", Number(e.target.value) || 0)
                  }
                  className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
                />
              </label>
              <label className="block">
                <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Date label
                </div>
                <input
                  type="text"
                  value={draft?.dateLabel || ""}
                  onChange={(e) => updateField("dateLabel", e.target.value)}
                  className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <label className="block">
              <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Title
              </div>
              <input
                type="text"
                value={draft?.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block">
              <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Summary
              </div>
              <textarea
                value={draft?.summary || ""}
                onChange={(e) => updateField("summary", e.target.value)}
                rows={3}
                className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block">
              <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Location / organization (optional)
              </div>
              <input
                type="text"
                value={draft?.location || draft?.organization || ""}
                onChange={(e) => updateField("location", e.target.value)}
                className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block">
              <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Tags (comma-separated)
              </div>
              <input
                type="text"
                value={(draft?.tags || []).join(", ")}
                onChange={(e) => updateField("tags", parseList(e.target.value))}
                className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
              />
            </label>

            <label className="block">
              <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                Bullets (one per line)
              </div>
              <textarea
                value={(draft?.bullets || []).join("\n")}
                onChange={(e) =>
                  updateField(
                    "bullets",
                    e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                rows={5}
                placeholder="One bullet per line"
                className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Shown on career and education entries. Empty lines are ignored.
              </p>
            </label>

            {type === "project" && (
              <>
                <div className="mt-2 font-mono uppercase tracking-[0.16em] text-neutral-400">
                  Project card
                </div>
                <label className="block">
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    Project ID
                  </div>
                  <input
                    type="text"
                    value={project.id || ""}
                    onChange={(e) => updateProjectField("id", e.target.value)}
                    className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    Project title
                  </div>
                  <input
                    type="text"
                    value={project.title || ""}
                    onChange={(e) =>
                      updateProjectField("title", e.target.value)
                    }
                    className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    Short description
                  </div>
                  <textarea
                    value={project.shortDescription || ""}
                    onChange={(e) =>
                      updateProjectField("shortDescription", e.target.value)
                    }
                    rows={3}
                    className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                    Project tags (comma-separated)
                  </div>
                  <input
                    type="text"
                    value={(project.tags || []).join(", ")}
                    onChange={(e) =>
                      updateProjectField("tags", parseList(e.target.value))
                    }
                    className="w-full border border-neutral-700 bg-black px-2 py-1.5 text-xs text-neutral-50 focus:outline-none focus:border-emerald-500"
                  />
                </label>
              </>
            )}
          </section>

          <section className="flex flex-col gap-3 border-t border-neutral-900 bg-black/70 px-4 py-3 text-xs md:border-t-0">
            <div className="mb-1 font-mono uppercase tracking-[0.16em] text-neutral-400">
              Images
            </div>
            <p className="text-[11px] text-neutral-500">
              Upload screenshots or photos for this timeline entry. They will be
              stored under <code>public/timeline/{draft?.id || "id"}</code> and
              appear on the right side of the card.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-neutral-700 px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-300 hover:border-neutral-500 hover:text-neutral-50">
                <span>{isUploading ? "Uploading…" : "Add images"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length) {
                      void handleFilesSelected(files);
                    }
                  }}
                  disabled={isUploading}
                />
              </label>
              {images.length > 0 && (
                <span className="text-[11px] text-neutral-500">
                  {images.length} image{images.length === 1 ? "" : "s"} attached
                </span>
              )}
            </div>
            {uploadError && (
              <div className="rounded border border-[#c41a1a] bg-[#1b0b0b] px-2 py-1 text-[11px] text-[#fecaca]">
                {uploadError}
              </div>
            )}
            {images.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-neutral-800 bg-black/60 p-2">
                <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-x-hidden">
                  {images.map((img, idx) => (
                    <div
                      key={img.src || idx}
                      className="flex items-center gap-2 rounded border border-neutral-800 bg-neutral-950/60 p-1"
                    >
                      {img.src && (
                        <img
                          src={img.src}
                          alt={img.alt || ""}
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-[11px] text-neutral-300">
                          {img.src}
                        </div>
                        <input
                          type="text"
                          value={img.alt || ""}
                          onChange={(e) =>
                            handleImagesChange((current) => {
                              const next = [...current];
                              next[idx] = {
                                ...(next[idx] || {}),
                                alt: e.target.value,
                              };
                              return next;
                            })
                          }
                          placeholder="Alt text"
                          className="mt-1 w-full border border-neutral-700 bg-black px-2 py-0.5 text-[11px] text-neutral-50 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleImagesChange((current) =>
                            current.filter((_, i) => i !== idx),
                          )
                        }
                        className="shrink-0 px-2 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-[#fecaca] hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-2 font-mono uppercase tracking-[0.16em] text-neutral-400">
              Advanced JSON
            </div>
            <p className="mb-2 text-[11px] text-neutral-500">
              Edit the full node JSON for precise control (including overview,
              architectureSections, impact, etc.). Paste valid JSON and click
              &quot;Apply JSON&quot; to sync the form.
            </p>
            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="mb-2 h-64 w-full flex-1 border border-neutral-800 bg-black px-2 py-1.5 font-mono text-[11px] text-neutral-100 focus:outline-none"
              style={{ borderColor: accentColor }}
            />
            {jsonError && (
              <div className="mb-2 rounded border border-[#c41a1a] bg-[#1b0b0b] px-2 py-1 text-[11px] text-[#fecaca]">
                {jsonError}
              </div>
            )}
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutral-900 pt-2">
              <button
                type="button"
                onClick={handleApplyJson}
                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.16em] border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-neutral-50"
              >
                Apply JSON
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.16em] border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.16em] border text-neutral-100"
                  style={{ borderColor: accentColor }}
                >
                  Save entry
                </button>
              </div>
            </div>
          </section>
          </form>
        </div>
      </div>
    </div>
  );
}

