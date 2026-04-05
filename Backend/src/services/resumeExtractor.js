import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("pdf parsing error (pdf-parse):", error);
    const parseError = new Error("Failed to parse PDF document.");
    parseError.statusCode = 400;
    throw parseError;
  }
}

function buildResumeExtractionPrompt(resumeText, hyperlinks = []) {
  const hyperlinkSection = hyperlinks.length > 0
    ? `\n\nHIDDEN PDF HYPERLINKS (these are clickable anchor links embedded in the PDF that may not appear in the text above — treat them as high-confidence profile URLs):\n${hyperlinks.map((l, i) => `${i + 1}. ${l}`).join('\n')}`
    : '';

  return `Extract the following resume text into a highly structured JSON format. 
Ensure the output is ONLY valid JSON.
CRITICAL INSTRUCTION: A candidate's verifiable claims about their coding profiles AND their specific project technical achievements/metrics can be scattered ANYWHERE in the resume (under "Skills", "Achievements", "Experience", or randomly stated). You must logically scan the ENTIRE document multiple times to aggregate these scattered claims into their exact respective objects. Do NOT leave quantifiable metrics, project achievements, or coding account rankings in generic arrays like "skills" or "achievements" if they belong under a specific project's "claimedPoints" or a coding profile's "claims".

Fields requested:
1. "githubProfile": the GitHub username or full URL (string). IMPORTANT: Check the HIDDEN PDF HYPERLINKS section below first — if any link points to github.com, use that as the authoritative source.
2. "contactInfo": { "name": string, "email": string }
3. "codingProfiles": { 
     "leetcode": { "username": string, "claims": { "totalSolved": number, "ranking": number, "easySolved": number, "mediumSolved": number, "hardSolved": number, "currentRating": number, "maxRating": number, "contestsGiven": number } },
     "codeforces": { "username": string, "claims": { "rating": number, "maxRating": number, "rank": string, "totalSolved": number, "contestsGiven": number } },
     "codechef": { "username": string, "claims": { "currentRating": number, "maxRating": number, "stars": number, "globalRank": number, "contestsGiven": number } }
   }
   (Only include populated profiles/claims if they exist anywhere in the text. Scour the entire text AND the hyperlinks below to assign claims and usernames explicitly to the correct coding profile object).
4. "internships": Array of objects: { "where": string, "time": string, "description": string }.
5. "projects": Array of objects: { "name": string, "description": string, "technologies": string[], "githubLink": string, "claimedPoints": string[] } (Extract distinct bullet points of what the candidate claimed they achieved or built for claimedPoints).
6. "skills": Array of strings (pull from skills section. Do NOT include coding profile metrics here).
7. "achievements": Array of strings (Do NOT include coding profile ratings or project metrics here; move them to their specific claims objects).
8. "certificates": Array of strings.

Resume Text:
${resumeText}${hyperlinkSection}`;
}

function createEmptyExtractedData() {
  return {
    githubProfile: "",
    contactInfo: { name: "", email: "" },
    codingProfiles: {},
    internships: [],
    projects: [],
    skills: [],
    achievements: [],
    certificates: [],
  };
}

function findFirstMatch(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1] || match[0] : "";
}

function extractProfileUrl(text, hyperlinks, hostPattern) {
  const hyperlinkMatch = hyperlinks.find((link) => hostPattern.test(link));
  if (hyperlinkMatch) {
    return hyperlinkMatch;
  }

  return findFirstMatch(text, new RegExp(`https?:\\/\\/(?:www\\.)?${hostPattern.source}\\/[^\\s)]+`, "i"));
}

function extractUsernameFromUrl(url) {
  if (!url) {
    return "";
  }

  const match = url.match(/\/([^\/?#]+)\/?$/);
  return match ? match[1] : "";
}

function buildFallbackExtraction(text, hyperlinks = [], reason = "") {
  const githubUrl = extractProfileUrl(text, hyperlinks, /github\.com/i);
  const leetcodeUrl = extractProfileUrl(text, hyperlinks, /leetcode\.com/i);
  const codeforcesUrl = extractProfileUrl(text, hyperlinks, /codeforces\.com/i);
  const codechefUrl = extractProfileUrl(text, hyperlinks, /codechef\.com/i);
  const data = createEmptyExtractedData();

  data.githubProfile = githubUrl;
  data.contactInfo = {
    name: findFirstMatch(text, /^([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,3})/m),
    email: findFirstMatch(text, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i),
  };

  if (leetcodeUrl) {
    data.codingProfiles.leetcode = {
      username: extractUsernameFromUrl(leetcodeUrl),
      claims: {},
    };
  }

  if (codeforcesUrl) {
    data.codingProfiles.codeforces = {
      username: extractUsernameFromUrl(codeforcesUrl),
      claims: {},
    };
  }

  if (codechefUrl) {
    data.codingProfiles.codechef = {
      username: extractUsernameFromUrl(codechefUrl),
      claims: {},
    };
  }

  if (reason) {
    data._extractionWarning = reason;
  }

  return data;
}

function parseGeminiJson(text) {
  const normalized = String(text || "").trim();
  const withoutFences = normalized.replace(/```json\s*|```/gi, "").trim();
  const candidates = [normalized, withoutFences];

  const objectStart = withoutFences.indexOf("{");
  const objectEnd = withoutFences.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    candidates.push(withoutFences.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      return JSON.parse(candidate);
    } catch {
      // Try next candidate shape.
    }
  }

  const error = new Error("Failed to parse Gemini output as JSON.");
  error.statusCode = 500;
  throw error;
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

  return parseGeminiJson(text);
}

async function extractResumeData(pdfBuffer, hyperlinks = []) {
  const text = await extractTextFromPdf(pdfBuffer);
  const prompt = buildResumeExtractionPrompt(text, hyperlinks);
  let extractedJson;

  try {
    extractedJson = await extractJsonWithGemini(prompt);
  } catch (error) {
    console.warn("Gemini extraction failed, using fallback extraction:", error.message);
    extractedJson = buildFallbackExtraction(
      text,
      hyperlinks,
      `Fallback extraction used because structured AI extraction failed: ${error.message}`,
    );
  }
  
  return {
    rawText: text,
    extractedData: extractedJson
  };
}

export { 
  extractTextFromPdf,
  buildResumeExtractionPrompt,
  extractJsonWithGemini,
  extractResumeData
 };
