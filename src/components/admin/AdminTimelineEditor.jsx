import { useState } from "react";
import AdminNodeModal from "../AdminNodeModal.jsx";

const ACCENT = "#c41a1a";

export default function AdminTimelineEditor({ timeline, onChange }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const list = Array.isArray(timeline) ? timeline : [];

  const handleEdit = (node) => {
    setSelectedNode(node);
  };

  const handleDelete = (id) => {
    if (!Array.isArray(timeline)) return;
    const next = timeline.filter((n) => n.id !== id);
    onChange(next);
  };

  const handleDuplicate = (id) => {
    if (!Array.isArray(timeline)) return;
    const idx = timeline.findIndex((n) => n.id === id);
    if (idx === -1) return;
    const original = timeline[idx];
    const copy = {
      ...original,
      id: `${original.id}-copy`,
      title: `${original.title || ""} (copy)`,
    };
    const next = [...timeline];
    next.splice(idx + 1, 0, copy);
    onChange(next);
  };

  const handleMove = (id, direction) => {
    if (!Array.isArray(timeline)) return;
    const idx = timeline.findIndex((n) => n.id === id);
    if (idx === -1) return;
    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= timeline.length) return;
    const next = [...timeline];
    [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
    onChange(next);
  };

  const handleNew = () => {
    const baseYear =
      (Array.isArray(timeline) && timeline[0] && timeline[0].year) || 2026;
    const year = typeof baseYear === "number" ? baseYear : 2026;
    const candidateId = `new-${Date.now()}`;
    const node = {
      id: candidateId,
      type: "project",
      year,
      dateLabel: String(year),
      title: "New Project",
      summary: "",
      project: {
        id: `project-${candidateId}`,
        title: "New Project",
        subtitle: "",
        shortDescription: "",
        color: "blue",
        hasDetails: true,
        links: [],
        tags: [],
        highlights: [],
      },
    };
    setSelectedNode(node);
  };

  const handleModalSave = (updatedNode) => {
    const base = Array.isArray(timeline) ? timeline : [];
    const exists = base.some((n) => n.id === updatedNode.id);
    let next;
    if (exists) {
      next = base.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    } else {
      next = [...base, updatedNode];
    }
    onChange(next);
    setSelectedNode(null);
  };

  const handleModalCancel = () => {
    setSelectedNode(null);
  };

  return (
    <div className="text-sm text-neutral-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-neutral-50">
            Timeline & projects
          </h2>
          <p className="text-xs text-neutral-500">
            Edit and reorder timeline entries. Order here is the order on the site.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNew}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.14em] border border-neutral-700 hover:border-[#c41a1a] hover:text-[#c41a1a]"
        >
          New entry
        </button>
      </div>

      <div className="max-h-[70vh] overflow-auto border border-neutral-900">
        {list.length === 0 ? (
          <div className="px-4 py-6 text-xs text-neutral-500">
            No timeline entries yet. Create one to get started.
          </div>
        ) : (
          <div className="divide-y divide-neutral-900">
            {list.map((node, index) => (
              <div
                key={node.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-900/60"
              >
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(node.id, "up")}
                    disabled={index === 0}
                    className="rounded border border-neutral-700 p-1 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(node.id, "down")}
                    disabled={index === list.length - 1}
                    className="rounded border border-neutral-700 p-1 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </div>
                <div className="w-20 shrink-0 text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500">
                  {node.year ?? "—"}
                </div>
                <div className="w-24 shrink-0 text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500">
                  {node.type}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-neutral-100 truncate">
                    {node.title || node.project?.title || node.id}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {node.dateLabel} · {node.project?.id || node.id}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(node)}
                    className="px-2 py-1 text-[11px] font-mono uppercase tracking-[0.14em] border border-neutral-700 text-neutral-300 hover:border-[#c41a1a] hover:text-[#c41a1a]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(node.id)}
                    className="px-2 py-1 text-[11px] font-mono uppercase tracking-[0.14em] border border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(node.id)}
                    className="px-2 py-1 text-[11px] font-mono uppercase tracking-[0.14em] border border-neutral-800 text-[#fecaca] hover:border-[#c41a1a] hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedNode && (
        <AdminNodeModal
          node={selectedNode}
          accentColor={ACCENT}
          onCancel={handleModalCancel}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}

