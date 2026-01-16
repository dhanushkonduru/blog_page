import { Link, Outlet, useNavigate } from "react-router-dom";
import Button from "../components/Button.jsx";
import { clearToken } from "../utils/auth.js";

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <Link to="/admin" className="text-lg font-semibold">
            Admin Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
              View Site
            </Link>
            <Button onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
