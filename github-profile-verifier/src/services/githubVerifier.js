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

module.exports = {
  extractGithubUsername,
  buildGithubHeaders,
  verifyGithubProfile,
};
