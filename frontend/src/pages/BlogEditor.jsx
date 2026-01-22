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
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
const [successMessage, setSuccessMessage] = useState("");
const [seoInput, setSeoInput] = useState("");
const [seoData, setSeoData] = useState(null);
const [showSeoModal, setShowSeoModal] = useState(false);
const [seoLoading, setSeoLoading] = useState(false);



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
  const validateForm = () => {
  if (
    !form.title.trim() ||
    !form.category.trim() ||
    !form.author.trim() ||
    !form.coverImage.trim() ||
    !form.excerpt.trim() ||
    !form.content.trim()
  ) {
    setError("Please fill out all required fields before saving.");
    return false;
  }
  return true;
};


  const saveBlog = async (statusOverride) => {
  setError("");

  // 🚫 STOP if required fields are missing
  if (!validateForm()) return;

  setSaving(true);

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

    setSuccessMessage(
  statusOverride === "Published"
    ? "Blog published successfully."
    : "Draft saved successfully."
);

setTimeout(() => {
  navigate("/admin");
}, 1200);

  } catch {
    setError("Unable to save blog. Please try again.");
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

/* 🔽 ADD THIS FUNCTION HERE 🔽 */
const handleGenerateSeo = async (regenerate = false) => {
  if (!seoInput.trim()) return;

  setSeoLoading(true);

  try {
    const res = await api.post("/admin/blogs/ai/seo", {
      input: seoInput,
      regenerateHint: regenerate
        ? "Generate more creative and higher CTR titles"
        : ""
    });

    setSeoData(res.data.data);
  } catch (err) {
    console.error(err);
  } finally {
    setSeoLoading(false);
  }
};

const parseSeoText = (text) => {
  const titleMatch = text.match(/SEO Title.*?\n"(.*?)"/s);
  const metaMatch = text.match(/Meta Description.*?\n(.*)/s);

  return {
    title: titleMatch ? titleMatch[1] : "",
    meta: metaMatch ? metaMatch[1].split("\n")[0] : "",
    raw: text
  };
};

  const isPublished = form.status === "Published";

  if (loading) return <Loader />;

  return (
    <section>
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-semibold text-gray-900">
    {id ? "Edit Blog" : "New Blog"}
  </h1>

  <Button
    size="sm"
    variant="secondary"
    onClick={() => setShowSeoModal(true)}
  >
    Generate SEO (AI)
  </Button>
</div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
    Basic Information
  </p>
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
          </div>
          <Input
            label="Cover Image URL"
            name="coverImage"
            placeholder="https://images.unsplash.com/..."
            value={form.coverImage}
            onChange={handleChange}
            required
          />
          {form.coverImage && (
  <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
    <img
      src={form.coverImage}
      alt="Cover preview"
      className="h-48 w-full object-cover"
      onError={(e) => (e.currentTarget.style.display = "none")}
    />
  </div>
)}

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
        <p
  className={`text-xs ${
    form.excerpt.length > 160
      ? "text-red-600"
      : form.excerpt.length > 140
      ? "text-yellow-600"
      : "text-gray-500"
  }`}
>
  {form.excerpt.length} / 160 characters
</p>

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

        {error && (
  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    {error}
  </div>
)}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => saveBlog("Draft")}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
  type="button"
  onClick={() => setShowPublishConfirm(true)}
  disabled={saving}
>
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
      {showPublishConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-gray-900">
        Publish this blog?
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        This blog will be visible to all readers.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="ghost"
          onClick={() => setShowPublishConfirm(false)}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            setShowPublishConfirm(false);
            saveBlog("Published");
          }}
        >
          Publish
        </Button>
      </div>
    </div>
  </div>
)}
{successMessage && (
  <div className="fixed bottom-6 right-6 z-50">
    <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-medium text-green-700 shadow-md">
      {successMessage}
    </div>
  </div>
)}
{showSeoModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 space-y-4">
      <h3 className="text-lg font-semibold">AI SEO Generator</h3>

      <Input
        label="Keyword / Idea / Rough Title"
        value={seoInput}
        onChange={(e) => setSeoInput(e.target.value)}
        placeholder="e.g. product onboarding"
      />

      <div className="flex gap-2">
        <Button onClick={() => handleGenerateSeo()} disabled={seoLoading}>
          {seoLoading ? "Generating..." : "Generate"}
        </Button>

        {seoData && (
          <Button
            variant="secondary"
            onClick={() => handleGenerateSeo(true)}
          >
            Regenerate
          </Button>
        )}

        <Button variant="ghost" onClick={() => setShowSeoModal(false)}>
          Close
        </Button>
      </div>

      {seoData && (
  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
    <p className="font-medium mb-2">AI Generated SEO</p>

    {seoData && (() => {
  const parsed = parseSeoText(seoData);

  return (
    <div className="space-y-5">

      {/* SEO TITLE */}
      {parsed.title && (
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Suggested SEO Title
          </p>
          <div
            className="cursor-pointer rounded-lg border px-3 py-2 hover:bg-gray-50"
            onClick={() => {
              setForm((prev) => ({ ...prev, title: parsed.title }));
              setShowSeoModal(false);
            }}
          >
            {parsed.title}
          </div>
        </div>
      )}

      {/* META DESCRIPTION */}
      {parsed.meta && (
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Meta Description
          </p>
          <p className="text-sm text-gray-600">
            {parsed.meta}
          </p>
        </div>
      )}

      {/* RAW DETAILS (COLLAPSIBLE) */}
      <details className="rounded-xl border bg-gray-50 p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          View full AI analysis
        </summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs text-gray-700">
          {parsed.raw}
        </pre>
      </details>

    </div>
  );
})()}


    <div className="mt-3 flex justify-end">
      <Button
        size="sm"
        onClick={() => {
          // Optional: auto-fill title from first line
          const firstLine = seoData.split("\n")[0];
          setForm((prev) => ({
            ...prev,
            title: firstLine.replace("SEO Title:", "").trim()
          }));
          setShowSeoModal(false);
        }}
      >
        Use Title
      </Button>
    </div>
  </div>
)}

    </div>
  </div>
)}

    </section>
  );
}
