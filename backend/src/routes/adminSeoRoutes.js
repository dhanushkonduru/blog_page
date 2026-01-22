import express from "express";
import { generateSeoTitles, generateBlogContent } from "../controllers/seoAiController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Protect all SEO routes
router.use(protect);

router.post("/blogs/ai/titles", generateSeoTitles);
router.post("/blogs/ai/content", generateBlogContent);

export default router;
