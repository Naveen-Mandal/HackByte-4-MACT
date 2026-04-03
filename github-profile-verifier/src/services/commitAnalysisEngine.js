const { buildGithubHeaders } = require("./githubVerifier");

const GITHUB_API_BASE_URL = "https://api.github.com";

// ============================================================================
// 1. HIGH-SPEED COMMIT COUNTER (Zero payload downloads)
// ============================================================================

/**
 * Universal fast commit counter. Uses GitHub's 'Link' header to get counts
 * instantly without downloading the actual commit history.
 */
async function getCommitCount(owner, repo, params = {}) {
  const queryParams = new URLSearchParams({ per_page: '1' });
  if (params.author) queryParams.append('author', params.author);
  if (params.since) queryParams.append('since', params.since);

  const url = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/commits?${queryParams.toString()}`;
  const response = await fetch(url, { headers: buildGithubHeaders() });
  
  if (response.status === 404 || response.status === 409) return 0; // Empty or not found

  const linkHeader = response.headers.get("link");
  if (!linkHeader) {
    const data = await response.json();
    return data.length || 0;
  }

  const lastPageMatch = linkHeader.match(/&page=(\d+)>; rel="last"/);
  return lastPageMatch && lastPageMatch[1] ? parseInt(lastPageMatch[1], 10) : 0;
}

// ============================================================================
// 2. MATCHING UTILITIES
// ============================================================================

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Scores how well a GitHub repository matches a Resume Project claim.
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
  if ((repo.homepage || "").toLowerCase().includes(normalizeText(resumeProject.name).replace(/\s+/g, ""))) score += 3;

  return score;
}

/**
 * Checks if a GitHub repository utilizes a specific skill/tech stack.
 */
function doesRepoMatchSkill(repo, skill) {
  const normalizedSkill = skill.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  if (repo.language && repo.language.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedSkill) return true;
  if (repo.topics && repo.topics.some(t => t.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedSkill)) return true;
  
  const nameMatch = repo.name.toLowerCase().includes(normalizedSkill);
  const descMatch = repo.description && repo.description.toLowerCase().includes(normalizedSkill);
  return nameMatch || descMatch;
}

// ============================================================================
// 3. MAIN UNIFIED ENGINE
// ============================================================================

/**
 * Single pass execution to analyze Projects, Tech Stacks, and Code Ownership.
 * @param {string} username - GitHub username
 * @param {Array} resumeProjects - Array of extracted projects: [{ name: "TravelWith", keywords: [] }]
 * @param {Array} resumeSkills - Array of strings: ["React", "Java", "Docker"]
 */
async function runUnifiedCommitAnalysis(username, resumeProjects = [], resumeSkills = []) {
  try {
    // 1. Fetch ALL repositories exactly ONE time
    const reposResponse = await fetch(`${GITHUB_API_BASE_URL}/users/${username}/repos?per_page=100&sort=updated`, { 
      headers: buildGithubHeaders() 
    });
    if (!reposResponse.ok) throw new Error("Failed to fetch user repositories.");
    const allRepos = await reposResponse.json();

    // 2. Map Projects to Repos & Identify relevant Tech Stack Repos
    const projectMatches = [];
    const reposRequiringAnalysis = new Map(); // Maps repoName -> repoObject
    
    // Process Projects
    for (const project of resumeProjects) {
      const bestRepo = allRepos.map(repo => ({ repo, score: scoreProjectAgainstRepo(project, repo) }))
                               .sort((a, b) => b.score - a.score)[0];
      
      if (bestRepo && bestRepo.score > 0) {
        projectMatches.push({ project, matchedRepo: bestRepo.repo, matchScore: bestRepo.score });
        reposRequiringAnalysis.set(bestRepo.repo.name, bestRepo.repo);
      } else {
        projectMatches.push({ project, matchedRepo: null, matchScore: 0 });
      }
    }

    // Process Skills
    const skillToReposMap = {};
    for (const skill of resumeSkills) {
      skillToReposMap[skill] = allRepos.filter(repo => doesRepoMatchSkill(repo, skill));
      skillToReposMap[skill].forEach(repo => reposRequiringAnalysis.set(repo.name, repo));
    }

    // 3. Fetch Commit Stats ONLY for the required repositories
    const repoCommitCache = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sinceISO = sixMonthsAgo.toISOString();

    // Run parallel fetches for speed
    const analysisPromises = Array.from(reposRequiringAnalysis.values()).map(async (repo) => {
      // Calculate Total repo commits, Candidate's specific commits, and Candidate's recent commits
      const [totalRepoCommits, candidateCommits, recentCandidateCommits] = await Promise.all([
        getCommitCount(repo.owner.login, repo.name), 
        getCommitCount(repo.owner.login, repo.name, { author: username }), 
        getCommitCount(repo.owner.login, repo.name, { author: username, since: sinceISO })
      ]);

      repoCommitCache[repo.name] = {
        isFork: repo.fork,
        totalRepoCommits,
        candidateCommits,
        recentCandidateCommits,
        ownershipPercentage: totalRepoCommits > 0 ? ((candidateCommits / totalRepoCommits) * 100).toFixed(2) : 0
      };
    });

    await Promise.all(analysisPromises);

    // 4. Assemble the Final Comprehensive Payload for Gemini
    
    // A. Assemble Project Results (incorporating Ownership Traps)
    const finalProjectAnalysis = projectMatches.map(match => {
      if (!match.matchedRepo) {
        return {
          resumeProjectName: match.project.name,
          matchedRepoName: null,
          isSuspicious: true,
          reason: "No code found on GitHub matching this project."
        };
      }

      const stats = repoCommitCache[match.matchedRepo.name];
      let isSuspicious = false;
      let reason = null;

      // Ownership Traps logic
      if (stats.isFork && stats.candidateCommits < 5) {
        isSuspicious = true;
        reason = "Project is a fork with virtually no original contributions from the candidate.";
      } else if (stats.totalRepoCommits > 50 && stats.ownershipPercentage < 10) {
        isSuspicious = true;
        reason = `Candidate claims this project but wrote less than 10% of the codebase.`;
      }

      return {
        resumeProjectName: match.project.name,
        matchedRepoName: match.matchedRepo.name,
        matchScore: match.matchScore,
        stats,
        isSuspicious,
        reason
      };
    });

    // B. Assemble Tech Stack Results
    const finalTechStackAnalysis = {};
    for (const skill of resumeSkills) {
      finalTechStackAnalysis[skill] = {
        reposAnalyzed: skillToReposMap[skill].length,
        candidateTotalCommits: 0,
        candidateRecentCommits: 0
      };

      skillToReposMap[skill].forEach(repo => {
        const stats = repoCommitCache[repo.name];
        finalTechStackAnalysis[skill].candidateTotalCommits += stats.candidateCommits;
        finalTechStackAnalysis[skill].candidateRecentCommits += stats.recentCandidateCommits;
      });
    }

    // 5. Return Unified JSON
    return {
      success: true,
      username,
      verificationEngineResults: {
        projects: finalProjectAnalysis,
        skills: finalTechStackAnalysis
      }
    };

  } catch (error) {
    console.error("Unified Engine Error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  runUnifiedCommitAnalysis
};