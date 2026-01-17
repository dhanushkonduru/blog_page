import express from "express";
import {
  getPublishedBlogs,
  getBlogBySlug,
  getBlogCategories
} from "../controllers/blogController.js";

const router = express.Router();

router.get("/", getPublishedBlogs);
router.get("/categories", getBlogCategories);
router.get("/:slug", getBlogBySlug);

export default router;
