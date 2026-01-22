import axios from "axios";

export const generateSeoTitles = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({ message: "Input is required" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not set in environment variables");
      return res.status(500).json({
        success: false,
        message: "API key not configured. Please set OPENROUTER_API_KEY in .env file.",
      });
    }

    const systemPrompt = `You are an expert SEO strategist and professional content writer.

TASK: Generate EXACTLY 5 SEO-optimized blog titles from the input.

RULES:
- Each title MUST be under 60 characters
- Each title MUST be clear, specific, and search-intent focused
- Avoid clickbait and vague wording
- For EACH title, generate 5-7 high-intent SEO keywords:
  - 1 primary keyword
  - 2-3 secondary keywords
  - 1-2 long-tail keywords
- Keywords must be semantically related and realistic for SEO analysis tools

OUTPUT FORMAT (JSON only, no explanation):
[
  {
    "title": "...",
    "keywords": ["primary keyword", "secondary 1", "secondary 2", "secondary 3", "long-tail 1", "long-tail 2"]
  },
  {
    "title": "...",
    "keywords": ["primary keyword", "secondary 1", "secondary 2", "secondary 3", "long-tail 1", "long-tail 2"]
  },
  {
    "title": "...",
    "keywords": ["primary keyword", "secondary 1", "secondary 2", "secondary 3", "long-tail 1", "long-tail 2"]
  },
  {
    "title": "...",
    "keywords": ["primary keyword", "secondary 1", "secondary 2", "secondary 3", "long-tail 1", "long-tail 2"]
  },
  {
    "title": "...",
    "keywords": ["primary keyword", "secondary 1", "secondary 2", "secondary 3", "long-tail 1", "long-tail 2"]
  }
]

Return ONLY valid JSON array, no markdown, no code blocks, no explanations.`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemma-3-27b-it",
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: systemPrompt,
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

    const aiText = response.data?.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = aiText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }
    
    const titles = JSON.parse(jsonText);

    return res.json({
      success: true,
      data: titles,
    });
  } catch (error) {
    console.error("SEO Titles ERROR:", error.response?.data || error.message);
    console.error("Full error:", JSON.stringify(error.response?.data, null, 2));

    // Handle OpenRouter API errors
    let errorMessage = "AI generation failed";
    let errorDetails = error.message;

    if (error.response?.data) {
      const errorData = error.response.data;
      
      // OpenRouter error format
      if (errorData.error) {
        errorMessage = errorData.error.message || errorData.error.type || "Provider returned error";
        errorDetails = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
      code: error.response?.data?.error?.code || error.response?.status,
    });
  }
};

export const generateBlogContent = async (req, res) => {
  try {
    const { title, keywords, originalInput } = req.body;

    if (!title || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ 
        message: "Title and keywords array are required" 
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not set in environment variables");
      return res.status(500).json({
        success: false,
        message: "API key not configured. Please set OPENROUTER_API_KEY in .env file.",
      });
    }

    const primaryKeyword = keywords[0];
    const secondaryKeywords = keywords.slice(1, 4).join(", ");
    const longTailKeywords = keywords.slice(4).join(", ");

    const systemPrompt = `You are an expert SEO strategist and professional content writer.

TASK: Generate complete blog content based on the selected title.

STRICT REQUIREMENTS:
1. Excerpt: 150-160 characters, SEO-optimized, no emojis, no fluff
2. Full blog content in Markdown:
   - Minimum 900 words
   - Clear H1, H2, H3 hierarchy
   - First paragraph MUST include the primary keyword naturally
   - Use keywords naturally throughout, no keyword stuffing
   - Include bullet points, short paragraphs, and practical examples
   - End with a concise conclusion

KEYWORDS TO USE:
- Primary: ${primaryKeyword}
- Secondary: ${secondaryKeywords}
- Long-tail: ${longTailKeywords}

OUTPUT FORMAT (JSON only):
{
  "excerpt": "...",
  "content": "# H1 Title\\n\\nFirst paragraph with primary keyword...\\n\\n## H2 Section\\n\\n..."
}

Return ONLY valid JSON, no markdown code blocks, no explanations.`;

    const userPrompt = `Generate blog content for:
Title: ${title}
Original input: ${originalInput || "N/A"}`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemma-3-27b-it",
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
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

    const aiText = response.data?.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    let jsonText = aiText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }
    
    const blogData = JSON.parse(jsonText);

    return res.json({
      success: true,
      data: {
        title,
        excerpt: blogData.excerpt,
        content: blogData.content,
        keywords,
      },
    });
  } catch (error) {
    console.error("Blog Content ERROR:", error.response?.data || error.message);
    console.error("Full error:", JSON.stringify(error.response?.data, null, 2));

    // Handle OpenRouter API errors
    let errorMessage = "AI generation failed";
    let errorDetails = error.message;

    if (error.response?.data) {
      const errorData = error.response.data;
      
      // OpenRouter error format
      if (errorData.error) {
        errorMessage = errorData.error.message || errorData.error.type || "Provider returned error";
        errorDetails = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
      code: error.response?.data?.error?.code || error.response?.status,
    });
  }
};
