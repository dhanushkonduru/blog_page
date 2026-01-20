import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Loader from "../components/Loader.jsx";

export default function AdminDashboard() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("all");
const [dateFilter, setDateFilter] = useState("");
const [categoryFilter, setCategoryFilter] = useState("all");

  const loadBlogs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/blogs");
      setBlogs(res.data || []);
    } catch (err) {
      setError("Unable to load blogs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleDelete = async () => {
  if (!deleteId) return;
  setDeleting(true);

  try {
    await api.delete(`/admin/blogs/${deleteId}`);
    setBlogs((prev) => prev.filter((b) => b._id !== deleteId));
    showToast("Blog deleted successfully");
  } catch {
    showToast("Failed to delete blog", "error");
  } finally {
    setDeleting(false);
    setDeleteId(null);
  }
};
const [toast, setToast] = useState(null);

const showToast = (message, type = "success") => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
};


  return (
    <section>
    {toast && (
  <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm shadow-lg
    ${toast.type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : "bg-green-50 text-green-700 border border-green-200"}`}>
    {toast.message}
  </div>
)}
      <div className="flex flex-wrap items-center justify-between gap-4">

  {/* LEFT: Search + Filters + Reset */}
  <div className="flex flex-wrap items-center gap-3">

    {/* Search */}
    <input
      type="text"
      placeholder="Search blogs..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="h-10 w-56 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-300 focus:outline-none"
    />

    {/* Status */}
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
    >
      <option value="all">All Status</option>
      <option value="Published">Published</option>
      <option value="Draft">Draft</option>
    </select>
    {/* Category */}
<select
  value={categoryFilter}
  onChange={(e) => setCategoryFilter(e.target.value)}
  className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
>
  <option value="all">All Categories</option>

  {/* Dynamic categories */}
  {[...new Set(blogs.map(b => b.category).filter(Boolean))].map(cat => (
    <option key={cat} value={cat}>
      {cat}
    </option>
  ))}
</select>


    {/* Date */}
    <input
      type="date"
      value={dateFilter}
      onChange={(e) => setDateFilter(e.target.value)}
      className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-700 focus:border-gray-300 focus:outline-none"
    />

    {/* Reset (subtle) */}

      <button
  onClick={() => {
  setSearch("");
  setStatusFilter("all");
  setDateFilter("");
  setCategoryFilter("all");
}}

  className="
    h-10
    rounded-lg
    border border-gray-200
    px-4
    text-sm
    text-gray-700
    transition
    hover:border-gray-300
    hover:bg-gray-50
    hover:text-gray-900
  "
>
  Reset
</button>


  </div>

  {/* RIGHT: Create */}
  <Link to="/admin/new">
    <Button>Create New</Button>
  </Link>

</div>



      <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading && <div className="p-6"><Loader /></div>}
        {error && <p className="p-6 text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs
  .filter((blog) => {
  const searchText = search.toLowerCase();

  const matchesSearch =
    blog.title.toLowerCase().includes(searchText) ||
    blog.category?.toLowerCase().includes(searchText);

  const matchesStatus =
    statusFilter === "all" || blog.status === statusFilter;

  const matchesDate =
    !dateFilter ||
    new Date(blog.createdAt).toISOString().split("T")[0] === dateFilter;

  const matchesCategory =
    categoryFilter === "all" || blog.category === categoryFilter;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesDate &&
    matchesCategory
  );
})

  .map((blog) => (

                <tr key={blog._id} className="border-b border-gray-100">
                  <td className="px-6 py-5">
  <div className="font-medium text-gray-900">
    {blog.title}
  </div>

  {blog.category && (
    <div className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
      {blog.category}
    </div>
  )}
</td>

                  <td className="px-6 py-5 text-gray-600">{blog.status}</td>
                  <td className="px-6 py-5 text-gray-600">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">

  {/* VIEW */}
  <Link
    to={`/blog/${blog.slug}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
    title="View"
  >
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  </Link>

  {/* EDIT */}
  <Link
    to={`/admin/edit/${blog._id}`}
    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
    title="Edit"
  >
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z" />
    </svg>
  </Link>

  {/* DELETE */}
  <button
    onClick={() => setDeleteId(blog._id)}
    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-red-600 transition hover:border-red-200 hover:text-red-700"
    title="Delete"
  >
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  </button>

</div>

                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                    No blogs yet. Create your first post.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {deleteId && (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-gray-900">
        Delete blog?
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        This action cannot be undone.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setDeleteId(null)}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
)}

    </section>
  );
}
