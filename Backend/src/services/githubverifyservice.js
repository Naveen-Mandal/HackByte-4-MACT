const GITHUB_API_BASE_URL = "https://api.github.com";

const RESERVED_PATHS = new Set([
  "features",
  "enterprise",
  "topics",
  "collections",
  "trending",
  "events",
  "sponsors",
  "settings",
  "login",
  "join",
  "marketplace",
  "readme",
  "notifications",
  "new",
  "organizations",
  "codespaces",
  "issues",
  "pulls",
  "explore",
]);

const SECTION_KEYWORDS = [
  "project",
  "projects",
  "academic projects",
  "personal projects",
  "key projects",
  "selected projects",
];

const IMPORTANT_FILE_PATTERNS = [
  /^readme(?:\..+)?$/i,
  /^package\.json$/i,
  /^requirements\.txt$/i,
  /^pyproject\.toml$/i,
  /^pom\.xml$/i,
  /^build\.gradle(?:\.kts)?$/i,
  /^dockerfile$/i,
  /^composer\.json$/i,
];

const TECHNOLOGY_PATTERNS = [
  "react",
  "next",
  "node",
  "express",
  "mongodb",
  "postgres",
  "mysql",
  "redis",
  "typescript",
  "javascript",
  "python",
  "django",
  "flask",
  "fastapi",
  "java",
  "spring",
  "kotlin",
  "docker",
  "kubernetes",
  "aws",
  "firebase",
  "tailwind",
  "vite",
  "graphql",
  "rest",
  "jwt",
];

const MAX_CODE_SEARCH_KEYWORDS = 6;
const MAX_CODE_SEARCH_RESULTS_PER_KEYWORD = 5;
const MAX_FILES_TO_INSPECT = 10;
const MAX_SNIPPETS_PER_FILE = 3;
const MAX_FILE_CONTENT_CHARS = 120000;

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toKeywords(parts = []) {
  const text = parts.filter(Boolean).join(" ").toLowerCase();
  const tokens = text.match(/[a-z][a-z0-9.+#-]{1,29}/g) || [];
  const stopWords = new Set([
    "with",
    "using",
    "built",
    "project",
    "projects",
    "that",
    "this",
    "from",
    "into",
    "have",
    "your",
    "their",
    "over",
    "under",
    "about",
    "application",
    "system",
    "platform",
    "website",
    "based",
  ]);

  return [...new Set(tokens.filter((token) => !stopWords.has(token)).slice(0, 15))];
}

function extractGithubUsername(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const directUsernameMatch = trimmedValue.match(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i);
  if (directUsernameMatch) {
    return trimmedValue;
  }

  // Attempt to extract from embedded github.com URLs within larger text
  const githubUrlMatch = trimmedValue.match(/(?:github\.com|github\.io)\/([a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38})/i);
  if (githubUrlMatch) {
      return githubUrlMatch[1];
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const validHosts = new Set(["github.com", "www.github.com"]);

    if (!validHosts.has(parsedUrl.hostname.toLowerCase())) {
      return null;
    }

    const [firstSegment] = parsedUrl.pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.trim());

    if (!firstSegment || RESERVED_PATHS.has(firstSegment.toLowerCase())) {
      return null;
    }

    const profileUsernameMatch = firstSegment.match(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i);
    return profileUsernameMatch ? firstSegment : null;
  } catch {
    return null;
  }
}

function buildGithubHeaders(includeTextMatch = false) {
  const headers = {
    Accept: includeTextMatch ? "application/vnd.github.text-match+json" : "application/vnd.github+json",
    "User-Agent": "resume-verifier",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
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

async function verifyGithubProfile(username) {
  const response = await fetch(`${GITHUB_API_BASE_URL}/users/${username}`, {
    headers: buildGithubHeaders(),
  });

  if (response.status === 404) {
    const error = new Error("GitHub profile not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!response.ok) {
    const error = new Error("GitHub API request failed.");
    error.statusCode = response.status;
    throw error;
  }

  const profile = await response.json();

  return {
    verified: true,
    username: profile.login,
    profileUrl: profile.html_url,
    profileImage: profile.avatar_url,
    name: profile.name,
    bio: profile.bio,
    company: profile.company,
    location: profile.location,
    publicRepos: profile.public_repos,
    publicGists: profile.public_gists,
    followers: profile.followers,
    following: profile.following,
    accountCreatedAt: profile.created_at,
    accountUpdatedAt: profile.updated_at,
  };
}

function normalizeProject(project) {
  if (!project || typeof project !== "object") {
    return null;
  }

  const name = normalizeWhitespace(String(project.name || ""));
  const description = normalizeWhitespace(String(project.description || ""));
  const githubLink = normalizeWhitespace(String(project.githubLink || ""));     
  const technologies = Array.isArray(project.technologies)
    ? project.technologies.map((value) => normalizeWhitespace(String(value))).filter(Boolean)
    : [];
  const claimedPoints = Array.isArray(project.claimedPoints)
    ? project.claimedPoints.map((value) => normalizeWhitespace(String(value))).filter(Boolean)
    : [];

  if (!name && !description) {
    return null;
  }

  return {
    name: name || description.split(" ").slice(0, 4).join(" "),
    description,
    githubLink,
    technologies,
    claimedPoints,
    keywords: toKeywords([name, description, technologies.join(" ")]),
    source: "structured",
  };
}

function looksLikeHeading(line) {
  const normalized = line.toLowerCase().replace(/[:|]/g, "").trim();
  return SECTION_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function parseProjectLine(line) {
  const cleaned = normalizeWhitespace(line.replace(/^[-*•]\s*/, ""));
  if (!cleaned || cleaned.length < 6) {
    return null;
  }

  const [namePart, ...rest] = cleaned.split(/\s[-|:]\s/);
  const name = normalizeWhitespace(namePart || "");
  const description = normalizeWhitespace(rest.join(" - "));

  if (!name) {
    return null;
  }

  return {
    name,
    description,
    githubLink: "",
    technologies: [],
    claimedPoints: [],
    keywords: toKeywords([name, description]),
    source: "resumeText",
  };
}

function extractProjectsFromResumeText(resumeText) {
  if (!resumeText || typeof resumeText !== "string") {
    return [];
  }

  const lines = resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const projects = [];
  let inProjectSection = false;

  for (const line of lines) {
    if (looksLikeHeading(line)) {
      inProjectSection = true;
      continue;
    }

    // Exit section if we encounter a likely heading (all UPPERCASE with optional spaces, length up to 30)
    if (inProjectSection && /^[A-Z\s]{4,30}$/.test(line)) {
      inProjectSection = false;
    }

    if (!inProjectSection) {
      continue;
    }

    const parsed = parseProjectLine(line);
    if (parsed) {
      projects.push(parsed);
    }
  }

  return projects.slice(0, 8);
}

function extractResumeProjects({ resumeText, resumeProjects }) {
  const textProjects = extractProjectsFromResumeText(resumeText);
  const structuredProjects = Array.isArray(resumeProjects)
    ? resumeProjects.map(normalizeProject).filter(Boolean)
    : [];

  return [...structuredProjects, ...textProjects].slice(0, 10);
}

function isImportantFile(fileName) {
  return IMPORTANT_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

function extractPackageJsonKeywords(content) {
  try {
    const pkg = JSON.parse(content);
    return {
      dependencies: Object.keys(pkg.dependencies || {}).slice(0, 12),
      devDependencies: Object.keys(pkg.devDependencies || {}).slice(0, 8),
      scripts: Object.keys(pkg.scripts || {}).slice(0, 8),
    };
  } catch {
    return null;
  }
}

function extractRequirementsKeywords(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.split(/[<>=~!]/)[0].trim())
    .slice(0, 15);
}

function extractPomKeywords(content) {
  const matches = [...content.matchAll(/<artifactId>([^<]+)<\/artifactId>/g)];
  return matches.map((match) => match[1]).slice(0, 15);
}

function extractReadmeKeywords(content) {
  const lowered = content.toLowerCase();
  return TECHNOLOGY_PATTERNS.filter((term) => lowered.includes(term)).slice(0, 12);
}

function summarizeImportantFile(fileName, content) {
  const trimmed = content.slice(0, 12000);
  const summary = {
    fileName,
    keywords: [],
  };

  if (/^package\.json$/i.test(fileName)) {
    const packageSummary = extractPackageJsonKeywords(trimmed);
    if (packageSummary) {
      summary.package = packageSummary;
      summary.keywords = [
        ...packageSummary.dependencies,
        ...packageSummary.devDependencies,
        ...packageSummary.scripts,
      ].slice(0, 15);
      return summary;
    }
  }

  if (/^requirements\.txt$/i.test(fileName)) {
    summary.keywords = extractRequirementsKeywords(trimmed);
    return summary;
  }

  if (/^pom\.xml$/i.test(fileName) || /^build\.gradle(?:\.kts)?$/i.test(fileName)) {
    summary.keywords = extractPomKeywords(trimmed);
    return summary;
  }

  if (/^readme/i.test(fileName)) {
    summary.keywords = extractReadmeKeywords(trimmed);
    summary.preview = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 5)
      .join(" ")
      .slice(0, 300);
    return summary;
  }

  const keywordMatches = TECHNOLOGY_PATTERNS.filter((term) =>
    trimmed.toLowerCase().includes(term),
  );
  summary.keywords = keywordMatches.slice(0, 12);
  return summary;
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

async function fetchGithubRepos(username) {
  return fetchJson(`${GITHUB_API_BASE_URL}/users/${username}/repos?per_page=100&sort=updated`, {
    headers: buildGithubHeaders(),
  });
}

async function fetchSingleRepo(owner, repo) {
  try {
    return await fetchJson(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`, {
      headers: buildGithubHeaders(),
    });
  } catch (error) {
    return null;
  }
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

async function fetchRepoFileContent(owner, repo, path) {
  const file = await fetchRepoContents(owner, repo, path);

  if (!file?.content || Array.isArray(file)) {
    return null;
  }

  return decodeGithubContent(file.content);
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
    .slice(0, 2);

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

async function searchRepoForImplementationDetails(owner, repo, projectKeywords) {
  if (!projectKeywords || projectKeywords.length === 0) {
    return [];
  }

  const candidateKeywords = projectKeywords
    .filter((k) => k.length > 2)
    .filter((k, i, arr) => arr.indexOf(k) === i)
    .slice(0, MAX_CODE_SEARCH_KEYWORDS);

  if (candidateKeywords.length === 0) {
    return [];
  }

  const fileMatches = new Map();

  for (const keyword of candidateKeywords) {
    const url = `${GITHUB_API_BASE_URL}/search/code?q=${encodeURIComponent(`"${keyword}"`)}+repo:${owner}/${repo}&per_page=${MAX_CODE_SEARCH_RESULTS_PER_KEYWORD}`;

    try {
      const data = await fetchJson(url, { headers: buildGithubHeaders(true) });
      const items = Array.isArray(data.items) ? data.items : [];

      for (const item of items) {
        if (!item?.path) {
          continue;
        }

        const existing = fileMatches.get(item.path) || {
          fileName: item.path,
          matchedKeywords: new Set(),
          textMatches: [],
        };

        existing.matchedKeywords.add(keyword);
        existing.textMatches.push(
          ...(item.text_matches || [])
            .map((match) => match.fragment || "")
            .filter(Boolean)
            .slice(0, 2),
        );

        fileMatches.set(item.path, existing);
      }
    } catch {
      // Ignore individual keyword search failures so one query does not block the repo analysis.
    }
  }

  if (fileMatches.size === 0) {
    return [];
  }

  const implementationDetails = [];

  for (const fileMatch of [...fileMatches.values()].slice(0, MAX_FILES_TO_INSPECT)) {
    try {
      const content = await fetchRepoFileContent(owner, repo, fileMatch.fileName);

      if (!content || content.length > MAX_FILE_CONTENT_CHARS || content.includes("\u0000")) {
        continue;
      }

      implementationDetails.push({
        fileName: fileMatch.fileName,
        matchedKeywords: [...fileMatch.matchedKeywords],
        snippets: extractCodeSnippetsForKeywords(content, [...fileMatch.matchedKeywords]).slice(0, MAX_SNIPPETS_PER_FILE),
        searchFragments: [...new Set(fileMatch.textMatches)].slice(0, 3),
      });
    } catch {
      // Ignore file-level failures so a single unreadable file does not fail verification.
    }
  }

  return implementationDetails.filter((item) => item.snippets.length > 0 || item.searchFragments.length > 0);
}

function extractCodeSnippetsForKeywords(content, keywords) {
  const lines = content.split(/\r?\n/);
  const snippets = [];
  const seenRanges = new Set();

  for (const keyword of keywords) {
    const loweredKeyword = keyword.toLowerCase();

    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index].toLowerCase().includes(loweredKeyword)) {
        continue;
      }

      const start = Math.max(0, index - 4);
      const end = Math.min(lines.length - 1, index + 6);
      const rangeKey = `${start}:${end}`;

      if (seenRanges.has(rangeKey)) {
        continue;
      }

      seenRanges.add(rangeKey);
      snippets.push({
        keyword,
        lineStart: start + 1,
        lineEnd: end + 1,
        snippet: lines.slice(start, end + 1).join("\n").slice(0, 2500),
      });

      if (snippets.length >= MAX_SNIPPETS_PER_FILE) {
        return snippets;
      }

      break;
    }
  }

  return snippets;
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
      implementationDetails: match.implementationDetails,
    })),
  };

  return [
    "You are verifying whether resume projects appear to be real and working based on GitHub evidence.",
    "Pay special attention to 'implementationDetails' which contains repo-wide code search hits plus surrounding code snippets fetched from matched files.",
    "A claim should be marked 'accepted' only when the snippets materially support that the feature was actually implemented, not merely mentioned in a dependency list or README.",
    "Use only the supplied compact evidence.",
    "Return JSON with keys: overallVerdict, confidence, summary, projectAssessments.",
    "Each projectAssessments item must include:",
    "- resumeProject (string)",
    "- matchedRepo (string)",
    "- claimsVerification (array of objects with keys: claim (string, e.g. 'Used JWT for auth'), status ('accepted', 'missing', 'contradicted'), actualContent (string, e.g. 'Found jsonwebtoken in package.json and implementation details'))",
    "- verdict (string)",
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

  const profilePromise = verifyGithubProfile(normalizedUsername);
  const reposPromise = resumeProjects.length > 0 ? fetchGithubRepos(normalizedUsername) : Promise.resolve([]);

  const [githubProfile, repos] = await Promise.all([profilePromise, reposPromise]);

  if (resumeProjects.length === 0) {
    return {
      githubProfile,
      extractedResumeProjects: [],
      matchedProjects: [],
      geminiPrompt: "",
      geminiAnalysis: { used: false, message: "No projects to verify." }
    };
  }

  const scoredMatches = await Promise.all(
    resumeProjects.map(async (project) => {
      let matchedRepo = null;
      let matchedScore = 0;
      let usedProvidedLink = false;

      // 1. Try to use provided GitHub URL
      if (project.githubLink) {
        const urlMatch = project.githubLink.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
        if (urlMatch) {
          const owner = urlMatch[1];
          const repoName = urlMatch[2].replace(/\.git$/, "");
          const directRepo = await fetchSingleRepo(owner, repoName);
          if (directRepo) {
            matchedRepo = directRepo;
            matchedScore = 100; // Perfect match since it's the exact link
            usedProvidedLink = true;
          }
        }
      }

      // 2. Fallback to fuzzy search among user's repos
      if (!matchedRepo) {
        const bestRepo = repos
          .map((repo) => ({
            repo,
            score: scoreProjectAgainstRepo(project, repo),
          }))
          .sort((left, right) => right.score - left.score)[0];
        
        if (bestRepo && bestRepo.score > 0) {
          matchedRepo = bestRepo.repo;
          matchedScore = bestRepo.score;
        }
      }

      return {
        resumeProject: project,
        repo: matchedRepo,
        matchScore: matchedScore,
        usedProvidedLink
      };
    })
  );

  const filteredMatches = scoredMatches.filter((match) => match.repo);

  const enrichedMatches = [];

  for (const match of filteredMatches.slice(0, 5)) {
    const owner = match.repo.owner.login;
    const repoName = match.repo.name;

    const importantFiles = await collectImportantFileSummaries(owner, repoName);  
    const deploymentCheck = await checkDeployment(match.repo.homepage);
    
    // Convert claimed points to keywords and combine with explicitly mentioned tech
    const searchTerms = [
      ...match.resumeProject.keywords,
      ...match.resumeProject.claimedPoints.map((claim) => toKeywords([claim])).flat()
    ];

    const implementationDetails = await searchRepoForImplementationDetails(     
      owner,
      repoName,
      [...new Set(searchTerms)]
    );

    // Wait a brief moment to avoid hitting GitHub API secondary rate limits on code search
    await new Promise((resolve) => setTimeout(resolve, 800));

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
      implementationDetails,
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

export  { 
  buildGeminiPrompt,
  extractGithubUsername,
  verifyGithubProfile,
  verifyGithubProjects,
 };
