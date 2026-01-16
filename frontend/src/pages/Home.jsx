import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import BlogCard from "../components/BlogCard.jsx";
import Loader from "../components/Loader.jsx";
import Pagination from "../components/Pagination.jsx";

export default function Home() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    api
      .get(`/blogs?page=${page}&limit=6`)
      .then((res) => {
        if (!isMounted) return;
        setBlogs(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1 });
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Unable to load blogs.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page]);

  const handlePageChange = (nextPage) => {
    setSearchParams({ page: String(nextPage) });
  };

  return (
    <section>
      <h1 className="text-3xl font-semibold">Latest Posts</h1>
      <p className="mt-2 text-gray-600">
        A minimal, typography-first blog experience.
      </p>

      <div className="mt-8">
        {loading && <Loader />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading &&
          !error &&
          blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)}
      </div>

      <Pagination
        page={pagination.page || 1}
        totalPages={pagination.totalPages || 1}
        onPageChange={handlePageChange}
      />
    </section>
  );
}
