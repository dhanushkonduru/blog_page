import express from "express";
import { generateSeoContent } from "../controllers/seoAiController.js";

const router = express.Router();

router.post("/blogs/ai/seo", generateSeoContent);

export default router;
