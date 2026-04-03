const { buildGithubHeaders } = require("./githubVerifier");

const GITHUB_API_BASE_URL = "https://api.github.com";

// --- COMMIT COUNTING LOGIC ---

/**
 * Highly optimized function to get total commits using the 'Link' header trick.
 * Prevents hitting rate limits by not downloading every commit.
 */
async function getTotalCommits(owner, repo) {
  const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/commits?per_page=1`;
  const response = await fetch(url, { headers: buildGithubHeaders() });
  
  if (response.status === 404 || response.status === 409) return 0; // Not found or empty

  const linkHeader = response.headers.get("link");
  if (!linkHeader) {
    const data = await response.json();
    return data.length || 0;
  }

  const lastPageMatch = linkHeader.match(/&page=(\d+)>; rel="last"/);
  return lastPageMatch && lastPageMatch[1] ? parseInt(lastPageMatch[1], 10) : 0;
}

/**
 * Fetches the count of commits made in the exact last 6 months.
 */
async function getRecentCommits(owner, repo) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sinceISO = sixMonthsAgo.toISOString();

  let recentCommitsCount = 0;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/commits?since=${sinceISO}&per_page=100&page=${page}`;
    const response = await fetch(url, { headers: buildGithubHeaders() });

    if (!response.ok) break;

    const data = await response.json();
    recentCommitsCount += data.length;

    if (data.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return recentCommitsCount;
}

// --- REPOSITORY MATCHING LOGIC ---

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Uses your team's scoring logic to find if a GitHub repo matches a Resume Project
 */
function scoreProjectAgainstRepo(resumeProject, repo) {
  const projectTerms = new Set([
    ...normalizeText(resumeProject.name).split(" ").filter(Boolean),
    ...(resumeProject.keywords || []),
  ]);
  const repoTerms = new Set([
    ...normalizeText(repo.name).split(" ").filter(Boolean),
    ...normalizeText(repo.description).split(" ").filter(Boolean),
    ...(repo.topics || []),
  ]);

  let score = 0;

  for (const term of projectTerms) {
    if (repoTerms.has(term)) score += 2;
  }

  if (normalizeText(repo.name).includes(normalizeText(resumeProject.name))) score += 5;
  
  if ((repo.homepage || "").toLowerCase().includes(normalizeText(resumeProject.name).replace(/\s+/g, ""))) {
    score += 3;
  }

  return score;
}

/**
 * Fetches all repositories for a user
 */
async function fetchAllUserRepos(username) {
  const url = `${GITHUB_API_BASE_URL}/users/${username}/repos?per_page=100&sort=updated`;
  const response = await fetch(url, { headers: buildGithubHeaders() });
  if (!response.ok) return [];
  return response.json();
}

// --- MAIN EXECUTION ---

/**
 * Analyzes commit stats specifically for projects mentioned in the resume.
 * * @param {string} username - GitHub username
 * @param {Array} resumeProjects - Array of extracted project objects: [{ name: "TravelWith", keywords: ["react", "node"] }]
 * @returns {Object} - Results ready for Gemini
 */
async function analyzeResumeProjectsCommits(username, resumeProjects) {
  try {
    const allRepos = await fetchAllUserRepos(username);
    const analyzedProjects = [];

    for (const project of resumeProjects) {
      // 1. Find the best matching GitHub repository for this specific resume project
      const scoredRepos = allRepos.map(repo => ({
        repo,
        score: scoreProjectAgainstRepo(project, repo)
      })).sort((a, b) => b.score - a.score);

      const bestMatch = scoredRepos.length > 0 && scoredRepos[0].score > 0 ? scoredRepos[0] : null;

      if (!bestMatch) {
        // Project is on resume, but no matching code exists on GitHub
        analyzedProjects.push({
          resumeProjectName: project.name,
          matchedRepoName: null,
          matchScore: 0,
          stats: {
            totalCommits: 0,
            lastSixMonthsCommits: 0
          }
        });
        continue;
      }

      // 2. Fetch commit stats for the matched repository
      const [total, recent] = await Promise.all([
        getTotalCommits(username, bestMatch.repo.name),
        getRecentCommits(username, bestMatch.repo.name)
      ]);

      // 3. Format the data for this project
      analyzedProjects.push({
        resumeProjectName: project.name,
        matchedRepoName: bestMatch.repo.name,
        matchScore: bestMatch.score,
        stats: {
          totalCommits: total,
          lastSixMonthsCommits: recent
        }
      });
    }

    return {
      success: true,
      username,
      resumeProjectAnalysis: analyzedProjects
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      resumeProjectAnalysis: []
    };
  }
}

module.exports = {
  analyzeResumeProjectsCommits
};