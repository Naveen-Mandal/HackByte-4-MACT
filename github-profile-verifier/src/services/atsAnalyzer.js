async function analyzeAtsScore(resumeText) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      used: false,
      message: "Set GEMINI_API_KEY to enable Gemini-based ATS Analysis."
    };
  }

  const prompt = `Analyze this resume text for ATS (Applicant Tracking System) compatibility.
Be strict but fair.
Return ONLY JSON matching this structure:
{
  "atsScore": 0-100,
  "issues": [
    { "category": "formatting|keywords|sections|structure", "issue": "description", "severity": "high|medium|low", "fix": "how to fix it" }
  ]
}

Resume Text:
${resumeText}`;

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
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Gemini ATS analysis request failed: ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  
  try {
    return JSON.parse(text);
  } catch (e) {
    return { error: "Failed to parse ATS output as JSON." };
  }
}

module.exports = {
  analyzeAtsScore
};
