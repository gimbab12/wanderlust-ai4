import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function generateGeminiContent(prompt: string, model: string = "gemini-3.5-flash"): Promise<string> {
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
  });
  if (!response.text) {
    throw new Error("Gemini SDK 응답에서 텍스트를 추출할 수 없습니다.");
  }
  return response.text;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS Middleware to allow requests from Capacitor/Android WebView
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route for Gemini Recommendations
  app.post("/api/recommend", async (req, res) => {
    try {
      const { age, gender, mbti, preferredRegion, crowdPreference, budgetPreference, totalBudget, transportation, language } = req.body;

      if (age === '' || age === undefined || !gender || !preferredRegion || !crowdPreference || !budgetPreference || totalBudget === '' || totalBudget === undefined || !transportation || !language) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      const prompt = `You are an expert AI travel navigator. 
A user wants a travel recommendation. Profile:
- Age/Gender/MBTI: ${age}, ${gender}${mbti ? `, ${mbti}` : ''}
- Target Country/Region: ${preferredRegion}
- Vibe: ${crowdPreference}
- Budget: $${totalBudget} (${budgetPreference})
- Transport: ${transportation}

Provide a CONCISE travel itinerary:
1. Recommended Destination (You MUST choose a specific city/place WITHIN the target region: ${preferredRegion}) & 1-sentence reason.
   - Add image: ![City Name](/api/image?q=Specific+Name+of+City+or+Place)
2. 1 Recommended Accommodation & cost.
   - Add image: ![Hotel Name](/api/image?q=Specific+Exact+Name+of+the+Hotel+in+the+city)
3. 1-2 Recommended Foods/Restaurants.
   - Add image: ![Food Name](/api/image?q=Specific+Exact+Name+of+Restaurant+or+Food+in+the+city)
4. Brief daily itinerary (just highlights, max 3 days). Keep it very short and brief to save time.
   - Add 1 image total for attractions: ![Attraction Name](/api/image?q=Specific+Exact+Name+of+Attraction+in+the+city)

CRITICAL: 
- For image URLs, replace spaces with '+' in the 'q' parameter. Do NOT use markdown links for anything else.
- The destination MUST be located in ${preferredRegion}. Do not recommend anywhere else.
- The image queries MUST be highly specific (e.g. "Hilton+Hotel+Chicago" instead of just "Hotel").
- Output the ENTIRE response in this language: ${language}.
- Keep the response brief and fast to read.
`;

      const text = await generateGeminiContent(prompt, "gemini-3.5-flash");
      res.json({ recommendation: text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      let errorMsg = error.message || "Failed to generate recommendations.";
      
      const errStr = JSON.stringify(error) + " " + String(error.message) + " " + String(error.stack);
      if (
        errStr.includes("UNAUTHENTICATED") || 
        errStr.includes("401") || 
        errStr.includes("invalid authentication") || 
        errStr.includes("API_KEY_SERVICE_BLOCKED") || 
        errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")
      ) {
        errorMsg = "API 인증 오류: 설정된 API 키가 올바르지 않거나 지원되지 않는 토큰 형식입니다.\n\n[해결 방법]\nAI Studio의 Secrets 메뉴 오류('Failed to load Gemini API key')로 인해 'GEMINI_API_KEY'가 정상 동작하지 않는 경우, Secrets 메뉴에서 [+ Add secret]을 누르고 이름(Name)을 'CUSTOM_GEMINI_API_KEY'로 입력한 후, 값(Value) 란에 직접 구글 AI 스튜디오(https://aistudio.google.com/)에서 복사해온 본인의 Gemini API 키(AIzaSy로 시작하는 39글자 형태의 키)를 입력해 [Add] 버튼을 눌러 추가해 주세요! 이 우회 기능이 연동되도록 조치했습니다.";
      } else if (
        errStr.includes("RESOURCE_EXHAUSTED") || 
        errStr.includes("429") || 
        errStr.includes("quota")
      ) {
        errorMsg = "AI 일일 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주시거나, 다른 API 키를 사용해주세요 (구글 AI 스튜디오 무료 할당량 초과).";
      }

      res.status(500).json({ 
        error: errorMsg 
      });
    }
  });

  app.get("/api/image", async (req, res) => {
    const q = req.query.q as string;
    if (!q) {
      return res.redirect("https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=800&q=80");
    }

    try {
      const google = await import("googlethis");
      const images = await google.default.image(q, { safe: false });
      if (images && images.length > 0) {
        return res.redirect(images[0].url);
      }
    } catch (e) {
      console.error("googlethis image search failed", e);
    }

    try {
      const wpRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=3&pithumbsize=800`);
      const data = await wpRes.json();
      let imageUrl = "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=800&q=80";
      
      if (data && data.query && data.query.pages) {
        const pages = Object.values(data.query.pages) as any[];
        const validPage = pages.find(p => p.thumbnail && p.thumbnail.source && !p.thumbnail.source.endsWith('.svg') && !p.thumbnail.source.endsWith('.png'));
        if (validPage) {
          imageUrl = validPage.thumbnail.source;
        } else if (pages.length > 0 && pages[0].thumbnail && !pages[0].thumbnail.source.endsWith('.svg')) {
          imageUrl = pages[0].thumbnail.source;
        }
      }
      
      res.redirect(imageUrl);
    } catch (error) {
      res.redirect("https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=800&q=80");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
