import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("🔑 GEMINI_API_KEY =", process.env.GEMINI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro"
    });

    const result = await model.generateContent("Say hello in one word");
    console.log("✅ SUCCESS:", result.response.text());
  } catch (err) {
    console.error("❌ ERROR:", err);
  }
}

test();
