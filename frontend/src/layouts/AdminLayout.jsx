import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import { clearToken } from "../utils/auth.js";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white px-6 py-10 md:flex">
          <Link to="/admin" className="text-lg font-semibold text-gray-900">
            Admin Panel
          </Link>
          <nav className="mt-10 space-y-2 text-sm">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              Blog List
            </NavLink>
            <NavLink
              to="/admin/new"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              Create New
            </NavLink>
            <button
              onClick={handleLogout}
              className="w-full rounded-lg px-3 py-2 text-left font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Logout
            </button>
          </nav>
          <Link
            to="/"
            className="mt-auto text-xs font-semibold uppercase tracking-wide text-gray-400 transition hover:text-gray-600"
          >
            View Site
          </Link>
        </aside>
        <main className="flex-1 px-6 py-10 md:px-10">
          <div className="md:hidden">
            <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <Link to="/admin" className="text-sm font-semibold">
                Admin Panel
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
