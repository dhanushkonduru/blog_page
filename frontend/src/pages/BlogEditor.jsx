import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Loader from "../components/Loader.jsx";

const emptyForm = {
  title: "",
  content: "",
  excerpt: "",
  coverImageUrl: "",
  status: "Draft"
};

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    api
      .get(`/admin/blogs/${id}`)
      .then((res) => {
        if (!isMounted) return;
        setForm({
          title: res.data.title || "",
          content: res.data.content || "",
          excerpt: res.data.excerpt || "",
          coverImageUrl: res.data.coverImageUrl || "",
          status: res.data.status || "Draft"
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load blog.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (id) {
        await api.put(`/admin/blogs/${id}`, form);
      } else {
        await api.post("/admin/blogs", form);
      }
      navigate("/admin");
    } catch (err) {
      setError("Unable to save blog.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <section>
      <h1 className="text-2xl font-semibold">{id ? "Edit Blog" : "New Blog"}</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="text-sm text-gray-700">Title</label>
          <input
            name="title"
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-700">Content (Markdown)</label>
          <textarea
            name="content"
            rows="10"
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
            value={form.content}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-700">
            Excerpt (optional, 150 chars default)
          </label>
          <textarea
            name="excerpt"
            rows="3"
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
            value={form.excerpt}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="text-sm text-gray-700">Cover Image URL</label>
          <input
            name="coverImageUrl"
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
            value={form.coverImageUrl}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="text-sm text-gray-700">Status</label>
          <select
            name="status"
            className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
            value={form.status}
            onChange={handleChange}
          >
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit">{saving ? "Saving..." : "Save"}</Button>
          <Button
            type="button"
            className="border-gray-300 text-gray-700 hover:border-gray-900"
            onClick={() => navigate("/admin")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
