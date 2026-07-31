import { ExternalLink, Github } from "lucide-react";

const ACCENT = "#FF0000";

function GitlabIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 21.42l3.66-11.27H8.34L12 21.42zm0 0L4.84 10.15 2.3 17.97a.76.76 0 00.27.85L12 21.42zm0 0l7.16-10.27 2.54 7.82a.76.76 0 01-.27.85L12 21.42zM4.84 10.15l2.37-7.3a.38.38 0 01.72 0l1.41 4.35H4.84zm14.32 0h-4.5l1.41-4.35a.38.38 0 01.72 0l2.37 7.35z" />
    </svg>
  );
}

function hostOf(url) {
  try {
    return new URL(url, typeof window !== "undefined" ? window.location.origin : "https://example.com")
      .hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Normalize repo / external link display from JSON labels + URL. */
export function resolveLinkPresentation(link) {
  const url = String(link?.url || "");
  const host = hostOf(url);
  const raw = String(link?.label || "").toLowerCase();
  const isRepoLabel =
    raw === "repo" ||
    raw === "github" ||
    raw === "gitlab" ||
    raw === "repository" ||
    raw === "project repository" ||
    raw.includes("github repository");

  if (host.includes("github.com") || raw === "github") {
    return { label: "Repo", Icon: Github, kind: "github" };
  }
  if (host.includes("gitlab") || raw === "gitlab" || (isRepoLabel && url.toLowerCase().includes("gitlab"))) {
    return { label: "Repo", Icon: GitlabIcon, kind: "gitlab" };
  }
  if (isRepoLabel) {
    return { label: "Repo", Icon: Github, kind: "github" };
  }
  return { label: link?.label || "Open", Icon: ExternalLink, kind: "external" };
}

/**
 * Outbound chip used on timeline cards and modals.
 * Hover styles live in classes (not inline borderColor) so they actually apply.
 */
export default function OutboundLink({
  link,
  className = "",
  compact = false,
  onClick,
}) {
  if (!link?.url) return null;
  const { label, Icon } = resolveLinkPresentation(link);
  const pad = compact ? "px-2 py-1 text-sm" : "px-3 py-2 text-sm";

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border border-neutral-700 font-mono transition-colors hover:border-[#FF0000] hover:bg-[#FF0000]/10 hover:text-[#FF0000] ${pad} ${className}`}
      style={{ color: ACCENT }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </a>
  );
}
