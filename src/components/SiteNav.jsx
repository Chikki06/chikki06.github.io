import { usePathname, navigate } from "../lib/navigate.js";

const LINKS = [
  { href: "/", label: "Portfolio" },
  { href: "/r", label: "Research" },
  { href: "/3", label: "3D" },
];

function resolveActive(pathname) {
  if (pathname === "/3" || pathname.startsWith("/3/")) return "/3";
  if (pathname === "/r" || pathname.startsWith("/r/")) return "/r";
  return "/";
}

/**
 * Fixed top-right site nav shared by Portfolio, Research, and 3D.
 * Red underline marks the active route.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const active = resolveActive(pathname);

  return (
    <nav
      className="pointer-events-auto fixed right-4 top-4 z-[70] flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] md:right-8 md:top-5"
      aria-label="Site sections"
    >
      {LINKS.map((link) => {
        const isActive = active === link.href;
        return (
          <a
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              navigate(link.href);
            }}
            className={`border-b transition-colors hover:border-[#FF0000] hover:text-white ${
              isActive ? "border-[#FF0000] text-white" : "border-transparent text-white/70"
            }`}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
