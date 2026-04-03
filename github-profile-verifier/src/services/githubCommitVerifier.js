const GITHUB_API_BASE_URL = "https://api.github.com";

function buildGithubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "resume-verifier",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function fetchJsonSafely(url) {
  try {
    const response = await fetch(url, { headers: buildGithubHeaders() });
    if (!response.ok) {
        return null;
    }
    const data = await response.json();
    return data;
  } catch(e) {
    return null;
  }
}

async function analyzeCommitsAndContributors(owner, repoName) {
  // 1. Fetch recent commits to analyze patterns and message quality
  const commitsUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repoName}/commits?per_page=15`;
  const commitsParams = await fetchJsonSafely(commitsUrl);
  
  // 2. Fetch contributors to see if they worked alone
  const contributorsUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repoName}/contributors`;
  const contributorsStats = await fetchJsonSafely(contributorsUrl);

  const result = {
      totalRecentCommits: 0,
      commitMessageQuality: "unknown",
      burstPattern: "unknown",
      collaboratorCount: 0,
      builtAlone: true,
      topContributor: null
  };

  if (commitsParams && Array.isArray(commitsParams) && commitsParams.length > 0) {
      result.totalRecentCommits = commitsParams.length;
      
      const messages = commitsParams.map(c => c.commit.message);
      
      // Analyze message quality simply: average length of message
      const avgLength = messages.reduce((acc, curr) => acc + curr.length, 0) / messages.length;
      if (avgLength > 20) result.commitMessageQuality = "good";
      else if (avgLength > 10) result.commitMessageQuality = "average";
      else result.commitMessageQuality = "poor";

      // Analyze burst: if all commits are heavily concentrated in a single day
      const dates = commitsParams.map(c => new Date(c.commit.author.date).toDateString());
      const uniqueDates = new Set(dates);
      
      if (uniqueDates.size === 1 && result.totalRecentCommits > 3) {
          result.burstPattern = "high_burst (all commits on same day)";
      } else if (uniqueDates.size <= 3 && result.totalRecentCommits >= 10) {
          result.burstPattern = "moderate_burst";
      } else {
          result.burstPattern = "healthy_distribution";
      }
  }

  if (contributorsStats && Array.isArray(contributorsStats)) {
      result.collaboratorCount = contributorsStats.length;
      result.builtAlone = contributorsStats.length === 1;
      
      // Assume sorted by contributions (GitHub API default)
      if (contributorsStats.length > 0) {
          result.topContributor = contributorsStats[0].login;
      }
  }

  return result;
}

module.exports = {
  analyzeCommitsAndContributors
};
