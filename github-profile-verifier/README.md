# GitHub Profile Verifier

Small Express service for verifying the GitHub profile portion of a resume verifier project.

## What it does

- accepts a GitHub username or profile URL
- validates and normalizes the username
- fetches the public GitHub profile from the GitHub API
- matches resume projects against GitHub repositories
- extracts only important files and compact keywords to keep LLM tokens low
- optionally sends the compact project evidence to Gemini for final verification

## Setup

```bash
npm install
copy .env.example .env
npm start
```

## Environment variables

- `PORT`: server port, defaults to `4000`
- `GITHUB_TOKEN`: optional GitHub personal access token for higher rate limits
- `GEMINI_API_KEY`: optional Gemini API key for AI-based project verification
- `GEMINI_MODEL`: optional Gemini model override

## API

### Health check

`GET /health`

### Verify a GitHub profile

`POST /api/verify/github`

Request body:

```json
{
  "profileUrl": "https://github.com/octocat"
}
```

or

```json
{
  "username": "octocat"
}
```

Successful response:

```json
{
  "success": true,
  "verified": true,
  "username": "octocat",
  "profileUrl": "https://github.com/octocat",
  "profileImage": "https://...",
  "name": "The Octocat",
  "bio": null,
  "company": "@github",
  "location": "San Francisco",
  "publicRepos": 8,
  "publicGists": 8,
  "followers": 100,
  "following": 9,
  "accountCreatedAt": "2011-01-25T18:44:36Z",
  "accountUpdatedAt": "2026-01-01T00:00:00Z"
}
```

### Verify resume projects against GitHub and Gemini

`POST /api/verify/projects`

Request body:

```json
{
  "profileUrl": "https://github.com/octocat",
  "resumeText": "PROJECTS\nPortfolio Builder - Built with React, Node.js and MongoDB\nWeather App - Uses Express and OpenWeather API",
  "resumeProjects": [
    {
      "name": "Portfolio Builder",
      "description": "Full stack portfolio generator",
      "technologies": ["React", "Node.js", "MongoDB"]
    }
  ],
  "useGemini": true
}
```

Response shape:

```json
{
  "success": true,
  "githubProfile": {
    "username": "octocat"
  },
  "extractedResumeProjects": [
    {
      "name": "Portfolio Builder",
      "keywords": ["portfolio", "react", "node"]
    }
  ],
  "matchedProjects": [
    {
      "resumeProject": {
        "name": "Portfolio Builder"
      },
      "matchScore": 11,
      "repo": {
        "name": "portfolio-builder",
        "htmlUrl": "https://github.com/octocat/portfolio-builder"
      },
      "deploymentCheck": {
        "checked": true,
        "working": true,
        "status": 200
      },
      "importantFiles": [
        {
          "fileName": "package.json",
          "keywords": ["react", "express", "mongodb", "dev", "start"]
        }
      ]
    }
  ],
  "geminiPrompt": "...",
  "geminiAnalysis": {
    "used": false,
    "message": "Set GEMINI_API_KEY to enable Gemini-based verification."
  }
}
```

What this route does:

- extracts project entries from `resumeText`
- merges them with structured `resumeProjects`
- fetches GitHub repos for the profile
- matches likely repos for each resume project
- reads only important files like `README`, `package.json`, `requirements.txt`, `pom.xml`, `Dockerfile`
- sends a compact evidence payload to Gemini instead of full repository files

## Testing

```bash
npm test
```

The test suite covers both the service logic and route-level API behavior with mocked network calls.
