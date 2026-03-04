import Portfolio from "./components/Portfolio.jsx";
import AdminApp from "./components/admin/AdminApp.jsx";

export default function App() {
  const path = window.location.pathname;

  if (path.startsWith("/admin")) {
    if (import.meta.env.DEV) {
      return <AdminApp />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-neutral-200">
        <div className="px-4 text-center text-sm">
          <p className="font-mono uppercase tracking-[0.16em] text-neutral-500">
            Admin disabled in production
          </p>
          <p className="mt-2 text-neutral-300">
            The `/admin` editor only runs locally via <code>npm run dev</code> so
            you can update JSON content and push changes to GitHub Pages.
          </p>
        </div>
      </div>
    );
  }

  return <Portfolio />;
}
