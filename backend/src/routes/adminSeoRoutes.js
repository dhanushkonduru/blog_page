import express from "express";
import { generateSeoTitles, generateBlogContent } from "../controllers/seoAiController.js";

const router = express.Router();

router.post("/blogs/ai/titles", generateSeoTitles);
router.post("/blogs/ai/content", generateBlogContent);

export default router;
