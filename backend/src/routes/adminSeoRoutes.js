import express from "express";
import { generateSeoTitles, generateMetaDescriptions, generateBlogContent } from "../controllers/seoAiController.js";
import { serpAnalysis, calculateScore } from "../controllers/seoController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Protect all SEO routes
router.use(protect);

router.post("/blogs/ai/titles", generateSeoTitles);
router.post("/blogs/ai/meta", generateMetaDescriptions);
router.post("/blogs/ai/content", generateBlogContent);
router.post("/seo/serp-analysis", serpAnalysis);
router.post("/seo/score", calculateScore);

export default router;
