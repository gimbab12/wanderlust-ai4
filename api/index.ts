import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json());

let ai: GoogleGenAI | null = null;

function getAIClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

app.post("/api/recommend", async (req: express.Request, res: express.Response) => {
  try {
    const aiClient = getAIClient();
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

    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ recommendation: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate recommendations." });
  }
});

export default app;
