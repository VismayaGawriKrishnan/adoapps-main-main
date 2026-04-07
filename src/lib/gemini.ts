import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// We would usually store the API key in environment variables (import.meta.env.VITE_GEMINI_API_KEY)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "dummy_key_for_now";
const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiModel = (modelName = "gemini-1.5-flash") => {
    return genAI.getGenerativeModel({ model: modelName });
};

// ------------------------------------------
// MULTI-AGENT PROMPT TEMPLATES & FUNCTIONS
// ------------------------------------------

export const Agents = {
  DietAgent: async (userContext: any, foodLabels: string[]) => {
    if (apiKey === "dummy_key_for_now") {
      await new Promise(r => setTimeout(r, 1000));
      const hasDiabetes = userContext?.healthMode === "Diabetes";
      return `🧠 Gemini Decision Engine (Mock):\n• Detected ${foodLabels.length} items: ${foodLabels.join(", ")}.\n• Est. Calories: ${foodLabels.length * 180} kcal.\n• Health Impact: ${hasDiabetes ? "Contains refined carbs; watch your blood sugar spikes." : "Good mix of macronutrients."}\n• Tip: Pair with a lean protein for better satiety!`;
    }

    const prompt = `You are an expert AI Dietician specializing in Indian cuisine and metabolic health.
    User Profile: Age ${userContext.age}, Weight ${userContext.weight}kg, Goal: ${userContext.goal}, Mode: ${userContext.healthMode}.
    Context: The user scanned a meal detected as: ${foodLabels.join(", ")}.
    Task: 
    1. Estimate calories, sugar, protein, and fat quality.
    2. Analyze the health impact based on their ${userContext.healthMode}.
    3. Suggest portion control and healthier alternatives if necessary.
    Format your response in plain text with clear bullet points. Keep it under 150 words.`;

    try {
        const result = await getGeminiModel().generateContent(prompt);
        return result.response.text();
    } catch (e) {
        console.error("Gemini API Error", e);
        return "Could not connect to Gemini AI right now. Please check your API key.";
    }
  },

  VoiceDietAgent: async (userContext: any, transcript: string) => {
    if (apiKey === "dummy_key_for_now") {
       await new Promise(r => setTimeout(r, 1000));
       return `🧠 Gemini Voice (Mock): Based on what you said, I've logged: [${transcript}], estimating 350 kcal. Good choice!`;
    }
    const prompt = `Analyze this spoken meal log: "${transcript}".
    Extract the exact food items and estimate total calories. Return a simple string format like: "Logged: [Foods], ~[Cal] Kcal. [Short insight]".`;
    try {
        const result = await getGeminiModel().generateContent(prompt);
        return result.response.text();
    } catch (e) {
        return "Could not process voice right now.";
    }
  },

  WorkoutAgent: async (userContext: any, exercise: string, postureErrorLogs: string, userQuery: string) => {
    if (apiKey === "dummy_key_for_now") {
      await new Promise(r => setTimeout(r, 1000));
      return `🧠 Gemini Decision Engine (Mock): I noticed your posture needs adjustment down there. Let's try to keep your back straighter on the next rep!`;
    }

    const prompt = `You are an empathetic, motivating AI Personal Trainer.
    Context: The user is attempting ${exercise}. MediaPipe telemetry indicates: ${postureErrorLogs}.
    Voice Input from User: "${userQuery}"
    Task: Give a short, punchy, conversational verbal correction and answer their query. 
    Keep it under 2 sentences to be converted via TTS. Adapt your tone: if the user is in '${userContext.healthMode}', be extremely gentle and cautious if it is 'Elderly Mode', or push hard if 'General Mode'.`;

    try {
        const result = await getGeminiModel().generateContent(prompt);
        return result.response.text();
    } catch (e) {
        console.error("Gemini API Error", e);
        return "Keep going! Adjust your posture.";
    }
  },

  HealthRiskAgent: async (userContext: any, recentMetrics: any) => {
     if (apiKey === "dummy_key_for_now") {
        await new Promise(r => setTimeout(r, 600));
        return `🧠 Gemini Decision Engine (Mock): Based on your recent logs, your activity levels are steady. Keep doing what you're doing.`;
     }

     const prompt = `Act as an advanced medical AI. Analyze this user: ${JSON.stringify(userContext)}.
     Recent data: ${JSON.stringify(recentMetrics)}. 
     Detect any risk vectors like diabetes trends or cholesterol spikes and suggest 1 key lifestyle change today.`;
     
     try {
        const result = await getGeminiModel().generateContent(prompt);
        return result.response.text();
    } catch (e) {
        console.error("Gemini API Error", e);
        return "Maintain your current healthy habits.";
    }
  },

  BehavioralAgent: async (mealHistory: any[]) => {
    // Specifically looks for Eating Disorders (bulimia, severe restriction)
    if (apiKey === "dummy_key_for_now") {
      await new Promise(r => setTimeout(r, 600));
      // Simple mock check
      const totalCals = mealHistory.reduce((sum, m) => sum + (m.calories || 0), 0);
      if (totalCals > 0 && totalCals < 800) {
        return "⚠️ We've noticed your caloric intake is very low today. For your physical and mental well-being, please make sure you're getting enough energy. Consistency is more important than restriction.";
      }
      return null;
    }
    
    const prompt = `You are a medical AI specializing in Behavioral Health and Eating Disorders. 
    Review this recent meal history: ${JSON.stringify(mealHistory)}. 
    Look for extreme caloric restriction (under 800cal/day), alternating binge-fast patterns, or anomalies indicative of bulimia or anorexia nervosa.
    If you detect a high risk, return a compassionate, highly supportive warning message (under 3 sentences) advising them to focus on nourishment and to seek professional guidance if they feel overwhelmed. 
    If no risk is detected, return exactly "OK".`;

    try {
       const result = await getGeminiModel().generateContent(prompt);
       const text = result.response.text().trim();
       return text === "OK" ? null : text;
    } catch (e) {
       return null;
    }
  },

  SleepOptimizerAgent: async (metrics: any) => {
    if (apiKey === "dummy_key_for_now") {
       await new Promise(r => setTimeout(r, 600));
       return `🧠 Sleep Optimizer: You burned intense calories yesterday. Aim for at least 8h of sleep tonight and consider stretching before bed to improve recovery!`;
    }
    const prompt = `You are a Sleep Optimization AI.
    User context: ${JSON.stringify(metrics)}.
    Provide exactly 2 sentences of actionable advice to optimize their sleep tonight based on their recent workouts and habits.`;
    try {
       const result = await getGeminiModel().generateContent(prompt);
       return result.response.text();
    } catch (e) {
       return "Aim for 7-9 hours of consistent rest.";
    }
  }
};
