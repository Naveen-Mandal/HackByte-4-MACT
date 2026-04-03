# VerifAI — Complete Project Spec

## One-Liner
**"VerifAI listens to your interview, reads the resume, checks the code — and tells you when the candidate is lying."**

---

## What You're Building

Two products, one brand:

### Product 1: VerifAI Web Dashboard
A website where recruiters upload a candidate's resume PDF and get a comprehensive fact-check report.

### Product 2: VerifAI Chrome Extension
A Chrome extension that captures system audio during a live Zoom/Meet interview, transcribes the candidate's answers in real-time, and flags mismatches against the resume + GitHub data — with AI-generated follow-up questions.

---

## Sponsor Tracks

| Track | Prize | Integration |
|-------|-------|-------------|
| HackByte Main | $390 / $279 / $167 | Core project |
| Google Gemini | Swag Kit | Core AI engine for all verification |
| MongoDB Atlas | IoT Starter Kit | Store resume data, verification results, interview transcripts |
| Vultr | Portable Projectors | Deploy backend |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│                                                     │
│  React + Vite Web App          Chrome Extension      │
│  ┌─────────────────┐          ┌──────────────────┐  │
│  │ Resume Upload    │          │ Tab Audio Capture │  │
│  │ Fact-Check Report│          │ Live Transcript   │  │
│  │ ATS Score        │          │ Mismatch Flags    │  │
│  │ Written Review   │          │ Follow-up Qs      │  │
│  │ Extension DL Link│          │ Deepgram STT      │  │
│  └────────┬────────┘          └────────┬─────────┘  │
│           │                            │             │
└───────────┼────────────────────────────┼─────────────┘
            │         REST API           │
            ▼                            ▼
┌─────────────────────────────────────────────────────┐
│              NODE.JS + EXPRESS BACKEND               │
│                                                      │
│  /upload-resume     → PDF parse + Gemini extract     │
│  /verify-github     → GitHub API + Gemini code check │
│  /verify-profiles   → LeetCode/CF/CC scrape          │
│  /ats-check         → Gemini ATS analysis            │
│  /final-review      → Gemini composite review        │
│  /verify-claim      → Extension sends transcript     │
│                       chunk, gets mismatch + Qs       │
│                                                      │
│  Gemini API    GitHub API    Deepgram    MongoDB      │
└─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────┐
│   MongoDB Atlas      │
│                      │
│  candidates          │
│  verification_reports│
│  interview_sessions  │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│   Vultr VPS          │
│   Deploy backend     │
│   + serve frontend   │
└─────────────────────┘
```

---

## Feature Spec — Web Dashboard

### 1. Resume Upload & Parse
- Accept PDF upload via `pdf-parse` or `pdfjs-dist`
- Send extracted text to Gemini with structured extraction prompt
- Extract: name, email, skills[], projects[], internships[], education[], coding_profiles{}, github_username

### 2. ATS Score + Issues
- Send resume text to Gemini with prompt:
  ```
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
- **LeetCode**: Fetch `https://leetcode-stats-api.herokuapp.com/{username}` — pulls totalSolved, ranking, easySolved, mediumSolved, hardSolved
- **Codeforces**: Fetch `https://codeforces.com/api/user.info?handles={handle}` — pulls rating, rank, maxRating
- **CodeChef**: Scrape public profile page using Cheerio — pulls currentRating, stars, globalRank
- Display actual ratings pulled from platforms alongside what's claimed on resume

### 4. GitHub Verification
For each project listed on resume:

**Step 1 — Repo existence check**
```
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
  ```
  Resume claims this project does: {claims}
  Here is the actual code from the repository: {code}
  Does the code actually implement what is claimed?
  Return JSON:
  {
    "verified": true/false,
    "confidence": 0-100,
    "evidence": ["specific things found in code"],
    "red_flags": ["specific mismatches"],
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
  ```
  Here is the complete verification data for candidate {name}:
  {all_data_as_JSON}

  Write a professional recruiter-facing review. Include:
  1. Overall honesty assessment
  2. Strongest verified claims
  3. Weakest / unverifiable claims
  4. Specific areas to probe in interview
  Keep it under 200 words. Be direct.
  ```

### 9. Extension Download Link
- Simple section on the dashboard with download link for the Chrome extension CRX/instructions

---

## Feature Spec — Chrome Extension

### Architecture
```
Manifest V3 Chrome Extension
├── popup.html/js        → Start/stop listening, show status
├── content.js           → Overlay panel on Zoom/Meet tab
├── background.js        → Manages audio capture + Deepgram connection
└── side_panel.html/js   → Full verification panel (optional, if time)
```

### Flow
1. Recruiter opens Zoom/Meet in Chrome tab
2. Clicks VerifAI extension icon → popup asks which candidate (select from MongoDB or enter name)
3. Extension loads that candidate's resume data from backend
4. Recruiter clicks "Start Listening"
5. `chrome.tabCapture.capture({ audio: true })` captures tab audio
6. Audio stream → Deepgram WebSocket → real-time transcript
7. Every 15-20 seconds (or on sentence boundaries), send transcript chunk to backend `/verify-claim`
8. Backend compares chunk against resume claims using Gemini:
   ```
   Candidate's resume says: {resume_claims}
   Candidate just said: "{transcript_chunk}"

   Does anything the candidate said contradict or conflict with their resume?
   If yes, return JSON:
   {
     "mismatch_found": true,
     "claim_on_resume": "what resume says",
     "what_candidate_said": "conflicting statement",
     "severity": "high|medium|low",
     "follow_up_question": "a specific question the recruiter should ask next"
   }
   If no mismatch, return: { "mismatch_found": false }
   ```
9. Mismatch flags appear as non-intrusive overlay on the tab
10. Follow-up questions appear for the recruiter to ask

### UI on Extension
- Small floating panel (bottom-right of tab)
- Shows: live transcript (scrolling), mismatch alerts (red badges), suggested follow-up questions
- Recruiter can dismiss alerts or mark them as "asked"

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React + Vite + TailwindCSS | Fast setup, team knows React |
| Backend | Node.js + Express | JS everywhere |
| AI | Google Gemini API (gemini-2.0-flash) | Free tier, fast, multimodal |
| Speech-to-Text | Deepgram Streaming API | Real-time, accurate, free 45k seconds |
| PDF Parsing | pdf-parse (npm) | Simple, works |
| GitHub | Octokit (npm) | Official GitHub API client |
| Coding Profiles | Axios + Cheerio | HTTP requests + HTML scraping |
| Database | MongoDB Atlas | Free tier, stores everything |
| Extension | Chrome Manifest V3 | Standard Chrome extension |
| Deployment | Vultr VPS | Sponsor track |

---

## MongoDB Collections

### `candidates`
```json
{
  "_id": ObjectId,
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
  "created_at": Date
}
```

### `verification_reports`
```json
{
  "_id": ObjectId,
  "candidate_id": ObjectId,
  "ats_score": Number,
  "ats_issues": [],
  "github_verification": [{
    "repo": "string",
    "exists": Boolean,
    "code_verified": Boolean,
    "confidence": Number,
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
  "created_at": Date
}
```

### `interview_sessions`
```json
{
  "_id": ObjectId,
  "candidate_id": ObjectId,
  "transcript_chunks": [{
    "text": "string",
    "timestamp": Date,
    "mismatch": {}
  }],
  "mismatches_found": [],
  "started_at": Date,
  "ended_at": Date
}
```

---

## 36-Hour Build Timeline

### Hours 0–6: Foundation
- [ ] Initialize React + Vite project with Tailwind
- [ ] Set up Node.js + Express backend with routes skeleton
- [ ] MongoDB Atlas cluster + connection
- [ ] Resume PDF upload → pdf-parse → text extraction working
- [ ] First Gemini API call working (extract resume data as JSON)

### Hours 6–12: Core Verification Engine
- [ ] ATS score endpoint working
- [ ] GitHub API integration — repo existence, commit history, contributors
- [ ] Gemini code verification — keywords → search code → verify claims
- [ ] Coding profile APIs — LeetCode + Codeforces fetching
- [ ] Skill decay logic — last commit date per tech

### Hours 12–18: Dashboard UI
- [ ] Resume upload page with drag-and-drop
- [ ] Verification report page — display all results
- [ ] ATS score display with issues list
- [ ] GitHub verification cards per project
- [ ] Coding profile comparison display
- [ ] Final written review section

### Hours 18–26: Chrome Extension
- [ ] Manifest V3 setup + popup UI
- [ ] `chrome.tabCapture` audio capture working
- [ ] Deepgram WebSocket streaming → live transcript
- [ ] Backend `/verify-claim` endpoint
- [ ] Overlay UI on tab — transcript + mismatch flags + follow-up Qs
- [ ] Connect extension to backend — load candidate data

### Hours 26–32: Integration + Polish
- [ ] Extension ↔ Dashboard linked (same candidate data)
- [ ] MongoDB storing interview sessions
- [ ] UI polish — animations, loading states, error handling
- [ ] Mobile-responsive dashboard (judges may check on phone)
- [ ] Extension download section on dashboard

### Hours 32–36: Demo Prep
- [ ] Seed 2-3 fake candidate profiles with deliberate lies
- [ ] Record a mock interview audio to demo extension
- [ ] Test full flow end-to-end
- [ ] Deploy to Vultr
- [ ] Pitch rehearsal (3 minutes max)
- [ ] Devfolio submission

---

## Task Split (4 Members)

| Person | Responsibility |
|--------|---------------|
| **Dev 1 (Lead)** | Backend — Express routes, Gemini prompts, all verification logic |
| **Dev 2** | Frontend — React dashboard, all UI components, Tailwind styling |
| **Dev 3** | Chrome Extension — Manifest V3, tabCapture, Deepgram, overlay UI |
| **Dev 4 (Java dev)** | GitHub API integration (Octokit), coding profile scrapers, MongoDB setup |

---

## Starter Prompt

Copy this to your AI coding tool to scaffold the project:

```
Build a full-stack app called VerifAI with two parts: a React+Vite web dashboard and a Chrome extension.

PART 1 — WEB DASHBOARD (React + Vite + TailwindCSS):

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
- Section: "Live Interview Tool" — download link for Chrome extension with install instructions

PART 2 — BACKEND (Node.js + Express):

POST /api/upload-resume
- Accept PDF via multer
- Extract text with pdf-parse
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
  6. Coding profile fetch (LeetCode stats API, Codeforces API, CodeChef scrape)
- After all complete, run final Gemini review with all data
- Store in MongoDB verification_reports collection
- Return full report

POST /api/verify-claim
- Accept: { candidate_id, transcript_chunk }
- Load candidate's resume data from MongoDB
- Call Gemini: compare transcript chunk against resume claims
- Return: mismatch_found, details, severity, follow_up_question
- Append to MongoDB interview_sessions

PART 3 — CHROME EXTENSION (Manifest V3):

manifest.json with permissions: tabCapture, activeTab, storage
popup.html: Start/stop button, candidate selector (fetches from backend)
background.js: On start, chrome.tabCapture.capture({ audio: true }), pipe MediaStream to Deepgram WebSocket for real-time transcription
content.js: Inject floating overlay panel (bottom-right, 300px wide) showing:
  - Live scrolling transcript
  - Red alert cards for mismatches with severity badge
  - Suggested follow-up question with "Mark as Asked" button
Every sentence boundary from Deepgram, POST transcript chunk to backend /api/verify-claim, display results in overlay.

Use dotenv for all API keys (GEMINI_API_KEY, DEEPGRAM_API_KEY, MONGODB_URI, GITHUB_TOKEN).
```

---

## Pitch Structure (3 minutes)

**0:00–0:30 — The Problem**
"68% of resumes contain some form of exaggeration. Recruiters spend 7 seconds per resume. They physically cannot verify every claim. And in a live interview, they have zero tools to catch inconsistencies in real-time."

**0:30–1:00 — The Solution**
"VerifAI does two things. First, upload a resume and get an instant verification report — we check GitHub repos against claims, pull actual coding ratings, analyze commit patterns, flag skill decay. Second — and this is the part nobody else does — our Chrome extension listens to the interview in real-time and alerts you the moment the candidate contradicts their own resume."

**1:00–2:30 — Live Demo**
1. Upload a fake resume with deliberate lies (inflated LeetCode rating, project claims that don't match repo code, stale skills)
2. Show the verification report — point out red flags
3. Play a pre-recorded "interview" audio in a tab, show the extension catching a lie live, show the follow-up question appearing

**2:30–3:00 — Impact + Tracks**
"Built with Gemini for AI verification, MongoDB Atlas for data persistence, Deepgram for real-time transcription, deployed on Vultr. VerifAI doesn't replace recruiters — it gives them x-ray vision."

---

## Key Risks + Mitigations

| Risk | Mitigation |
|------|-----------|
| Deepgram free tier runs out | Browser Web Speech API as fallback (less accurate but works) |
| GitHub API rate limit (60/hr unauthenticated) | Use a Personal Access Token → 5000/hr |
| LeetCode blocks scraping | Use public stats API (`leetcode-stats-api.herokuapp.com`) |
| CodeChef blocks scraping | Skip CodeChef if blocked, show "unable to verify" gracefully |
| Chrome tabCapture doesn't work on all tabs | Works on any tab with audio — demo with a YouTube video of a mock interview |
| Gemini hallucinating verification results | Always show raw data (actual commit count, actual rating) alongside Gemini's interpretation |
| Extension too complex for 36 hours | MVP: just transcript + mismatch flags, skip the follow-up questions if behind schedule |
