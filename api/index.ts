import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

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

app.post("/api/recommend", async (req: express.Request, res: express.Response) => {
  try {
    const { age, gender, mbti, preferredRegion, crowdPreference, budgetPreference, totalBudget, transportation, language } = req.body;

    if (age === '' || age === undefined || !gender || !preferredRegion || !crowdPreference || !budgetPreference || totalBudget === '' || totalBudget === undefined || !transportation || !language) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const prompt = `You are an expert AI travel navigator. 
A user wants travel recommendations based on the following profile:
- Age: ${age}
- Gender: ${gender}
${mbti ? `- MBTI Personality: ${mbti}\n` : ''}- Preferred Country/Region: ${preferredRegion}
- Preference (Atmosphere/Crowd): ${crowdPreference} (Note: 'quiet' means quiet & peaceful, 'neutral' means balanced, 'crowded' means bustling & lively, 'historical' means historical & traditional heritage, 'modern' means modern & trendy urban sights, 'nature' means outdoor scenery & healing nature, 'artistic' means artistic & cultural sentiment)
- Preference (Spending Style): ${budgetPreference} (Note: 'cheap' means budget & street food, 'balanced' means standard balanced spending, 'expensive' means luxury & fine dining, 'flex' means saving in general but big splurge/flexing on special experiences/shopping, 'shopping' means focused heavily on shopping/boutiques/outlets, 'foodie' means high focus on culinary/famous gourmet restaurants regardless of budget)
- Preferred Transportation: ${transportation}
- Total Budget: $${totalBudget}

Provide a detailed travel itinerary including:
1. Recommended Destination (City/Country) with a short explanation of why it fits their profile.
   - Include a beautiful image of the destination using this exact markdown format: ![City Name](https://image.pollinations.ai/prompt/beautiful%20scenery%20of%20[City%20Name%20in%20English])
   - Include a street view or cityscape image using this exact markdown format: ![Street View](https://image.pollinations.ai/prompt/beautiful%20street%20view%20of%20[City%20Name%20in%20English])
2. Recommended Accommodations (specific hotel names or types of stays, and estimated cost). 
   - You MUST include a real booking link or official website link in markdown format (e.g., [Book Hotel](https://www.google.com/search?q=[Hotel+Name]+booking)).
   - Include at least 3 high-quality images of the accommodation (e.g., exterior, room interior, amenities) using this exact markdown format:
     ![Hotel Exterior](https://image.pollinations.ai/prompt/beautiful%20hotel%20exterior%20in%20[City%20Name%20in%20English])
     ![Hotel Room](https://image.pollinations.ai/prompt/luxurious%20hotel%20room%20in%20[City%20Name%20in%20English])
     ![Hotel Amenities](https://image.pollinations.ai/prompt/hotel%20pool%20or%20lounge%20in%20[City%20Name%20in%20English])
3. Recommended Food/Restaurants (specific dishes or places, and estimated cost).
   - Include an appetizing image of the recommended food using this exact markdown format: ![Food Name](https://image.pollinations.ai/prompt/delicious%20[Food%20Name%20in%20English]%20dish)
4. A brief daily itinerary or highlights.
   - Include 2-3 images of key attractions in the itinerary using this exact markdown format: ![Attraction Name](https://image.pollinations.ai/prompt/beautiful%20view%20of%20[Attraction%20Name%20in%20English])

CRITICAL INSTRUCTION: You MUST output the ENTIRE response in the following language code: ${language}.
Output the response in clean Markdown format. Be specific and realistic regarding costs.
`;

    const text = await generateGeminiContent(prompt, "gemini-3.5-flash");
    res.json({ recommendation: text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMsg = "Failed to generate recommendations.";
    if (error && typeof error === 'object') {
      const errStr = JSON.stringify(error) + " " + String(error.message) + " " + String(error.stack);
      if (
        errStr.includes("UNAUTHENTICATED") || 
        errStr.includes("401") || 
        errStr.includes("invalid authentication") || 
        errStr.includes("API_KEY_SERVICE_BLOCKED") || 
        errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")
      ) {
        errorMsg = "API 인증 오류: 설정된 API 키가 올바르지 않거나 지원되지 않는 토큰 형식입니다.\n\n[해결 방법]\nAI Studio의 Secrets 메뉴 오류('Failed to load Gemini API key')로 인해 'GEMINI_API_KEY'가 정상 동작하지 않는 경우, Secrets 메뉴에서 [+ Add secret]을 누르고 이름(Name)을 'CUSTOM_GEMINI_API_KEY'로 입력한 후, 값(Value) 란에 직접 구글 AI 스튜디오(https://aistudio.google.com/)에서 복사해온 본인의 Gemini API 키(AIzaSy로 시작하는 39글자 형태의 키)를 입력해 [Add] 버튼을 눌러 추가해 주세요! 이 우회 기능이 연동되도록 조치했습니다.";
      } else {
        errorMsg = error.message || errorMsg;
      }
    }
    res.status(500).json({ error: errorMsg });
  }
});

export default app;
