import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import BlogCard from "../components/BlogCard.jsx";
import Tag from "../components/Tag.jsx";
import AuthorCard from "../components/AuthorCard.jsx";

export default function Blog() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [related, setRelated] = useState([]);

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

  useEffect(() => {
    if (!blog) return;
    const query = new URLSearchParams();
    query.set("limit", "3");
    query.set("exclude", blog.slug);
    if (blog.category) query.set("category", blog.category);

    api
      .get(`/blogs?${query.toString()}`)
      .then((res) => setRelated(res.data.data || []))
      .catch(() => setRelated([]));
  }, [blog]);

  if (loading) return <Loader />;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!blog) return null;

  return (
    <article className="page-fade">
      <div className="flex flex-wrap gap-2">
        <Tag label={blog.category} />
      </div>
      <p className="mt-4 text-sm text-gray-500">
        {new Date(blog.createdAt).toLocaleDateString()}
      </p>
      <h1 className="mt-3 text-4xl font-semibold text-gray-900 md:text-5xl">
        {blog.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-gray-600">{blog.excerpt}</p>

      <div className="relative left-1/2 right-1/2 mt-10 w-screen -translate-x-1/2">
        <img
          src={blog.coverImage}
          alt={blog.title}
          className="h-[320px] w-full object-cover md:h-[420px]"
          loading="lazy"
        />
      </div>

      <div className="mx-auto mt-10 max-w-[700px]">
        <div className="prose prose-gray">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {blog.content}
          </ReactMarkdown>
        </div>

        <div className="mt-12">
          <AuthorCard name={blog.author} subtitle="Author" />
        </div>
      </div>

      <section className="mt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Related posts</h2>
          <Link to="/" className="text-sm font-semibold text-blue-600">
            View all
          </Link>
        </div>
        {related.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            More stories are coming soon.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <BlogCard key={item._id} blog={item} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
