import { useCallback, useEffect, useState } from "react";
import AdminTimelineEditor from "./AdminTimelineEditor.jsx";
import AdminSiteEditor from "./AdminSiteEditor.jsx";

const ACCENT = "#c41a1a";
const BG = "#050505";
const FG = "#f5f5f5";

function AdminShell({ children, isSaving, lastSavedAt, onSave }) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: BG, color: FG, fontFamily: "system-ui, sans-serif" }}
    >
      <header className="border-b border-neutral-900 px-4 py-3 md:px-8 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-50">
            Admin · Portfolio Content
          </h1>
          <p className="text-xs text-neutral-400">
            Edit timeline, projects, hero, and socials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSavedAt && (
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-neutral-500">
              Saved {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm font-mono uppercase tracking-[0.14em] border border-neutral-700 bg-neutral-950/80 hover:border-[#c41a1a] hover:text-[#c41a1a] disabled:opacity-60 disabled:cursor-default"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function AdminApp() {
  const [activeTab, setActiveTab] = useState("timeline");
  const [content, setContent] = useState(null);
  const [draftContent, setDraftContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const loadAdminContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev-content");

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Failed with status ${res.status}`);
      }

      const next = {
        timeline: Array.isArray(data.timeline) ? data.timeline : [],
        site: data.site && typeof data.site === "object" ? data.site : {},
      };

      setContent(next);
      setDraftContent(next);
    } catch (err) {
      setError(err?.message || "Failed to load admin content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminContent();
  }, [loadAdminContent]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!content || !draftContent) return;
      if (JSON.stringify(content) === JSON.stringify(draftContent)) return;
      e.preventDefault();
      // Some browsers require returnValue to be set.
      // eslint-disable-next-line no-param-reassign
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [content, draftContent]);

  const handleSave = useCallback(async () => {
    if (!draftContent) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/dev-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftContent),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Save failed with status ${res.status}`);
      }
      const next = {
        timeline: Array.isArray(data.timeline) ? data.timeline : [],
        site: data.site && typeof data.site === "object" ? data.site : {},
      };
      setContent(next);
      setDraftContent(next);
      setLastSavedAt(new Date());
    } catch (err) {
      setError(err?.message || "Failed to save content.");
    } finally {
      setIsSaving(false);
    }
  }, [draftContent]);

  if (loading || !draftContent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-sm text-neutral-300"
        style={{ backgroundColor: BG }}
      >
        Loading admin content…
      </div>
    );
  }

  const isDirty =
    content && draftContent
      ? JSON.stringify(content) !== JSON.stringify(draftContent)
      : false;

  return (
    <AdminShell
      isSaving={isSaving}
      lastSavedAt={lastSavedAt}
      onSave={handleSave}
    >
      <main className="mx-auto flex max-w-6xl gap-6 px-4 py-6 md:px-8">
        <aside className="w-48 shrink-0">
          <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.18em] text-neutral-500">
            Panels
          </div>
          <nav className="space-y-1 text-sm">
            {[
              { id: "timeline", label: "Timeline & Projects" },
              { id: "site", label: "Hero & Contact" },
            ].map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-between border-l-2 px-2 py-1.5 text-left font-mono uppercase tracking-[0.14em] text-xs ${
                    active
                      ? "text-[#c41a1a]"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                  style={{
                    borderColor: active ? ACCENT : "#262626",
                  }}
                >
                  <span>{tab.label}</span>
                  {active && isDirty && (
                    <span className="ml-2 text-[9px] text-amber-300">
                      unsaved
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1 border border-neutral-900 bg-neutral-950/60 p-4">
          {error && (
            <div className="mb-3 rounded border border-[#c41a1a] bg-[#1b0b0b] px-3 py-2 text-xs text-[#fecaca]">
              {error}
            </div>
          )}
          {activeTab === "timeline" && (
            <AdminTimelineEditor
              timeline={draftContent.timeline}
              onChange={(nextTimeline) =>
                setDraftContent((prev) =>
                  prev ? { ...prev, timeline: nextTimeline } : prev,
                )
              }
            />
          )}
          {activeTab === "site" && (
            <AdminSiteEditor
              site={draftContent.site}
              onChange={(nextSite) =>
                setDraftContent((prev) =>
                  prev ? { ...prev, site: nextSite } : prev,
                )
              }
            />
          )}
        </section>
      </main>
    </AdminShell>
  );
}

