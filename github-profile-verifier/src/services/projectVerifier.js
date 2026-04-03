const {
  extractGithubUsername,
  buildGithubHeaders,
  verifyGithubProfile,
} = require("./githubVerifier");
const { extractResumeProjects } = require("./resumeProjectExtractor");
const {
  isImportantFile,
  summarizeImportantFile,
} = require("./projectKeywordExtractor");

const GITHUB_API_BASE_URL = "https://api.github.com";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreProjectAgainstRepo(project, repo) {
  const projectTerms = new Set([
    ...normalizeText(project.name).split(" ").filter(Boolean),
    ...project.keywords,
  ]);
  const repoTerms = new Set([
    ...normalizeText(repo.name).split(" ").filter(Boolean),
    ...normalizeText(repo.description).split(" ").filter(Boolean),
    ...(repo.topics || []),
  ]);

  let score = 0;

  for (const term of projectTerms) {
    if (repoTerms.has(term)) {
      score += 2;
    }
  }

  if (normalizeText(repo.name).includes(normalizeText(project.name))) {
    score += 5;
  }

  if ((repo.homepage || "").toLowerCase().includes(normalizeText(project.name).replace(/\s+/g, ""))) {
    score += 3;
  }

  return score;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
}

async function fetchGithubRepos(username) {
  return fetchJson(`${GITHUB_API_BASE_URL}/users/${username}/repos?per_page=100&sort=updated`, {
    headers: buildGithubHeaders(),
  });
}

async function fetchRepoContents(owner, repo, path = "") {
  const encodedPath = path ? `/${path}` : "";
  return fetchJson(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/contents${encodedPath}`, {
    headers: buildGithubHeaders(),
  });
}

function decodeGithubContent(content) {
  return Buffer.from(content, "base64").toString("utf8");
}

async function collectImportantFileSummaries(owner, repo) {
  let rootContents = [];

  try {
    rootContents = await fetchRepoContents(owner, repo);
  } catch {
    return [];
  }

  const importantEntries = rootContents
    .filter((entry) => entry.type === "file" && isImportantFile(entry.name))
    .slice(0, 6);

  const summaries = [];

  for (const entry of importantEntries) {
    try {
      const file = await fetchRepoContents(owner, repo, entry.path);
      if (!file.content) {
        continue;
      }

      summaries.push(summarizeImportantFile(entry.name, decodeGithubContent(file.content)));
    } catch {
      // Ignore individual file read failures so one missing file does not fail the repo.
    }
  }

  return summaries;
}

async function checkDeployment(url) {
  if (!url) {
    return { checked: false, working: false, status: null };
  }

  try {
    const response = await fetch(url, { redirect: "follow" });
    return {
      checked: true,
      working: response.ok,
      status: response.status,
      finalUrl: response.url,
    };
  } catch {
    return {
      checked: true,
      working: false,
      status: null,
    };
  }
}

function buildGeminiPrompt({ githubProfile, resumeProjects, projectMatches }) {
  const compactPayload = {
    githubProfile: {
      username: githubProfile.username,
      name: githubProfile.name,
      publicRepos: githubProfile.publicRepos,
      followers: githubProfile.followers,
    },
    resumeProjects: resumeProjects.map((project) => ({
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      keywords: project.keywords,
    })),
    githubEvidence: projectMatches.map((match) => ({
      resumeProject: match.resumeProject.name,
      matchScore: match.matchScore,
      repo: {
        name: match.repo.name,
        description: match.repo.description,
        language: match.repo.language,
        topics: match.repo.topics,
        homepage: match.repo.homepage,
        deploymentCheck: match.deploymentCheck,
      },
      importantFiles: match.importantFiles,
    })),
  };

  return [
    "You are verifying whether resume projects appear to be real and working based on GitHub evidence.",
    "Use only the supplied compact evidence.",
    "Return JSON with keys: overallVerdict, confidence, summary, projectAssessments.",
    "Each projectAssessments item must include: resumeProject, matchedRepo, verdict, confidence, reasons, workingDemoLikelihood.",
    JSON.stringify(compactPayload),
  ].join("\n");
}

async function analyzeWithGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      used: false,
      message: "Set GEMINI_API_KEY to enable Gemini-based verification.",
    };
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Gemini request failed: ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return {
    used: true,
    model,
    raw: text,
  };
}

async function verifyGithubProjects(input) {
  const normalizedUsername = extractGithubUsername(input.username || input.profileUrl);

  if (!normalizedUsername) {
    const error = new Error("Provide a valid GitHub username or profile URL.");
    error.statusCode = 400;
    throw error;
  }

  const resumeProjects = extractResumeProjects({
    resumeText: input.resumeText,
    resumeProjects: input.resumeProjects,
  });

  if (resumeProjects.length === 0) {
    const error = new Error("Provide resumeText or resumeProjects with at least one project.");
    error.statusCode = 400;
    throw error;
  }

  const [githubProfile, repos] = await Promise.all([
    verifyGithubProfile(normalizedUsername),
    fetchGithubRepos(normalizedUsername),
  ]);

  const scoredMatches = resumeProjects
    .map((project) => {
      const bestRepo = repos
        .map((repo) => ({
          repo,
          score: scoreProjectAgainstRepo(project, repo),
        }))
        .sort((left, right) => right.score - left.score)[0];

      return {
        resumeProject: project,
        repo: bestRepo?.repo || null,
        matchScore: bestRepo?.score || 0,
      };
    })
    .filter((match) => match.repo && match.matchScore > 0);

  const enrichedMatches = [];

  for (const match of scoredMatches.slice(0, 5)) {
    const importantFiles = await collectImportantFileSummaries(normalizedUsername, match.repo.name);
    const deploymentCheck = await checkDeployment(match.repo.homepage);

    enrichedMatches.push({
      resumeProject: match.resumeProject,
      matchScore: match.matchScore,
      repo: {
        name: match.repo.name,
        htmlUrl: match.repo.html_url,
        description: match.repo.description,
        language: match.repo.language,
        topics: match.repo.topics || [],
        homepage: match.repo.homepage,
        updatedAt: match.repo.updated_at,
        stargazersCount: match.repo.stargazers_count,
      },
      deploymentCheck,
      importantFiles,
    });
  }

  const geminiPrompt = buildGeminiPrompt({
    githubProfile,
    resumeProjects,
    projectMatches: enrichedMatches,
  });

  const geminiAnalysis = input.useGemini === false
    ? { used: false, message: "Gemini analysis disabled for this request." }
    : await analyzeWithGemini(geminiPrompt);

  return {
    githubProfile,
    extractedResumeProjects: resumeProjects,
    matchedProjects: enrichedMatches,
    geminiPrompt,
    geminiAnalysis,
  };
}

module.exports = {
  verifyGithubProjects,
  buildGeminiPrompt,
};
