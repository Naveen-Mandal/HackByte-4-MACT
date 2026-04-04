# VerifAI — Complete Project Spec

## One-Liner
**"VerifAI reads the resume, checks the code, and verifies coding profiles — and tells you when the candidate is lying."**

---

## What You're Building

### VerifAI Web Dashboard
A website where recruiters upload a candidate's resume PDF and get a comprehensive fact-check report analyzing their ATS compatibility, GitHub repositories, and coding platform profiles (LeetCode, Codeforces, CodeChef).

---

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│                                                     │
│  React + Vite Web App                                │
│  ┌─────────────────┐                                 │
│  │ Resume Upload    │                                 │
│  │ Fact-Check Report│                                 │
│  │ ATS Score        │                                 │
│  │ Written Review   │                                 │
│  └────────┬────────┘                                 │
│           │                                          │
└───────────┼──────────────────────────────────────────┘
            │         REST API
            ▼
┌─────────────────────────────────────────────────────┐
│              NODE.JS + EXPRESS BACKEND               │
│                                                      │
│  /upload-resume     → PDF parse + Gemini extract     │
│  /verify-github     → GitHub API + Gemini code check │
│  /verify-profiles   → LeetCode/CF/CC fetch/scrape    │
│  /ats-check         → Gemini ATS analysis            │
│  /final-review      → Gemini composite review        │
│                                                      │
│  Gemini API    GitHub API    MongoDB                 │
└─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────┐
│   MongoDB Atlas      │
│                      │
│  candidates          │
│  verification_reports│
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│   Render             │
│   Deploy backend     │
│   + serve frontend   │
└─────────────────────┘
```

---

## Feature Spec

### 1. Resume Upload & Parse
- Accept PDF upload via `pdf-parse-new` or `pdfjs-dist`
- Send extracted text to Gemini with structured extraction prompt
- Extract: name, email, skills[], projects[], internships[], education[], coding_profiles{}, github_username

### 2. ATS Score + Issues
- Send resume text to Gemini with prompt:
  ```json
  Analyze this resume for ATS (Applicant Tracking System) compatibility.
  Return JSON:
  {
    "ats_score": 0-100,
    "issues": [
      { "category": "formatting|keywords|sections|structure",
        "issue": "description",
        "severity": "high|medium|low",
        "fix": "how to fix it" }
    ]
  }
  ```

### 3. Coding Profile Verification
- **LeetCode**: Fetch `https://leetcode.com/graphql` (Official API) — pulls rating, totalSolved, contributionPoints, and reputation
- **Codeforces**: Fetch `https://codeforces.com/api/user.info?handles={handle}` — pulls rating, maxRating, rank, maxRank, and friendOfCount
- **CodeChef**: Scrape public profile page using Cheerio — pulls currentRating, highestRating, stars, globalRank, and countryRank
- Verify actual ratings and metrics pulled from platforms against what's claimed on the resume

### 4. GitHub Verification
For each project listed on resume:

**Step 1 — Repo existence check**
```http
GET /repos/{username}/{repo_name}
```
- If private → flag as UNVERIFIABLE (not reject — just flag)
- If doesn't exist → RED FLAG

**Step 2 — Keyword search in code**
- Extract keywords from resume project description
- Use GitHub Code Search API: `GET /search/code?q={keyword}+repo:{user}/{repo}`
- Get the files where keywords appear

**Step 3 — Gemini code verification**
- Send file contents + resume project claims to Gemini:
  ```json
  Resume claims this project does: {claims}
  Here is the actual code from the repository: {code}
  Does the code actually implement what is claimed?
  Return JSON:
  {
    "verified": true/false,
    "confidence": 0-100,
    "evidence": ["specific things found in code"],
    "red_flags": ["specific mismatches"]
  }
  ```

### 5. Commit History Health
- `GET /repos/{user}/{repo}/stats/commit_activity` — weekly commit data
- `GET /repos/{user}/{repo}/commits?per_page=10` — recent commit messages
- Check: total commits, commit message quality, date spread, burst patterns (all commits in 1 day = suspicious)

### 6. Contributor Analysis
- `GET /repos/{user}/{repo}/contributors`
- Check: how many contributors, is the candidate the top contributor by commits
- `GET /repos/{user}/{repo}/stats/contributors` — per-contributor additions/deletions
- Flag if candidate's contributions are only README/docs edits vs actual code

### 7. Skill Decay
- For each skill claimed on resume, find repos that use that language/framework
- Check last commit date on those repos
- Flag: "Claims React experience — last React commit was 14 months ago"
- Use GitHub API: `GET /repos/{user}/{repo}` → `pushed_at` field

### 8. Final Written Review
- Feed ALL collected data (ATS score, GitHub findings, coding profile scores, skill decay flags, contributor analysis) into one final Gemini call:
  ```text
  Here is the complete verification data for candidate {name}:
  {all_data_as_JSON}

  Write a professional recruiter-facing review. Include:
  1. Overall honesty assessment
  2. Strongest verified claims
  3. Weakest / unverifiable claims
  4. Specific areas to probe in interview
  Keep it under 200 words. Be direct.
  ```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite + TailwindCSS | Fast setup, team knows React |
| Backend | Node.js + Express | JS everywhere |
| AI | Google Gemini API (gemini-2.0-flash) | Free tier, fast, multimodal |
| PDF Parsing | pdf-parse-new (npm) | Simple, works |
| GitHub | Octokit (npm) | Official GitHub API client |
| Coding Profiles | Axios + Cheerio | HTTP requests + HTML scraping |
| Database | MongoDB Atlas | Free tier, stores everything |
| Deployment | Vultr VPS | Sponsor track |

---

## MongoDB Collections

### `candidates`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "resume_text": "string",
  "extracted_data": {
    "skills": [],
    "projects": [],
    "internships": [],
    "coding_profiles": {},
    "github_username": "string"
  },
  "created_at": "Date"
}
```

### `verification_reports`
```json
{
  "_id": "ObjectId",
  "candidate_id": "ObjectId",
  "ats_score": "Number",
  "ats_issues": [],
  "github_verification": [{
    "repo": "string",
    "exists": "Boolean",
    "code_verified": "Boolean",
    "confidence": "Number",
    "red_flags": [],
    "commit_health": {},
    "contributors": {},
    "skill_decay_flag": "string|null"
  }],
  "coding_profiles": {
    "leetcode": {},
    "codeforces": {},
    "codechef": {}
  },
  "final_review": "string",
  "overall_honesty": "string",
  "created_at": "Date"
}
```

---

## 36-Hour Build Timeline

### Hours 0–10: Foundation
- [ ] Initialize React + Vite project with Tailwind
- [ ] Set up Node.js + Express backend with routes skeleton
- [ ] MongoDB Atlas cluster + connection
- [ ] Resume PDF upload → pdf-parse-new → text extraction working
- [ ] First Gemini API call working (extract resume data as JSON)

### Hours 10–20: Core Verification Engine
- [ ] ATS score endpoint working
- [ ] GitHub API integration — repo existence, commit history, contributors
- [ ] Gemini code verification — keywords → search code → verify claims
- [ ] Coding profile APIs — LeetCode + Codeforces + CodeChef fetching
- [ ] Skill decay logic — last commit date per tech

### Hours 20–30: Dashboard UI
- [ ] Resume upload page with drag-and-drop
- [ ] Verification report page — display all results
- [ ] ATS score display with issues list
- [ ] GitHub verification cards per project
- [ ] Coding profile comparison display
- [ ] Final written review section

### Hours 30–36: Integration, Polish & Demo Prep
- [ ] End-to-End integration
- [ ] UI polish — animations, loading states, error handling
- [ ] Mobile-responsive dashboard (judges may check on phone)
- [ ] Seed 2-3 fake candidate profiles with deliberate lies
- [ ] Deploy to Vultr
- [ ] Pitch rehearsal (3 minutes max)
- [ ] Devfolio submission

---

## Task Split (3 Members)

| Person | Responsibility |
|--------|---------------|
| **Dev 1 (Lead)** | Backend — Express routes, Gemini prompts, all verification logic |
| **Dev 2** | Frontend — React dashboard, all UI components, Tailwind styling |
| **Dev 3** | APIs integration — GitHub API integration (Octokit), coding profile scrapers, MongoDB setup |

---

## Starter Prompt

Copy this to your AI coding tool to scaffold the project:

```text
Build a full-stack app called VerifAI with a React+Vite web dashboard and a Node.js API backend.

FRONTEND (React + Vite + TailwindCSS):

Page 1 - Upload Page:
- Drag-and-drop PDF resume upload
- On upload, POST the file to backend /api/upload-resume
- Show loading state while processing

Page 2 - Report Page:
- Display candidate name and email at top
- Section: "ATS Score" — circular progress showing score 0-100, below it a list of issues with severity badges (high=red, medium=yellow, low=green) and fix suggestions
- Section: "GitHub Verification" — card per project showing: repo exists (checkmark/X), code verification confidence bar, red flags as red chips, commit health stats, contributor breakdown, skill decay warning if applicable
- Section: "Coding Profiles" — side-by-side cards for LeetCode/Codeforces/CodeChef showing actual pulled ratings and stats
- Section: "Final Review" — a text block with Gemini's written honesty assessment of the candidate

BACKEND (Node.js + Express):

POST /api/upload-resume
- Accept PDF via multer
- Extract text with pdf-parse-new
- Call Gemini API with prompt: "Extract from this resume as JSON: name, email, skills (array), projects (array with name, description, technologies, github_url), internships (array), education (array), coding_profiles (object with leetcode, codeforces, codechef usernames if found), github_username. Return ONLY valid JSON."
- Store in MongoDB candidates collection
- Return candidate_id

GET /api/verify/:candidate_id
- Trigger all verification checks in parallel:
  1. ATS check via Gemini
  2. For each project: GitHub repo check → code search → Gemini verification
  3. Commit history via GitHub API
  4. Contributors via GitHub API
  5. Skill decay check (last push date per repo vs claimed skills)
  6. Coding profile fetch (LeetCode GraphQL API, Codeforces API, CodeChef scrape)
- After all complete, run final Gemini review with all data
- Store in MongoDB verification_reports collection
- Return full report

Use dotenv for all API keys (GEMINI_API_KEY, MONGODB_URI, GITHUB_TOKEN).
```

---

## Pitch Structure (3 minutes)

**0:00–0:30 — The Problem**
"68% of resumes contain some form of exaggeration. Recruiters spend 7 seconds per resume. They physically cannot verify every claim."

**0:30–1:00 — The Solution**
"VerifAI solves this. Upload a resume and get an instant verification report — we check GitHub repos against claims, pull actual coding ratings, analyze commit patterns, and flag skill decay to tell you exactly where a candidate might be exaggerating."

**1:00–2:30 — Live Demo**
1. Upload a fake resume with deliberate lies (inflated LeetCode rating, project claims that don't match repo code, stale skills)
2. Show the verification report — point out red flags

**2:30–3:00 — Impact + Tracks**
"Built with Gemini for AI verification and MongoDB Atlas for data persistence, deployed on Vultr. VerifAI doesn't replace recruiters — it gives them x-ray vision."

---

## Key Risks + Mitigations

| Risk | Mitigation |
|------|-----------|
| GitHub API rate limit (60/hr unauthenticated) | Use a Personal Access Token → 5000/hr |
| LeetCode restricts/rate-limits GraphQL API | Implement caching and rate-limiting handling |
| CodeChef blocks scraping | Skip CodeChef if blocked, show "unable to verify" gracefully |
| Gemini hallucinating verification results | Always show raw data (actual commit count, actual rating) alongside Gemini's interpretation |
