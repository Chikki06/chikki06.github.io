import { lazy, Suspense, useEffect } from "react";
import AdminApp from "./components/admin/AdminApp.jsx";
import FaceStudio from "./components/FaceStudio.jsx";
import Portfolio from "./components/Portfolio.jsx";
import SiteNav from "./components/SiteNav.jsx";
import { useClientNav, usePathname } from "./lib/navigate.js";

const ScrollStory = lazy(() => import("./components/ScrollStory.jsx"));
const ResearchPage = lazy(() => import("./components/ResearchPage.jsx"));

function DisabledRouteNotice({ title, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-neutral-200">
      <div className="px-4 text-center text-sm">
        <p className="font-mono uppercase tracking-[0.16em] text-neutral-500">{title}</p>
        <p className="mt-2 text-neutral-300">{children}</p>
      </div>
    </div>
  );
}

function RouteFallback({ label = "Loading…" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-mono text-xs uppercase tracking-[0.16em] text-neutral-400">
      {label}
    </div>
  );
}

function isPublicContentPath(path) {
  if (path.startsWith("/admin") || path.startsWith("/faces")) return false;
  return (
    path === "/" ||
    path === "/r" ||
    path.startsWith("/r/") ||
    path === "/3" ||
    path.startsWith("/3/")
  );
}

export default function App() {
  const path = usePathname();
  useClientNav();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  if (path.startsWith("/admin")) {
    if (import.meta.env.DEV) return <AdminApp />;
    return (
      <DisabledRouteNotice title="Admin disabled in production">
        The `/admin` editor only runs locally via <code>npm run dev</code> so you can update JSON
        content and push changes to GitHub Pages.
      </DisabledRouteNotice>
    );
  }

  if (path.startsWith("/faces")) {
    if (import.meta.env.DEV) return <FaceStudio />;
    return (
      <DisabledRouteNotice title="Face studio disabled in production">
        Open <code>/faces</code> while running <code>npm run dev</code> to edit and bake story card
        faces.
      </DisabledRouteNotice>
    );
  }

  const showSiteNav = isPublicContentPath(path);

  let page = <Portfolio mode="page" prefetchStoryAssets />;
  if (path === "/r" || path.startsWith("/r/")) {
    page = (
      <Suspense fallback={<RouteFallback label="Loading research…" />}>
        <ResearchPage />
      </Suspense>
    );
  } else if (path === "/3" || path.startsWith("/3/")) {
    page = (
      <Suspense fallback={<RouteFallback label="Loading 3D scene…" />}>
        <ScrollStory />
      </Suspense>
    );
  }

  return (
    <>
      {showSiteNav ? <SiteNav /> : null}
      {page}
    </>
  );
}
