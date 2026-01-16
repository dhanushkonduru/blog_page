import Blog from "../models/Blog.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPublishedBlogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(parseInt(req.query.limit || "6", 10), 20);
  const skip = (page - 1) * limit;

  const [blogs, total] = await Promise.all([
    Blog.find({ status: "Published" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title slug excerpt coverImageUrl createdAt"),
    Blog.countDocuments({ status: "Published" })
  ]);

  res.json({
    data: blogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, status: "Published" });
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }
  res.json(blog);
});
