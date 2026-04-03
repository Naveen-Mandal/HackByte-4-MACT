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

async function analyzeSkillDecay(username, claimedSkills) {
    if (!username || !claimedSkills || claimedSkills.length === 0) {
        return [];
    }

    // 1. Fetch public repos
    const reposUrl = `${GITHUB_API_BASE_URL}/users/${username}/repos?per_page=100&sort=updated`;
    const repos = await fetchJsonSafely(reposUrl);

    if (!repos || !Array.isArray(repos)) {
        return [];
    }

    // A map to track the latest pushed_at date for each language/technology
    const technologyLatestUpdate = new Map();

    for (const repo of repos) {
        if (!repo.language) continue;
        
        const lang = repo.language.toLowerCase();
        const pushedAt = new Date(repo.pushed_at).getTime();

        if (!technologyLatestUpdate.has(lang)) {
            technologyLatestUpdate.set(lang, repo.pushed_at);
        } else {
            const existingTime = new Date(technologyLatestUpdate.get(lang)).getTime();
            if (pushedAt > existingTime) {
                technologyLatestUpdate.set(lang, repo.pushed_at);
            }
        }
    }

    const todayDate = new Date().getTime();
    const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

    const skillDecayReport = [];

    // 2. Match claimed skills against found repos
    for (const claimedSkill of claimedSkills) {
        const skillFormatted = claimedSkill.toLowerCase();
        
        // Find if this skill is tracked in our tech map (exact or substring match)
        let matchedLang = null;
        for (const [repoLang, lastUpdate] of technologyLatestUpdate.entries()) {
            if (skillFormatted.includes(repoLang) || repoLang.includes(skillFormatted)) {
                matchedLang = repoLang;
                break;
            }
        }

        if (matchedLang) {
            const lastUpdateDateStr = technologyLatestUpdate.get(matchedLang);
            const monthsAgo = Math.floor((todayDate - new Date(lastUpdateDateStr).getTime()) / MS_PER_MONTH);
            
            if (monthsAgo >= 12) {
                skillDecayReport.push({
                    skill: claimedSkill,
                    lastUsed: lastUpdateDateStr,
                    monthsAgo: monthsAgo,
                    decayFlag: `Claims ${claimedSkill} experience — last commit involving it was ~${monthsAgo} months ago.`
                });
            } else {
                skillDecayReport.push({
                    skill: claimedSkill,
                    lastUsed: lastUpdateDateStr,
                    monthsAgo: monthsAgo,
                    decayFlag: "Active"
                });
            }
        } else {
            // Not found in primary language tags
            skillDecayReport.push({
                skill: claimedSkill,
                lastUsed: null,
                monthsAgo: null,
                decayFlag: `No recent public commits found primarily using ${claimedSkill}.`
            });
        }
    }

    return skillDecayReport;
}

module.exports = {
    analyzeSkillDecay
};
