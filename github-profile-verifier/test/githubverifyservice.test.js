const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildGeminiPrompt,
  extractGithubUsername,
  verifyGithubProfile,
  verifyGithubProjects,
} = require("../src/services/githubverifyservice");

function createJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    },
  };
}

test("extractGithubUsername returns a username from a GitHub profile URL", () => {
  assert.equal(extractGithubUsername("https://github.com/octocat"), "octocat");
});

test("extractGithubUsername rejects non-profile GitHub URLs", () => {
  assert.equal(extractGithubUsername("https://github.com/topics/javascript"), null);
});

test("extractGithubUsername accepts plain usernames", () => {
  assert.equal(extractGithubUsername("octocat"), "octocat");
});

test("verifyGithubProfile returns normalized profile data", async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    assert.equal(url, "https://api.github.com/users/octocat");
    return createJsonResponse(200, {
      login: "octocat",
      html_url: "https://github.com/octocat",
      avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
      name: "The Octocat",
      bio: "Mascot",
      company: "@github",
      location: "San Francisco",
      public_repos: 8,
      public_gists: 8,
      followers: 100,
      following: 9,
      created_at: "2011-01-25T18:44:36Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
  };

  try {
    const profile = await verifyGithubProfile("octocat");
    assert.equal(profile.username, "octocat");
    assert.equal(profile.verified, true);
    assert.equal(profile.publicRepos, 8);
  } finally {
    global.fetch = originalFetch;
  }
});

test("verifyGithubProfile throws a 404 for missing profiles", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => createJsonResponse(404, { message: "Not Found" });

  try {
    await assert.rejects(
      () => verifyGithubProfile("missing-user"),
      (error) => error.statusCode === 404 && error.message === "GitHub profile not found.",
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("buildGeminiPrompt creates a compact prompt payload", () => {
  const prompt = buildGeminiPrompt({
    githubProfile: {
      username: "octocat",
      name: "The Octocat",
      publicRepos: 8,
      followers: 100,
    },
    resumeProjects: [
      {
        name: "Portfolio Builder",
        description: "Full stack portfolio generator",
        technologies: ["React", "Node.js"],
        keywords: ["react", "node", "portfolio"],
      },
    ],
    projectMatches: [
      {
        resumeProject: { name: "Portfolio Builder" },
        matchScore: 11,
        repo: {
          name: "portfolio-builder",
          description: "Portfolio generator",
          language: "JavaScript",
          topics: ["react", "node"],
          homepage: "https://portfolio.example.com",
        },
        deploymentCheck: { checked: true, working: true, status: 200 },
        importantFiles: [{ fileName: "package.json", keywords: ["react", "vite"] }],
      },
    ],
  });

  assert.match(prompt, /overallVerdict/);
  assert.match(prompt, /Portfolio Builder/);
  assert.match(prompt, /package\.json/);
});

test("verifyGithubProjects matches resume projects and skips Gemini when disabled", async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push(String(url));

    if (String(url) === "https://api.github.com/users/octocat") {
      return createJsonResponse(200, {
        login: "octocat",
        html_url: "https://github.com/octocat",
        avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
        name: "The Octocat",
        bio: "Mascot",
        company: "@github",
        location: "San Francisco",
        public_repos: 8,
        public_gists: 8,
        followers: 100,
        following: 9,
        created_at: "2011-01-25T18:44:36Z",
        updated_at: "2026-01-01T00:00:00Z",
      });
    }

    if (String(url) === "https://api.github.com/users/octocat/repos?per_page=100&sort=updated") {
      assert.equal(options.headers["User-Agent"], "resume-verifier");
      return createJsonResponse(200, [
        {
          name: "portfolio-builder",
          html_url: "https://github.com/octocat/portfolio-builder",
          description: "Portfolio builder made with React and Node",
          language: "JavaScript",
          topics: ["react", "portfolio", "node"],
          homepage: "https://portfolio-builder.example.com",
          updated_at: "2026-04-01T10:00:00Z",
          stargazers_count: 12,
        },
        {
          name: "weather-app",
          html_url: "https://github.com/octocat/weather-app",
          description: "Weather app using Express",
          language: "JavaScript",
          topics: ["express", "weather"],
          homepage: "",
          updated_at: "2026-03-01T10:00:00Z",
          stargazers_count: 4,
        },
      ]);
    }

    if (String(url) === "https://api.github.com/repos/octocat/portfolio-builder/contents") {
      return createJsonResponse(200, [
        { type: "file", name: "README.md", path: "README.md" },
        { type: "file", name: "package.json", path: "package.json" },
        { type: "file", name: "notes.txt", path: "notes.txt" },
      ]);
    }

    if (String(url) === "https://api.github.com/repos/octocat/portfolio-builder/contents/README.md") {
      return createJsonResponse(200, {
        content: Buffer.from(
          "Portfolio Builder built with React, Node, Express and MongoDB",
          "utf8",
        ).toString("base64"),
      });
    }

    if (String(url) === "https://api.github.com/repos/octocat/portfolio-builder/contents/package.json") {
      return createJsonResponse(200, {
        content: Buffer.from(
          JSON.stringify({
            dependencies: {
              react: "^19.0.0",
              express: "^5.0.0",
              mongodb: "^6.0.0",
            },
            scripts: {
              dev: "vite",
              start: "node server.js",
            },
          }),
          "utf8",
        ).toString("base64"),
      });
    }

    if (String(url) === "https://portfolio-builder.example.com") {
      return {
        ok: true,
        status: 200,
        url: "https://portfolio-builder.example.com",
      };
    }

    throw new Error(`Unexpected fetch call: ${url}`);
  };

  try {
    const result = await verifyGithubProjects({
      username: "octocat",
      resumeText: "PROJECTS\nPortfolio Builder - Full stack portfolio generator with React and Node.js",
      useGemini: false,
    });

    assert.equal(result.githubProfile.username, "octocat");
    assert.equal(result.extractedResumeProjects.length, 1);
    assert.equal(result.matchedProjects.length, 1);
    assert.equal(result.matchedProjects[0].repo.name, "portfolio-builder");
    assert.equal(result.matchedProjects[0].deploymentCheck.working, true);
    assert.equal(result.matchedProjects[0].importantFiles.length, 2);
    assert.equal(result.geminiAnalysis.used, false);
    assert.match(result.geminiPrompt, /Portfolio Builder/);
    assert.ok(calls.includes("https://api.github.com/repos/octocat/portfolio-builder/contents"));
  } finally {
    global.fetch = originalFetch;
  }
});

test("verifyGithubProjects rejects invalid input before any API call", async () => {
  await assert.rejects(
    () =>
      verifyGithubProjects({
        username: "octocat",
        resumeText: "",
        resumeProjects: [],
        useGemini: false,
      }),
    (error) =>
      error.statusCode === 400 &&
      error.message === "Provide resumeText or resumeProjects with at least one project.",
  );
});
