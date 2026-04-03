const { buildGithubHeaders } = require("./githubVerifier");

const GITHUB_API_BASE_URL = "https://api.github.com";

/**
 * Highly optimized function to get total commits using the 'Link' header trick.
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
 * Fetches the count of commits made in the last 6 months.
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

/**
 * Helper to fetch all repositories for a user
 */
async function fetchAllUserRepos(username) {
  const url = `${GITHUB_API_BASE_URL}/users/${username}/repos?per_page=100&sort=updated`;
  const response = await fetch(url, { headers: buildGithubHeaders() });
  if (!response.ok) return [];
  return response.json();
}

/**
 * Checks if a repository matches a specific tech stack/skill keyword.
 * Looks at the primary language, GitHub topics, repo name, and description.
 */
function doesRepoMatchSkill(repo, skill) {
  const normalizedSkill = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // 1. Check Primary Language
  if (repo.language && repo.language.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedSkill) {
    return true;
  }

  // 2. Check Topics (e.g., tags on GitHub)
  if (repo.topics && repo.topics.some(t => t.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedSkill)) {
    return true;
  }

  // 3. Check Repo Name and Description (fallback)
  const nameMatch = repo.name.toLowerCase().includes(normalizedSkill);
  const descMatch = repo.description && repo.description.toLowerCase().includes(normalizedSkill);
  
  return nameMatch || descMatch;
}

/**
 * MAIN EXPORT: Analyzes total and recent commits for each tech stack across ALL repos.
 * * @param {string} username - GitHub username
 * @param {string[]} resumeSkills - Array of skills (e.g., ["React", "Node.js", "Java"])
 * @returns {Object} - Aggregated stats ready for Gemini API
 */
async function analyzeTechStackCommits(username, resumeSkills) {
  try {
    // 1. Fetch all repositories
    const allRepos = await fetchAllUserRepos(username);
    
    // 2. Initialize our results object
    const techStackStats = {};
    resumeSkills.forEach(skill => {
      techStackStats[skill] = {
        totalCommits: 0,
        lastSixMonthsCommits: 0,
        reposAnalyzed: 0 // Helpful to know how many repos contributed to this score
      };
    });

    // 3. Create a map of repo commit stats to avoid fetching the same repo twice
    // (A single repo might use both "React" and "Node.js")
    const repoCommitCache = {};

    // 4. Map and Aggregate Data
    for (const skill of resumeSkills) {
      // Find all repos that use this skill
      const matchingRepos = allRepos.filter(repo => doesRepoMatchSkill(repo, skill));

      for (const repo of matchingRepos) {
        // Fetch commits if we haven't already analyzed this repo in this run
        if (!repoCommitCache[repo.name]) {
          const [total, recent] = await Promise.all([
            getTotalCommits(username, repo.name),
            getRecentCommits(username, repo.name)
          ]);
          repoCommitCache[repo.name] = { total, recent };
        }

        // Add this repo's stats to the overall Tech Stack score
        techStackStats[skill].totalCommits += repoCommitCache[repo.name].total;
        techStackStats[skill].lastSixMonthsCommits += repoCommitCache[repo.name].recent;
        techStackStats[skill].reposAnalyzed += 1;
      }
    }

    return {
      success: true,
      username,
      techStackAnalysis: techStackStats
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      techStackAnalysis: {}
    };
  }
}

module.exports = {
  analyzeTechStackCommits
};