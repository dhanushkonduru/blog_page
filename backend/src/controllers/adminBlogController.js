import slugify from "slugify";
import Blog from "../models/Blog.js";
import { sanitizeText, sanitizeUrl } from "../utils/sanitize.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const buildExcerpt = (content, excerpt) => {
  if (excerpt && excerpt.trim()) return excerpt.trim();
  return (content || "").slice(0, 150);
};

export const listBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
});

export const getBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }
  res.json(blog);
});

export const createBlog = asyncHandler(async (req, res) => {
  const title = sanitizeText(req.body.title);
  const content = req.body.content || "";
  const excerpt = sanitizeText(buildExcerpt(content, req.body.excerpt));
  const coverImage = sanitizeUrl(req.body.coverImage || "");
  const category = sanitizeText(req.body.category || "");
  const author = sanitizeText(req.body.author || "");
  const status = req.body.status || "Draft";

  const blog = await Blog.create({
    title,
    content,
    excerpt,
    coverImage,
    category,
    author,
    status,
    slug: slugify(title, { lower: true, strict: true })
  });

  res.status(201).json(blog);
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const title = sanitizeText(req.body.title ?? blog.title);
  const content = req.body.content ?? blog.content;
  const excerpt = sanitizeText(buildExcerpt(content, req.body.excerpt ?? blog.excerpt));
  const coverImage = sanitizeUrl(req.body.coverImage ?? blog.coverImage);
  const category = sanitizeText(req.body.category ?? blog.category);
  const author = sanitizeText(req.body.author ?? blog.author);
  const status = req.body.status ?? blog.status;

  blog.title = title;
  blog.content = content;
  blog.excerpt = excerpt;
  blog.coverImage = coverImage;
  blog.category = category;
  blog.author = author;
  blog.status = status;
  blog.slug = slugify(title, { lower: true, strict: true });

  await blog.save();
  res.json(blog);
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }
  await blog.deleteOne();
  res.json({ message: "Blog deleted" });
});
