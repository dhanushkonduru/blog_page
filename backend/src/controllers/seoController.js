import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateSeoIdeas = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || !input.trim()) {
      return res.status(400).json({ error: "Input is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview"
    });

    const prompt = `
You are an SEO expert.

Generate:
1. 5 SEO-friendly blog titles
2. 1 primary keyword
3. 5 secondary keywords

Topic: "${input}"

Return ONLY valid JSON in this format:
{
  "titles": [],
  "primary": "",
  "secondary": []
}
`;

    const result = await model.generateContent(prompt);

    if (!result?.response?.text) {
      throw new Error("Empty response from Gemini");
    }

    const text = result.response.text();
    const json = JSON.parse(text);

    res.json({
      titles: json.titles,
      keywords: {
        primary: json.primary,
        secondary: json.secondary
      }
    });

  } catch (err) {
    console.error("SEO ERROR:", err.message);
    res.status(500).json({
      error: "SEO generation failed",
      details: err.message
    });
  }
};
