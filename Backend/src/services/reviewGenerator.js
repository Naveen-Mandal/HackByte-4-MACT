async function generateFinalReview(verificationData) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const prompt = `You are a senior technical recruiter. Analyze this candidate verification data and return a JSON object.

VERIFICATION DATA:
${JSON.stringify(verificationData, null, 2)}

RULES — be ruthlessly concise:
- Each bullet must be ONE SHORT SENTENCE, max 12 words.
- Focus ONLY on things that genuinely matter for hiring (skills, honesty, coding ability, project depth).
- Do NOT repeat data that is obvious from numbers. Synthesize insights.
- strengths: 3-5 bullets for verified positive signals
- cautions: 2-3 bullets for unverifiable or weak claims  
- redFlags: 0-3 bullets ONLY if there are actual dishonesty or serious gaps (empty array if none)
- verdict: ONE sentence hiring recommendation, max 15 words
- hiringProbability: exactly one of "Strong" | "Good" | "Moderate" | "Low" | "Very Low"

Return ONLY valid JSON, no markdown, no extra text:
{
  "strengths": ["string", ...],
  "cautions": ["string", ...],
  "redFlags": ["string", ...],
  "verdict": "string",
  "hiringProbability": "string"
}`;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return null;
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

export { 
  generateFinalReview
 };
