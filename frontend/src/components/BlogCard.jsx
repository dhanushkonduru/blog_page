import { Link } from "react-router-dom";

export default function BlogCard({ blog }) {
  return (
    <article className="border-b border-gray-200 py-6">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {new Date(blog.createdAt).toLocaleDateString()}
      </div>
      <Link
        to={`/blog/${blog.slug}`}
        className="mt-2 block text-2xl font-semibold text-gray-900 hover:text-gray-700"
      >
        {blog.title}
      </Link>
      <p className="mt-3 text-gray-700">{blog.excerpt}</p>
    </article>
  );
}
