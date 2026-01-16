import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";

export default function Blog() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    api
      .get(`/blogs/${slug}`)
      .then((res) => {
        if (!isMounted) return;
        setBlog(res.data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Blog not found.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) return <Loader />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!blog) return null;

  return (
    <article className="mx-auto max-w-3xl">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {new Date(blog.createdAt).toLocaleDateString()}
      </div>
      <h1 className="mt-3 text-3xl font-semibold">{blog.title}</h1>
      {blog.coverImageUrl && (
        <img
          src={blog.coverImageUrl}
          alt={blog.title}
          className="mt-6 w-full rounded-sm border border-gray-200"
          loading="lazy"
          onError={(e) => {
            console.error("Image failed to load:", blog.coverImageUrl);
            e.target.style.display = "none";
          }}
          onLoad={() => {
            console.log("Image loaded successfully");
          }}
        />
      )}
      <div className="prose mt-8 text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
          {blog.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
