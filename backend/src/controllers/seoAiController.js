import axios from "axios";

export const generateSeoContent = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ message: "Input is required" });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemini-3-flash-preview", // valid from your list
        max_tokens: 800, // 🔥 VERY IMPORTANT (prevents 402)
        messages: [
          {
            role: "system",
            content:
              "You are an SEO assistant. Generate an SEO title, meta description, and keyword list.",
          },
          {
            role: "user",
            content: input,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "SEO AI Blog Generator",
        },
      }
    );

    // ✅ SAFELY extract content
    const aiText =
      response.data?.choices?.[0]?.message?.content || "";

    return res.json({
      success: true,
      data: aiText,
    });
  } catch (error) {
    console.error("SEO AI ERROR:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "AI generation failed",
      error: error.response?.data || error.message,
    });
  }
};
