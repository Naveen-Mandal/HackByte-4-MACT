async function generateFinalReview(verificationData) {
  if (!process.env.GEMINI_API_KEY) {
    return "Set GEMINI_API_KEY to generate a final review.";
  }

  const prompt = `Here is the complete verification data for a candidate:
${JSON.stringify(verificationData, null, 2)}

Write a professional recruiter-facing review. Include:
1. Overall honesty assessment (Are they truthful?)
2. Strongest verified claims
3. Weakest / unverifiable claims
4. Specific areas to probe in the interview
Keep it under 200 words. Be direct.
Return ONLY plain text.`;

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
        temperature: 0.3,
        responseMimeType: "text/plain",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return `Failed to generate review. Status: ${response.status}. Error: ${errorText}`;
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No review generated.";
}

module.exports = {
  generateFinalReview
};
