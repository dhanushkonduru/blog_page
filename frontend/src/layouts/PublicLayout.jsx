import { Link, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-6 py-12">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-gray-900">Lumina Blog</p>
            <p>Premium minimal publishing for modern teams.</p>
          </div>
          <div className="flex items-center gap-6 text-xs uppercase tracking-wide text-gray-500">
            <Link to="/" className="transition hover:text-gray-900">
              Privacy
            </Link>
            <Link to="/" className="transition hover:text-gray-900">
              Terms
            </Link>
            <Link to="/" className="transition hover:text-gray-900">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
