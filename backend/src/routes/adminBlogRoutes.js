import express from "express";
import { body } from "express-validator";
import { generateSeoIdeas } from "../controllers/seoController.js";

import {
  listBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog
} from "../controllers/adminBlogController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

const blogRules = [
  body("title").notEmpty().withMessage("Title required"),
  body("content").notEmpty().withMessage("Content required"),
  body("category").notEmpty().withMessage("Category required"),
  body("author").notEmpty().withMessage("Author required"),
  body("status").optional().isIn(["Published", "Draft"]).withMessage("Invalid status"),
  body("coverImage").notEmpty().withMessage("Cover image required"),
  body("coverImage").isURL().withMessage("Cover image must be a URL"),
  body("excerpt").optional().isLength({ max: 200 }).withMessage("Excerpt too long")
];

router.use(protect);

router.get("/", listBlogs);
router.get("/:id", getBlog);
router.post("/", blogRules, validate, createBlog);
router.put("/:id", blogRules, validate, updateBlog);
router.delete("/:id", deleteBlog);
router.post("/ai/seo", generateSeoIdeas);


export default router;
