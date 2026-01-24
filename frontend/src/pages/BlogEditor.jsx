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
const [seoResults, setSeoResults] = useState([]);
const [showSeoModal, setShowSeoModal] = useState(false);
const [seoLoading, setSeoLoading] = useState(false);
const [seoContentLoadingIndex, setSeoContentLoadingIndex] = useState(null);
const [seoError, setSeoError] = useState("");
const [regeneratingContent, setRegeneratingContent] = useState(false);
const [generatingContent, setGeneratingContent] = useState(false);
// New SEO state
const [seoTitles, setSeoTitles] = useState([]);
const [seoMetaDescriptions, setSeoMetaDescriptions] = useState([]);
const [seoSlug, setSeoSlug] = useState("");
const [seoKeyphrases, setSeoKeyphrases] = useState({ primary: "", secondary: [] });
const [seoSerpInsights, setSeoSerpInsights] = useState(null);
const [seoMode, setSeoMode] = useState("all"); 
// "title" | "meta" | "keyphrase" | "all"

  // WordPress-style slug generation
  function generateSlug(text) {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    api
      .get(`/admin/blogs/${id}`)
      .then((res) => {
        if (!isMounted) return;
        const title = res.data.title || "";
        setForm({
          title,
          content: res.data.content || "",
          excerpt: res.data.excerpt || "",
          coverImage: res.data.coverImage || "",
          category: res.data.category || "",
          author: res.data.author || "",
          status: res.data.status || "Draft"
        });
        // Initialize slug from existing blog or generate from title
        setSeoSlug(res.data.slug || generateSlug(title));
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
    
    // Auto-generate slug when title changes
    if (name === "title") {
      setSeoSlug(generateSlug(value));
    }
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


  // Auto-generate SEO if missing
  const autoGenerateSeoFromTitle = async (title) => {
    if (!title || !title.trim()) return null;

    try {
      const res = await api.post("/admin/blogs/ai/titles", {
        input: title
      });

      if (res.data.success && res.data.titles && res.data.metaDescriptions) {
        return {
          metaDescription: res.data.metaDescriptions[0] || null,
          keyphrases: res.data.keyphrases || null,
          slug: res.data.slug || null
        };
      }
    } catch (err) {
      console.error("Auto-SEO generation failed:", err);
      // Don't throw - this is optional
    }
    return null;
  };

  const saveBlog = async (statusOverride) => {
  setError("");

  // 🚫 STOP if required fields are missing
  if (!validateForm()) return;

  setSaving(true);

  try {
    let updatedExcerpt = form.excerpt;
    let updatedSlug = seoSlug || generateSlug(form.title);
    let updatedKeyphrases = seoKeyphrases;

    // Auto-generate SEO if meta description or keyphrases are missing
    if (!form.excerpt || !seoKeyphrases?.primary) {
      const seoData = await autoGenerateSeoFromTitle(form.title);
      if (seoData) {
        if (seoData.metaDescription && !form.excerpt) {
  updatedExcerpt = seoData.metaDescription;
  setForm((prev) => ({
    ...prev,
    excerpt: seoData.metaDescription
  }));
}

        if (seoData.slug) {
          updatedSlug = seoData.slug;
          setSeoSlug(seoData.slug);
        }
        if (seoData.keyphrases) {
          updatedKeyphrases = seoData.keyphrases;
          setSeoKeyphrases(seoData.keyphrases);
        }
      }
    }

    const payload = {
  ...form,
  excerpt: updatedExcerpt,
  status: statusOverride || form.status,
  slug: updatedSlug,

  // ✅ SEO fields (mapped to backend schema)
  primaryKeyphrase: updatedKeyphrases?.primary || "",
  secondaryKeyphrases: updatedKeyphrases?.secondary || []
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

  } catch (err) {
    console.error("Save Blog Error:", err);
    if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
      const errorMessages = err.response.data.errors.map(e => `${e.field}: ${e.message}`).join(", ");
      setError(`Validation error: ${errorMessages}`);
    } else {
      setError(err.response?.data?.message || "Unable to save blog. Please try again.");
    }
  } finally {
    setSaving(false);
  }
};


  const handleSubmit = (event) => {
    event.preventDefault();
    saveBlog();
  };


/* 🔽 ADD THIS FUNCTION HERE 🔽 */
const handleGenerateSeo = async (regenerate = false) => {
  if (!seoInput.trim()) return;

  setSeoLoading(true);
  setSeoError("");

  try {
    const res = await api.post("/admin/blogs/ai/titles", {
      input: regenerate
        ? `${seoInput}\n\nGenerate more creative and higher CTR titles.`
        : seoInput
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Invalid response from server");
    }

    // Handle new response format
    if (res.data.titles && res.data.metaDescriptions) {
      setSeoTitles(res.data.titles);
      setSeoMetaDescriptions(res.data.metaDescriptions);
      setSeoSlug(res.data.slug || "");
      setSeoKeyphrases(res.data.keyphrases || { primary: "", secondary: [] });
      setSeoSerpInsights(res.data.serpInsights || null);
      // Also set legacy format for backward compatibility
      setSeoResults(res.data.data || []);
    } else if (Array.isArray(res.data.data)) {
      // Fallback to old format
      setSeoResults(res.data.data);
    } else {
      throw new Error("Invalid response format from server");
    }
  } catch (err) {
    console.error("SEO Generation Error:", err);
    const errorMsg = err.response?.data?.message || err.message || "Unable to generate SEO titles. Please try again.";
    setSeoError(errorMsg);
  } finally {
    setSeoLoading(false);
  }
};

// Handler for selecting a title
const handleSelectTitle = (title) => {
  setForm((prev) => ({ ...prev, title }));
  setSeoSlug(generateSlug(title));
};

// Handler for selecting a meta description
const handleSelectMetaDescription = (metaDescription) => {
  setForm((prev) => ({ ...prev, excerpt: metaDescription }));
};

const handleGenerateContent = async (item, index) => {
  if (!item?.title || !Array.isArray(item?.keywords)) return;

  setSeoContentLoadingIndex(index);
  setSeoError("");

  try {
    const res = await api.post("/admin/blogs/ai/content", {
  title: item.title,
  keywords: item.keywords,
  originalInput: seoInput,
  force: true
});



    const payload = res.data?.data;
    if (payload?.title && payload?.excerpt && payload?.content) {
      setForm((prev) => ({
        ...prev,
        title: payload.title,
        excerpt: payload.excerpt,
        content: payload.content
      }));
      setSeoSlug(generateSlug(payload.title));
      setShowSeoModal(false);
    }
  } catch (err) {
    console.error("Content Generation Error:", err);
    const errorMsg = err.response?.data?.message || err.message || "Unable to generate blog content. Please try again.";
    setSeoError(errorMsg);
  } finally {
    setSeoContentLoadingIndex(null);
  }
};

const handleGenerateContentFromTitle = async () => {
  if (!form.title.trim()) {
    setError("Please enter a title first.");
    return;
  }

  setGeneratingContent(true);
  setError("");

  try {
    // ✅ Use SEO keyphrases if available, else fallback to title
    const keywords = seoKeyphrases?.primary
      ? [seoKeyphrases.primary, ...(seoKeyphrases.secondary || [])]
      : [form.title];

    const res = await api.post("/admin/blogs/ai/content", {
      title: form.title,
      keywords,
      originalInput: form.title,
    });

    const payload = res.data?.data;

    if (payload?.content) {
      setForm((prev) => ({
        ...prev,
        content: payload.content,
        excerpt: payload.excerpt || prev.excerpt,
      }));
    }
  } catch (err) {
    console.error("Content Generation Error:", err);
    setError(
      err.response?.data?.message ||
        err.message ||
        "Unable to generate content. Please try again."
    );
  } finally {
    setGeneratingContent(false);
  }
};


const handleRegenerateContentDirectly = async () => {
  if (!form.title.trim()) {
    setError("Please enter a title first.");
    return;
  }

  setRegeneratingContent(true);
  setError("");

  try {
    // First, get SEO keywords for the current title
    const titlesRes = await api.post("/admin/blogs/ai/titles", {
      input: form.title
    });

    if (!titlesRes.data.success || !Array.isArray(titlesRes.data.data) || titlesRes.data.data.length === 0) {
      throw new Error("Unable to generate SEO keywords for the title.");
    }

    // Use the first result's keywords but keep the existing title
    const firstResult = titlesRes.data.data[0];
    
    // Generate content using the EXISTING title (not the new one) and keywords
    const contentRes = await api.post("/admin/blogs/ai/content", {
      title: form.title, // Use the existing title, not firstResult.title
      keywords: firstResult.keywords,
      originalInput: form.title
    });

    const payload = contentRes.data?.data;
    if (payload?.excerpt && payload?.content) {
      setForm((prev) => ({
        ...prev,
        // Keep the existing title, only update excerpt and content
        excerpt: payload.excerpt,
        content: payload.content
      }));
      setSuccessMessage("Content regenerated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  } catch (err) {
    console.error("Direct Content Generation Error:", err);
    const errorMsg = err.response?.data?.message || err.message || "Unable to regenerate content. Please try again.";
    setError(errorMsg);
  } finally {
    setRegeneratingContent(false);
  }
};

  const isPublished = form.status === "Published";

  if (loading) return <Loader />;

  return (
    <section>
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-semibold text-gray-900">
    {id ? "Edit Blog" : "New Blog"}
  </h1>

  

</div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
    Basic Information
  </p>
        <div className="space-y-1">
  {/* Label row */}
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-gray-700">
      Title
    </label>

    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        setSeoMode("title");
        setShowSeoModal(true);
      }}
    >
      Generate SEO Title
    </Button>
  </div>

  {/* Input */}
  <input
    type="text"
    name="title"
    value={form.title}
    onChange={handleChange}
    required
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>


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

        <div className="space-y-1">
  {/* Label row */}
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium text-gray-700">
      Meta Description
    </label>

    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        setSeoMode("meta");
        setShowSeoModal(true);
      }}
    >
      Generate Meta Description
    </Button>
  </div>

  {/* Textarea */}
  <textarea
    name="excerpt"
    rows="3"
    value={form.excerpt}
    onChange={handleChange}
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />

  <p className="text-xs text-gray-500">
    Keep it under 160 characters for best results.
  </p>
</div>

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

        {/* SEO Fields */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            SEO Information
          </p>
          
          {/* Keyphrases */}
          {(seoKeyphrases.primary || seoKeyphrases.secondary?.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Keyphrase
                </label>
                <input
                  type="text"
                  value={seoKeyphrases.primary}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Keyphrases
                </label>
                <input
                  type="text"
                  value={seoKeyphrases.secondary?.join(", ") || ""}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* SEO Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SEO Slug
            </label>
            <input
              type="text"
              value={seoSlug || generateSlug(form.title)}
              onChange={(e) => setSeoSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              placeholder="Auto-generated from title"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL-friendly slug (auto-generated from title)
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {/* Label row */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Content (Markdown)
            </label>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleGenerateContentFromTitle}
              disabled={generatingContent || !form.title.trim()}
            >
              {generatingContent ? "Generating..." : "Generate Content"}
            </Button>
          </div>

          {/* Textarea */}
          <textarea
            name="content"
            rows="12"
            value={form.content}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm min-h-[240px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRegenerateContentDirectly}
            disabled={regeneratingContent || !form.title.trim()}
          >
            {regeneratingContent ? "Generating..." : "Regenerate Content"}
          </Button>
        </div>

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
      <h3 className="text-lg font-semibold">
  {seoMode === "title" && "Generate SEO Titles"}
  {seoMode === "meta" && "Generate Meta Descriptions"}
  {seoMode === "keyphrase" && "Generate Keyphrases"}
  {seoMode === "all" && "AI SEO Generator"}
</h3>


      <Input
        label="Idea ?"
        value={seoInput}
        onChange={(e) => setSeoInput(e.target.value)}
        placeholder="e.g. product onboarding"
      />

      <div className="flex gap-2">
        <Button onClick={() => handleGenerateSeo()} disabled={seoLoading}>
          {seoLoading ? "Generating..." : "Generate"}
        </Button>

        {seoResults.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => handleGenerateSeo(true)}
          >
            Regenerate
          </Button>
        )}

        <Button
  variant="ghost"
  onClick={() => {
    setShowSeoModal(false);
    setSeoMode("all");
  }}
>
  Close
</Button>

      </div>

      {seoError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {seoError}
        </div>
      )}

      {(seoTitles.length > 0 || seoResults.length > 0) && (
        <div className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Titles Selection */}
          {seoTitles.length > 0 && (seoMode === "title" || seoMode === "all") && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium mb-3 text-sm">Select Title</p>
              <div className="space-y-2">
                {seoTitles.map((title, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectTitle(title)}
                    className="w-full text-left rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <p className="text-sm font-medium text-gray-900">{title}</p>
                    <p className="text-xs text-gray-500 mt-1">{title.length} characters</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Meta Descriptions Selection */}
          {seoMetaDescriptions.length > 0 && (seoMode === "meta" || seoMode === "all") && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium mb-3 text-sm">Select Meta Description</p>
              <div className="space-y-2">
                {seoMetaDescriptions.map((desc, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectMetaDescription(desc)}
                    className="w-full text-left rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <p className="text-sm text-gray-900">{desc}</p>
                    <p className="text-xs text-gray-500 mt-1">{desc.length} / 160 characters</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyphrases Display */}
          {(seoKeyphrases.primary || seoKeyphrases.secondary?.length > 0) &&
 (seoMode === "keyphrase" || seoMode === "all") && (

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium mb-3 text-sm">Keyphrases</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Primary</p>
                  <input
                    type="text"
                    value={seoKeyphrases.primary}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                {seoKeyphrases.secondary?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Secondary</p>
                    <input
                      type="text"
                      value={seoKeyphrases.secondary.join(", ")}
                      readOnly
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEO Slug */}
          {seoSlug && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium mb-2 text-sm">SEO Slug</p>
              <input
                type="text"
                value={seoSlug}
                onChange={(e) => setSeoSlug(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder="seo-friendly-url-slug"
              />
            </div>
          )}

          {/* SERP Insights */}
          {seoSerpInsights && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium mb-2 text-sm">SERP Insights</p>
              <p className="text-xs text-gray-700 mb-2">{seoSerpInsights.contentAngle}</p>
              {seoSerpInsights.recommendedSections?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Recommended Sections:</p>
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                    {seoSerpInsights.recommendedSections.map((section, index) => (
                      <li key={index}>{section}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Legacy format support - for backward compatibility */}
          {seoResults.length > 0 && seoTitles.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium mb-2">AI Generated SEO</p>
              <div className="space-y-4">
                {seoResults.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-xl border bg-white p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Option {index + 1}
                    </p>
                    <p className="text-base font-medium text-gray-900">{item.title}</p>
                    {Array.isArray(item.keywords) && item.keywords.length > 0 && (
                      <p className="mt-2 text-xs text-gray-600">
                        Keywords: {item.keywords.join(", ")}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          handleSelectTitle(item.title);
                          if (Array.isArray(item.keywords)) {
                            setSeoKeyphrases({
                              primary: item.keywords[0] || "",
                              secondary: item.keywords.slice(1) || []
                            });
                          }
                        }}
                      >
                        Use This
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleGenerateContent(item, index)}
                        disabled={seoContentLoadingIndex !== null}
                      >
                        {seoContentLoadingIndex === index ? "Generating..." : "Generate Content"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  </div>
)}

    </section>
  );
}
