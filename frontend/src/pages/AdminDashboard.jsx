import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Loader from "../components/Loader.jsx";

export default function AdminDashboard() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this blog?");
    if (!confirmed) return;
    try {
      await api.delete(`/admin/blogs/${id}`);
      setBlogs((prev) => prev.filter((blog) => blog._id !== id));
    } catch (err) {
      setError("Unable to delete blog.");
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blogs</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage published and draft posts.
          </p>
        </div>
        <Link to="/admin/new">
          <Button>Create New</Button>
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto">
        {loading && <Loader />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="py-3">Title</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id} className="border-b border-gray-100">
                  <td className="py-4 font-medium">{blog.title}</td>
                  <td>{blog.status}</td>
                  <td>{new Date(blog.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/admin/edit/${blog._id}`}
                        className="text-gray-700 hover:text-gray-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(blog._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-6 text-gray-500">
                    No blogs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
