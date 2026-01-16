import { Link, Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <Link to="/" className="text-xl font-semibold">
            Minimal Blog
          </Link>
          <Link
            to="/admin/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Admin
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200">
        <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-gray-500">
          Minimal Blog Platform
        </div>
      </footer>
    </div>
  );
}
