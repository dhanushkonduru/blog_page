import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios.js";
import Button from "../components/Button.jsx";
import Loader from "../components/Loader.jsx";
import Input from "../components/Input.jsx";

const emptyForm = {
  title: "",
  content: "",
  excerpt: "",
  coverImage: "",
  category: "",
  author: "",
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
          coverImage: res.data.coverImage || "",
          category: res.data.category || "",
          author: res.data.author || "",
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

  const saveBlog = async (statusOverride) => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        status: statusOverride || form.status
      };
      if (id) {
        await api.put(`/admin/blogs/${id}`, payload);
      } else {
        await api.post("/admin/blogs", payload);
      }
      navigate("/admin");
    } catch (err) {
      setError("Unable to save blog.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    saveBlog();
  };

  const handleAutoExcerpt = () => {
    setForm((prev) => ({
      ...prev,
      excerpt: (prev.content || "").slice(0, 160)
    }));
  };

  const isPublished = form.status === "Published";

  if (loading) return <Loader />;

  return (
    <section>
      <h1 className="text-2xl font-semibold text-gray-900">
        {id ? "Edit Blog" : "New Blog"}
      </h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Category"
            name="category"
            list="category-options"
            placeholder="Design, Product, Engineering..."
            value={form.category}
            onChange={handleChange}
            required
          />
          <Input
            label="Author"
            name="author"
            placeholder="Author name"
            value={form.author}
            onChange={handleChange}
            required
          />
          <Input
            label="Cover Image URL"
            name="coverImage"
            placeholder="https://images.unsplash.com/..."
            value={form.coverImage}
            onChange={handleChange}
            required
          />
        </div>
        <datalist id="category-options">
          <option value="Design" />
          <option value="Product" />
          <option value="Engineering" />
          <option value="Business" />
          <option value="Marketing" />
          <option value="Research" />
        </datalist>

        <Input
          label="Excerpt"
          name="excerpt"
          as="textarea"
          rows="3"
          value={form.excerpt}
          onChange={handleChange}
          helper="Keep it under 160 characters for best results."
        />
        <Button type="button" variant="secondary" size="sm" onClick={handleAutoExcerpt}>
          Auto-generate excerpt
        </Button>

        <Input
          label="Content (Markdown)"
          name="content"
          as="textarea"
          rows="12"
          className="min-h-[240px]"
          value={form.content}
          onChange={handleChange}
          required
        />

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Status</p>
            <p className="text-xs text-gray-500">
              {isPublished ? "Visible to readers" : "Saved as draft"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                status: prev.status === "Published" ? "Draft" : "Published"
              }))
            }
            className={`relative h-7 w-12 rounded-full transition ${
              isPublished ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                isPublished ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => saveBlog("Draft")}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="button" onClick={() => saveBlog("Published")} disabled={saving}>
            Publish
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/admin")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
