import axios from "axios";
// 🔁 Model fallback order to avoid 429 errors
const SEO_MODELS = [
  "google/gemma-2-9b-it",
  "google/gemma-3-12b-it",
  "google/gemma-3-27b-it"
];

// 🧠 Simple in-memory cache (WordPress-like behavior)
const seoCache = new Map();

// 🧠 Content generation cache
const contentCache = new Map();

export const generateSeoTitles = async (req, res) => {
  try {
    const { input, force } = req.body;
    
    // 🔥 Force regenerate → clear cache
    if (force === true) {
      seoCache.delete(input);
    }
    
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
Given a topic or rough idea, generate SEO-optimized blog metadata that can rank on Google.

Topic: "${input}"

CRITICAL SEO REQUIREMENTS (MUST FOLLOW):

1. PRIMARY KEYWORD:
   - First, identify a strong primary keyword (2-4 words) for this topic
   - This keyword MUST appear in EVERY title you generate
   - This keyword MUST appear in the slug

2. TITLES (5 options):
   - Length: EXACTLY 50-60 characters (count carefully!)
   - MUST contain the primary keyword
   - Include power words for CTR

3. META DESCRIPTIONS (5 options):
   - Length: EXACTLY 140-160 characters (count carefully!)
   - MUST contain the primary keyword
   - Include a call-to-action

4. SLUG:
   - MUST contain the primary keyword
   - Lowercase, hyphen-separated

JSON FORMAT:
{
  "titles": [
    "Title with primary keyword (50-60 chars)",
    "Title with primary keyword (50-60 chars)",
    "Title with primary keyword (50-60 chars)",
    "Title with primary keyword (50-60 chars)",
    "Title with primary keyword (50-60 chars)"
  ],
  "metaDescriptions": [
    "Description with keyword (140-160 chars)",
    "Description with keyword (140-160 chars)",
    "Description with keyword (140-160 chars)",
    "Description with keyword (140-160 chars)",
    "Description with keyword (140-160 chars)"
  ],
  "slug": "primary-keyword-in-slug",
  "keyphrases": {
    "primary": "exact primary keyword used in titles",
    "secondary": ["keyword 1", "keyword 2", "keyword 3", "keyword 4"]
  },
  "serpInsights": {
    "contentAngle": "what angle ranks best",
    "recommendedSections": ["section 1", "section 2", "section 3"]
  }
}

STRICT RULES:
- Count characters carefully for titles (50-60) and meta descriptions (140-160)
- Primary keyword MUST appear in all titles and the slug
- No markdown, no explanation, only valid JSON`;

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


// 🧠 Meta description cache
const metaDescCache = new Map();

export const generateMetaDescriptions = async (req, res) => {
  try {
    const { title, force } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    // 🔥 Force regenerate → clear cache
    if (force === true) {
      metaDescCache.delete(title);
    }

    // ⚡ Return cached if exists
    if (metaDescCache.has(title)) {
      return res.json(metaDescCache.get(title));
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "API key not configured. Please set OPENROUTER_API_KEY in .env file.",
      });
    }

    const prompt = `You are an SEO expert specializing in meta descriptions.

Your task: Generate 5 unique, compelling meta descriptions specifically for this blog title.

Title: "${title}"

CRITICAL REQUIREMENTS (MUST FOLLOW):
1. Each meta description MUST be EXACTLY 140-160 characters (count carefully!)
2. Extract the main keyword from the title and include it in each description
3. Include a call-to-action or curiosity hook
4. Be specific to the title's topic
5. No fluff, no emojis
6. Optimized for click-through rate

Return ONLY valid JSON in this exact format:
{
  "metaDescriptions": [
    "Description with keyword from title (140-160 chars exactly)",
    "Description with keyword from title (140-160 chars exactly)",
    "Description with keyword from title (140-160 chars exactly)",
    "Description with keyword from title (140-160 chars exactly)",
    "Description with keyword from title (140-160 chars exactly)"
  ]
}

STRICT RULES:
- Count characters carefully - each MUST be 140-160 characters
- Include the main keyword from the title
- No markdown, no explanation, only valid JSON`;

    let response;
    let lastError;

    for (const model of SEO_MODELS) {
      try {
        response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model,
            max_tokens: 1000,
            temperature: 0.7,
            messages: [
              { role: "system", content: prompt },
              { role: "user", content: title },
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
        break;
      } catch (err) {
        lastError = err;
        if (err.response?.status !== 429) {
          throw err;
        }
      }
    }

    if (!response) {
      throw lastError;
    }

    const aiText = response.data?.choices?.[0]?.message?.content || "";
    
    let jsonText = aiText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");
    }
    
    const json = JSON.parse(jsonText);

    const payload = {
      success: true,
      title,
      metaDescriptions: json.metaDescriptions || []
    };

    // 🧠 cache result
    metaDescCache.set(title, payload);

    return res.json(payload);

  } catch (error) {
    console.error("Meta Description ERROR:", error.response?.data || error.message);

    let errorMessage = "AI generation failed";
    let errorDetails = error.message;

    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.error) {
        if (errorData.error.code === 401 || error.response?.status === 401) {
          errorMessage = "Invalid or expired API key. Please check your OPENROUTER_API_KEY.";
          errorDetails = "API authentication failed";
        } else {
          errorMessage = errorData.error.message || errorData.error.type || "Provider returned error";
          errorDetails = errorData.error;
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    }

    const statusCode = error.response?.status === 401 ? 500 : (error.response?.status || 500);
    
    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
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

  // Note: Removed in-flight limiter to allow unlimited regeneration

  try {
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

TASK: Generate complete blog content that will score 90+ on SEO analysis tools.

PRIMARY KEYWORD: "${primaryKeyword}"
SECONDARY KEYWORDS: ${secondaryKeywords}

CRITICAL SEO REQUIREMENTS (MUST ALL BE MET):

1. EXCERPT/META DESCRIPTION:
   - EXACTLY 140-160 characters (count carefully!)
   - MUST include the primary keyword "${primaryKeyword}"
   - Compelling call-to-action

2. CONTENT REQUIREMENTS:
   - Minimum 900 words
   - The H1 title MUST include "${primaryKeyword}"
   - The FIRST PARAGRAPH (within first 100 words) MUST include "${primaryKeyword}"
   - Use "${primaryKeyword}" naturally 5-8 times throughout the content
   - Include secondary keywords naturally
   - Clear H1, H2, H3 hierarchy
   - Include bullet points and practical examples
   - End with a conclusion

3. KEYWORD PLACEMENT CHECKLIST:
   ✓ Primary keyword in H1 title
   ✓ Primary keyword in first paragraph
   ✓ Primary keyword appears 5-8 times in content
   ✓ Primary keyword in excerpt

OUTPUT FORMAT (JSON only):
{
  "excerpt": "140-160 char description with ${primaryKeyword}...",
  "content": "# H1 Title with ${primaryKeyword}\\n\\nFirst paragraph mentioning ${primaryKeyword} naturally...\\n\\n## H2 Section\\n\\n..."
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
  }
};