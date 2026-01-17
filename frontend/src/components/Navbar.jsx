import { Link } from "react-router-dom";

const resources = [
  { label: "Blog", href: "/" },
  { label: "Guides", href: "/?resource=guides" },
  { label: "Case Studies", href: "/?resource=case-studies" },
  { label: "Videos", href: "/?resource=videos" },
  { label: "Reports", href: "/?resource=reports" }
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="text-lg font-semibold text-gray-900">
          Lumina Blog
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          <Link to="/" className="transition hover:text-gray-900">
            Home
          </Link>
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 transition hover:text-gray-900"
            >
              Resources
              <span className="text-xs">▾</span>
            </button>
            <div className="pointer-events-none absolute right-0 mt-3 w-48 rounded-xl border border-gray-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:pointer-events-auto group-hover:opacity-100">
              {resources.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <Link to="/admin/login" className="transition hover:text-gray-900">
            Admin
          </Link>
        </nav>
        <Link
          to="/admin/login"
          className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:border-gray-400 hover:text-gray-900 md:hidden"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
