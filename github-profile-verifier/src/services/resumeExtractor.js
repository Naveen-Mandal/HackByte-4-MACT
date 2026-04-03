const pdf = require("pdf-parse");

async function extractTextFromPdf(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    const parseError = new Error("Failed to parse PDF document.");
    parseError.statusCode = 400;
    throw parseError;
  }
}

function buildResumeExtractionPrompt(resumeText) {
  return `Extract the following resume text into a highly structured JSON format. 
Ensure the output is ONLY valid JSON.
Fields requested:
1. "githubProfile": the GitHub username or full URL (string).
2. "contactInfo": { "name": string, "email": string }
3. "codingProfiles": { "leetcode": string, "codeforces": string, "codechef": string } (extract usernames if they exist, otherwise omit or empty string).
4. "internships": Array of objects: { "where": string, "time": string, "description": string }.
5. "projects": Array of objects: { "name": string, "description": string, "technologies": string[], "githubLink": string, "claimedPoints": string[] } (Extract distinct bullet points of what the candidate claimed they achieved or built for claimedPoints).
6. "skills": Array of strings (pull from skills section and infer from projects if necessary).
7. "achievements": Array of strings.
8. "certificates": Array of strings.

Resume Text:
${resumeText}`;
}

async function extractJsonWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("Set GEMINI_API_KEY to enable Gemini-based extraction.");
    error.statusCode = 500;
    throw error;
  }

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
    const error = new Error(`Gemini extraction request failed: ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  
  try {
    return JSON.parse(text);
  } catch (e) {
    const error = new Error("Failed to parse Gemini output as JSON.");
    error.statusCode = 500;
    throw error;
  }
}

async function extractResumeData(pdfBuffer) {
  const text = await extractTextFromPdf(pdfBuffer);
  const prompt = buildResumeExtractionPrompt(text);
  const extractedJson = await extractJsonWithGemini(prompt);
  
  return {
    rawText: text,
    extractedData: extractedJson
  };
}

module.exports = {
  extractTextFromPdf,
  buildResumeExtractionPrompt,
  extractJsonWithGemini,
  extractResumeData
};
