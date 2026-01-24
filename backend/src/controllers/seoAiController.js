import axios from "axios";
// 🔁 Model fallback order to avoid 429 errors
const SEO_MODELS = [
  "google/gemma-2-9b-it",
  "google/gemma-3-12b-it",
  "google/gemma-3-27b-it"
];

// 🧠 Simple in-memory cache (WordPress-like behavior)
const seoCache = new Map();

// 🧠 Content generation cache & in-flight protection
const contentCache = new Map();
const contentInFlight = new Set();

export const generateSeoTitles = async (req, res) => {
  try {
    const { input } = req.body;
    // ⚡ Return cached SEO if exists (prevents repeat AI calls)
if (seoCache.has(input)) {
  return res.json(seoCache.get(input));
}


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

    const prompt = `You are an advanced SEO engine similar to Yoast + RankMath + SurferSEO.

Your task:
Given a topic or rough idea, generate SEO-optimized blog metadata
that can rank on Google.

STEP 1 — Understand Search Intent
- Detect whether intent is: informational, commercial, comparison, or guide

STEP 2 — SERP Gap Identification
- Identify what competing pages usually cover
- Identify what is often missing
- Optimize for higher click-through-rate and topical authority

STEP 3 — Generate SEO Assets

Return ONLY valid JSON in the exact format below.

Topic: "${input}"

JSON FORMAT:
{
  "titles": [
    "SEO optimized title under 60 characters",
    "SEO optimized title under 60 characters",
    "SEO optimized title under 60 characters",
    "SEO optimized title under 60 characters",
    "SEO optimized title under 60 characters"
  ],
  "metaDescriptions": [
    "Meta description under 160 characters",
    "Meta description under 160 characters",
    "Meta description under 160 characters",
    "Meta description under 160 characters",
    "Meta description under 160 characters"
  ],
  "slug": "seo-friendly-url-slug-with-hyphens",
  "keyphrases": {
    "primary": "main seo keyword",
    "secondary": [
      "secondary keyword 1",
      "secondary keyword 2",
      "secondary keyword 3",
      "secondary keyword 4"
    ]
  },
  "serpInsights": {
    "contentAngle": "what angle ranks best",
    "recommendedSections": [
      "section idea 1",
      "section idea 2",
      "section idea 3"
    ]
  }
}

STRICT RULES:
- Slug must be lowercase, hyphen-separated
- No markdown
- No explanation
- Only valid JSON`;

    const systemPrompt = prompt;

    let response;
let lastError;

for (const model of SEO_MODELS) {
  try {
    response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        max_tokens: 2500,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input },
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

    // ✅ success → stop trying other models
    break;
  } catch (err) {
    lastError = err;

    // Try next model only if rate-limited
    if (err.response?.status !== 429) {
      throw err;
    }
  }
}

if (!response) {
  throw lastError;
}


    const aiText = response.data?.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonText = aiText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }
    
    const json = JSON.parse(jsonText);

    // Maintain backward compatibility: convert to old format for existing frontend
    // Old format: data array with {title, keywords}
    const legacyData = json.titles.map((title, index) => ({
      title,
      keywords: [
        json.keyphrases.primary,
        ...json.keyphrases.secondary
      ]
    }));

    const payload = {
  success: true,
  data: legacyData, // backward compatibility
  titles: json.titles,
  metaDescriptions: json.metaDescriptions,
  slug: json.slug,
  keyphrases: json.keyphrases,
  serpInsights: json.serpInsights
};

// 🧠 cache result
seoCache.set(input, payload);

return res.json(payload);

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
        // Handle API key errors with user-friendly message
        if (errorData.error.code === 401 || error.response?.status === 401) {
          errorMessage = "Invalid or expired API key. Please check your OPENROUTER_API_KEY.";
          errorDetails = "API authentication failed";
        } else {
          errorMessage = errorData.error.message || errorData.error.type || "Provider returned error";
          errorDetails = errorData.error;
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    }

    // Always return 500 for OpenRouter API errors (not 401) to prevent logout
    // 401 should only be used for our own authentication failures
    const statusCode = error.response?.status === 401 ? 500 : (error.response?.status || 500);
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
      code: error.response?.data?.error?.code || error.response?.status,
    });
  }
};


export const generateBlogContent = async (req, res) => {
  const { title, keywords, originalInput, force } = req.body;

  // ✅ Validate BEFORE using keywords
  if (!title || !keywords || !Array.isArray(keywords)) {
    return res.status(400).json({
      message: "Title and keywords array are required",
    });
  }

  const cacheKey = `${title}|${keywords.join(",")}`;

  // 🔥 FORCE regenerate → clear cache
  if (force === true) {
    contentCache.delete(cacheKey);
  }

  // 🧠 Serve from cache if exists (and not forcing)
  if (!force && contentCache.has(cacheKey)) {
    return res.json(contentCache.get(cacheKey));
  }

  // ⏳ Prevent duplicate in-flight generations
  if (contentInFlight.has(cacheKey)) {
    return res.status(429).json({
      success: false,
      message: "Content generation already in progress. Please wait.",
    });
  }

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is not set in environment variables");
      return res.status(500).json({
        success: false,
        message: "API key not configured. Please set OPENROUTER_API_KEY in .env file.",
      });
    }

    // ➕ mark as in-flight
    contentInFlight.add(cacheKey);


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

    // Model fallback with retry logic
    let response;
    let lastError;

    for (const model of SEO_MODELS) {
      try {
        response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
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
        // Success - break out of loop
        break;
      } catch (err) {
        lastError = err;
        // If 429, wait 1500ms then try next model
        if (err.response?.status === 429) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        // For non-429 errors, throw immediately
        throw err;
      }
    }

    // If all models failed with 429, return friendly error
    if (!response && lastError?.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: "AI is busy. Please try again shortly.",
      });
    }

    // If no response and lastError exists, throw it
    if (!response) {
      throw lastError;
    }

    const aiText = response.data?.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    let jsonText = aiText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }
    
    // Handle malformed JSON responses
    let blogData;
    try {
      blogData = JSON.parse(jsonText);
    } catch (parseError) {
      return res.status(502).json({
        success: false,
        message: "AI returned malformed content. Please retry.",
      });
    }

    const payload = {
  success: true,
  data: {
    title,
    excerpt: blogData.excerpt,
    content: blogData.content,
    keywords,
  },
};

// 🧠 cache content
contentCache.set(cacheKey, payload);

return res.json(payload);

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
        // Handle API key errors with user-friendly message
        if (errorData.error.code === 401 || error.response?.status === 401) {
          errorMessage = "Invalid or expired API key. Please check your OPENROUTER_API_KEY.";
          errorDetails = "API authentication failed";
        } else {
          errorMessage = errorData.error.message || errorData.error.type || "Provider returned error";
          errorDetails = errorData.error;
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    }

    // Always return 500 for OpenRouter API errors (not 401) to prevent logout
    // 401 should only be used for our own authentication failures
    const statusCode = error.response?.status === 401 ? 500 : (error.response?.status || 500);
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
      code: error.response?.data?.error?.code || error.response?.status,
    });
  } finally {
    // Always remove from in-flight set
    contentInFlight.delete(cacheKey);
  }
};