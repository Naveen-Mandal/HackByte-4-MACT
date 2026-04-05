"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

// ─── Nav sections ──────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "authentication", label: "Authentication" },
      { id: "base-url", label: "Base URL & Versioning" },
    ],
  },
  {
    label: "Core API",
    items: [
      { id: "analyze-resume", label: "POST /analyze-resume" },
      { id: "response-schema", label: "Response Schema" },
      { id: "error-codes", label: "Error Codes" },
    ],
  },
  {
    label: "Verification Modules",
    items: [
      { id: "github-verification", label: "GitHub Verification" },
      { id: "coding-profiles", label: "Coding Profiles" },
      { id: "leetcode-verify", label: "POST /verify/leetcode" },
      { id: "codeforces-verify", label: "POST /verify/codeforces" },
      { id: "codechef-verify", label: "POST /verify/codechef" },
      { id: "ats-scoring", label: "ATS Scoring" },
      { id: "skill-decay", label: "Skill Continuity" },
    ],
  },
  {
    label: "Examples",
    items: [
      { id: "curl-examples", label: "cURL" },
    ],
  },
];

// ─── Tiny helpers ──────────────────────────────────────────────────────────────
function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    post: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    get: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    beta: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    new: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${colors[color] ?? ""}`}
    >
      {children}
    </span>
  );
}

function CodeBlock({
  lang,
  code,
  filename,
}: {
  lang: string;
  code: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="docs-code-block">
      <div className="docs-code-header">
        <span className="docs-code-lang">{filename ?? lang}</span>
        <button className="docs-copy-btn" onClick={copy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre className="docs-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="docs-section">
      <h2 className="docs-section-title">{title}</h2>
      {children}
    </section>
  );
}

function Callout({
  type,
  children,
}: {
  type: "info" | "warning" | "tip";
  children: React.ReactNode;
}) {
  const map = {
    info: { icon: "ℹ", cls: "docs-callout-info" },
    warning: { icon: "⚠", cls: "docs-callout-warning" },
    tip: { icon: "✦", cls: "docs-callout-tip" },
  };
  const { icon, cls } = map[type];
  return (
    <div className={`docs-callout ${cls}`}>
      <span className="docs-callout-icon">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function ResponseField({
  name,
  type,
  required,
  description,
}: {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}) {
  return (
    <div className="docs-response-field">
      <div className="docs-field-header">
        <code className="docs-field-name">{name}</code>
        <span className="docs-field-type">{type}</span>
        {required && <span className="docs-field-required">required</span>}
      </div>
      <p className="docs-field-desc">{description}</p>
    </div>
  );
}

// ─── Code samples ──────────────────────────────────────────────────────────────
const CURL_EXAMPLE = `curl -X POST http://65.20.88.66:4000/api/analyze-resume \\
  -H "Content-Type: multipart/form-data" \\
  -F "resume=@./john_doe_resume.pdf"`;

const RESPONSE_EXAMPLE = `{
  "success": true,
  "data": {
    "extractedData": {
      "contactInfo": { "name": "Jane Smith", "email": "jane@example.com" },
      "skills": ["TypeScript", "React", "Python", "PostgreSQL"],
      "projects": [
        {
          "name": "SecureShop",
          "description": "Implemented authentication using JWT and role-based route protection",
          "technologies": ["Node.js", "Express", "MongoDB"],
          "githubLink": "https://github.com/janesmith/secureshop",
          "claimedPoints": ["Implemented authentication using JWT", "Protected admin routes with role checks"]
        }
      ],
      "githubProfile": "https://github.com/janesmith",
      "codingProfiles": {
        "leetcode": { "username": "jane_leet", "totalSolved": 890, "currentRating": 2100 },
        "codeforces": { "username": "jane_cf", "maxRating": 1850 }
      }
    },
    "verificationReport": {
      "candidate": { "name": "Jane Smith", "email": "jane@example.com" },
      "atsAnalysis": {
        "atsScore": 74,
        "issues": [
          { "severity": "medium", "issue": "Missing quantified impact metrics" }
        ]
      },
      "githubAnalytics": {
        "profile": { "username": "janesmith", "publicRepos": 43, "followers": 120 },
        "matches": [
          {
            "project": "SecureShop",
            "repo": "secureshop",
            "matchScore": 100,
            "deploymentChecked": true,
            "commits": { "totalCommits": 87, "isSoleContributor": true },
            "assessment": {
              "resumeProject": "SecureShop",
              "matchedRepo": "secureshop",
              "claimsVerification": [
                {
                  "claim": "Implemented authentication using JWT",
                  "status": "accepted",
                  "actualContent": "Repo-wide code search found jwt-related matches and fetched surrounding code snippets from auth middleware and token generation files."
                }
              ],
              "verdict": "Strong evidence that the claimed JWT authentication feature was implemented."
            },
            "codeVerification": "Evaluated (See full payload for details)"
          }
        ]
      },
      "codingProfilesVerification": {
        "results": {
          "leetcode": {
            "actual": { "totalSolved": 423, "currentRating": 1680 },
            "claims": { "totalSolved": 890, "currentRating": 2100 },
            "mismatches": [
              "Resume claims 890 solved problems, actual is 423",
              "Resume claims rating 2100, actual is 1680"
            ]
          }
        }
      },
      "skillDecay": [
        { "skill": "Python", "lastUsed": "2024-11-03" },
        { "skill": "React", "lastUsed": "2025-02-14" }
      ],
      "finalAutomatedReview": "**Significant discrepancies detected.** LeetCode claims are inflated by ~2×. GitHub projects verified with strong commit ownership. Recommend human review before advancing."
    }
  }
}`;

// ─── Main component ────────────────────────────────────────────────────────────
export default function DocsClient() {
  const [activeSection, setActiveSection] = useState("introduction");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll-spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -75% 0px" }
    );
    const sections = document.querySelectorAll("section[id]");
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setSidebarOpen(false);
  };

  return (
    <>
      <style>{docsStyles}</style>
      <div className="docs-root">
        {/* ── Top bar ── */}
        <header className="docs-topbar">
          <div className="docs-topbar-inner">
            <Link href="/" className="docs-logo">
              Verif<span>AI</span>
            </Link>
            <nav className="docs-topnav">
              <Link href="/upload" className="docs-topnav-link">
                Try Demo
              </Link>
              <a
                href="https://github.com/Naveen-Mandal/HackByte-4-MACT"
                target="_blank"
                rel="noopener noreferrer"
                className="docs-topnav-link"
              >
                GitHub
              </a>
              <ThemeToggle />
            </nav>
            <button
              className="docs-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </header>

        <div className="docs-layout">
          {/* ── Sidebar ── */}
          <aside className={`docs-sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="docs-sidebar-inner">
              <p className="docs-sidebar-eyebrow">API Reference v1</p>
              {NAV_SECTIONS.map((group) => (
                <div key={group.label} className="docs-nav-group">
                  <p className="docs-nav-group-label">{group.label}</p>
                  <ul className="docs-nav-list">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <button
                          className={`docs-nav-item ${activeSection === item.id ? "active" : ""}`}
                          onClick={() => scrollTo(item.id)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="docs-main" ref={mainRef}>
            {/* Hero */}
            <div className="docs-hero">
              <Tag color="new">Now in Beta</Tag>
              <h1 className="docs-hero-title">VerifAI API Documentation</h1>
              <p className="docs-hero-sub">
                Stop hiring fraudsters. Our pipeline reads resumes, cross-checks
                GitHub commits, and verifies competitive programming stats —
                exposing inflated claims before they make it past screening.
              </p>
              <div className="docs-hero-chips">
                <span className="docs-chip">🔒 Resume Fraud Detection</span>
                <span className="docs-chip">🐙 GitHub Verification</span>
                <span className="docs-chip">📊 LeetCode · Codeforces · CodeChef</span>
                <span className="docs-chip">🤖 AI Final Review</span>
              </div>
            </div>

            {/* ── Introduction ──────────────────────────────────────────── */}
            <Section id="introduction" title="Introduction">
              <p className="docs-prose">
                VerifAI is a resume intelligence API designed for modern
                recruiting pipelines. Submit a candidate&apos;s PDF resume and receive
                a deep verification report in seconds — no scraping, no manual
                checking.
              </p>
              <p className="docs-prose">
                The API runs a multi-stage pipeline under the hood:
              </p>
              <ol className="docs-list docs-list--ordered">
                <li>
                  <strong>Text & Structure Extraction</strong> — Gemini parses
                  every field from the PDF including hidden hyperlink annotations.
                </li>
                <li>
                  <strong>ATS Scoring</strong> — Keyword coverage, quantified
                  impact metrics, and formatting checks produce a 0–100 score.
                </li>
                <li>
                  <strong>GitHub Verification</strong> — Projects are matched to
                  real repos, commits are analysed for sole-contributor fraud, and
                  deployments are probed.
                </li>
                <li>
                  <strong>Coding Profile Cross-Check</strong> — Live stats from
                  LeetCode, Codeforces, and CodeChef are compared against resume
                  claims.
                </li>
                <li>
                  <strong>Skill Continuity</strong> — Identifies skills that
                  haven&apos;t appeared in recent commits (skill decay).
                </li>
                <li>
                  <strong>AI Final Review</strong> — Synthesises all signals into
                  a plain-English verdict recruiters can act on immediately.
                </li>
              </ol>
              <Callout type="tip">
                VerifAI works best alongside your existing ATS, not as a
                replacement. Use the webhook patterns in the{" "}
                <button
                  className="docs-inline-link"
                  onClick={() => scrollTo("greenhouse")}
                >
                  Integrations section
                </button>{" "}
                to slot it into Greenhouse, Lever, or Workday.
              </Callout>
            </Section>

            {/* ── Authentication ────────────────────────────────────────── */}
            <Section id="authentication" title="Authentication">
              <p className="docs-prose">
                The current deployed backend does not require a bearer token.
                Requests can be sent directly to the API as long as the server
                is reachable.
              </p>
              <CodeBlock
                lang="http"
                filename="Current deployed usage"
                code={`No Authorization header required`}
              />
              <Callout type="warning">
                The current deployment is exposed over plain HTTP on port{" "}
                <code className="docs-inline-code">4000</code>. Put it behind
                HTTPS or a reverse proxy for production use.
              </Callout>
            </Section>

            {/* ── Base URL ──────────────────────────────────────────────── */}
            <Section id="base-url" title="Base URL & Versioning">
              <p className="docs-prose">
                The current deployed backend is served directly from the host
                below. Routes are exposed under the{" "}
                <code className="docs-inline-code">/api</code> prefix and do not
                currently use a separate{" "}
                <code className="docs-inline-code">v1</code> version segment.
              </p>
              <CodeBlock
                lang="text"
                filename="Base URL"
                code={`http://65.20.88.66:4000`}
              />
              <div className="docs-table-wrap">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Sunset Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>current</td>
                      <td>
                        <span className="docs-status docs-status--active">
                          Active
                        </span>
                      </td>
                      <td>—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ── Analyze Resume ────────────────────────────────────────── */}
            <Section id="analyze-resume" title="POST /analyze-resume">
              <div className="docs-endpoint-bar">
                <Tag color="post">POST</Tag>
                <code className="docs-endpoint-path">
                  /api/analyze-resume
                </code>
                <Tag color="beta">Beta</Tag>
              </div>
              <p className="docs-prose">
                Submit a PDF resume and receive the full verification report.
                Processing time is typically <strong>15–45 seconds</strong>{" "}
                depending on the number of GitHub projects and coding profiles
                listed.
              </p>

              <h3 className="docs-h3">Request</h3>
              <p className="docs-prose">
                Send as <code className="docs-inline-code">multipart/form-data</code>.
              </p>
              <div className="docs-fields">
                <ResponseField
                  name="resume"
                  type="File (PDF)"
                  required
                  description="The candidate's resume as a PDF file. Maximum size: 8 MB."
                />
              </div>

              <h3 className="docs-h3">Example Request</h3>
              <CodeBlock lang="bash" filename="cURL" code={CURL_EXAMPLE} />

              <h3 className="docs-h3">Example Response</h3>
              <CodeBlock
                lang="json"
                filename="200 OK — application/json"
                code={RESPONSE_EXAMPLE}
              />
            </Section>

            {/* ── Response Schema ───────────────────────────────────────── */}
            <Section id="response-schema" title="Response Schema">
              <p className="docs-prose">
                All successful responses are wrapped in a standard envelope:
              </p>
              <div className="docs-fields">
                <ResponseField
                  name="success"
                  type="boolean"
                  description="true on a successful pipeline run."
                />
                <ResponseField
                  name="data.extractedData"
                  type="object"
                  description="Structured fields extracted from the resume: contactInfo, skills[], projects[], githubProfile, codingProfiles."
                />
                <ResponseField
                  name="data.verificationReport.candidate"
                  type="object"
                  description="Name and email of the candidate as parsed from the resume."
                />
                <ResponseField
                  name="data.verificationReport.atsAnalysis"
                  type="object"
                  description="atsScore (0–100) plus an array of issue objects with severity and description."
                />
                <ResponseField
                  name="data.verificationReport.githubAnalytics"
                  type="object"
                  description="GitHub profile stats and matched project objects with repo match score, deployment status, commit analytics, and optional AI claim assessments derived from repo-wide code snippets."
                />
                <ResponseField
                  name="data.verificationReport.codingProfilesVerification"
                  type="object"
                  description="Per-platform objects (leetcode, codeforces, codechef) containing actual live stats, resume claims, and a mismatches[] array."
                />
                <ResponseField
                  name="data.verificationReport.skillDecay"
                  type="array"
                  description="Each item contains skill and lastUsed date from GitHub commit history."
                />
                <ResponseField
                  name="data.verificationReport.finalAutomatedReview"
                  type="string"
                  description="Plain-English AI synthesis of all signals. Contains bold (**text**) markdown."
                />
              </div>
            </Section>

            {/* ── Error Codes ───────────────────────────────────────────── */}
            <Section id="error-codes" title="Error Codes">
              <div className="docs-table-wrap">
                <table className="docs-table">
                  <thead>
                    <tr>
                      <th>HTTP Status</th>
                      <th>Code</th>
                      <th>Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["400", "BAD_REQUEST", "Missing or invalid resume file. Must be a PDF."],
                      ["401", "UNAUTHORIZED", "Missing or invalid API key."],
                      ["413", "PAYLOAD_TOO_LARGE", "Resume file exceeds 8 MB."],
                      ["422", "UNPROCESSABLE", "PDF could not be parsed — possibly password-protected or corrupted."],
                      ["429", "RATE_LIMITED", "You've exceeded the tier limit. Upgrade or retry after the reset window."],
                      ["500", "INTERNAL_ERROR", "Pipeline failure — contact support with the request-id header for diagnostics."],
                    ].map(([status, code, desc]) => (
                      <tr key={status}>
                        <td>
                          <code>{status}</code>
                        </td>
                        <td>
                          <code>{code}</code>
                        </td>
                        <td>{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ── GitHub Verification ───────────────────────────────────── */}
            <Section id="github-verification" title="GitHub Verification">
              <p className="docs-prose">
                VerifAI automatically detects GitHub profile URLs from the resume
                text and from hidden PDF hyperlink annotations. For each extracted
                project, it matches the most likely repository and then verifies
                the claimed implementation details using repo-wide evidence.
              </p>
              <ul className="docs-list">
                <li>
                  Fetches the public repository list and matches projects by
                  exact GitHub link first, then falls back to name similarity,
                  repo description overlap, topics, and technology keywords.
                </li>
                <li>
                  Extracts keywords from the project description and
                  <code className="docs-inline-code"> claimedPoints </code>
                  such as <code className="docs-inline-code">JWT</code>,
                  <code className="docs-inline-code"> OAuth </code>, or
                  <code className="docs-inline-code"> Redis </code>.
                </li>
                <li>
                  Runs repo-wide GitHub code search for those keywords, fetches
                  the actual matched files, and extracts surrounding code windows
                  with line ranges instead of relying only on README metadata.
                </li>
                <li>
                  Sends the claim plus those code snippets to Gemini so each
                  claim can be marked as <code className="docs-inline-code">accepted</code>,
                  <code className="docs-inline-code"> missing </code>, or
                  <code className="docs-inline-code"> contradicted </code>.
                </li>
                <li>
                  Analyses commit history to flag repos where the candidate is
                  not a meaningful contributor and probes live deployment URLs
                  listed in repo metadata when available.
                </li>
              </ul>
              <Callout type="tip">
                Example: if a resume says{" "}
                <code className="docs-inline-code">
                  Implemented authentication using JWT
                </code>
                , VerifAI extracts <code className="docs-inline-code">jwt</code>,
                searches the full matched repository, pulls nearby auth code, and
                uses that evidence to decide whether the claim is actually
                supported.
              </Callout>
              <Callout type="info">
                Only <strong>public</strong> repositories are analysed. Private
                repo support via GitHub OAuth is on the roadmap.
              </Callout>
            </Section>

            {/* ── Coding Profiles ───────────────────────────────────────── */}
            <Section id="coding-profiles" title="Coding Profiles Verification">
              <p className="docs-prose">
                The API extracts LeetCode, Codeforces, and CodeChef usernames from
                the resume and fetches{" "}
                <strong>live platform statistics</strong> to validate every
                claim.
              </p>
              <div className="docs-platform-grid">
                {[
                  {
                    platform: "LeetCode",
                    color: "#FFA116",
                    fields: ["totalSolved", "currentRating", "globalRank"],
                    fraud: "Candidates often inflate solved count by 2–5×.",
                  },
                  {
                    platform: "Codeforces",
                    color: "#3B82F6",
                    fields: ["currentRating", "maxRating", "rank"],
                    fraud: "Rating inflation is common — max vs. current diverge strongly in fraudulent resumes.",
                  },
                  {
                    platform: "CodeChef",
                    color: "#5B3A29",
                    fields: ["currentRating", "stars", "globalRank"],
                    fraud: "Star counts are frequently misrepresented (e.g. '5 star' for a 3-star account).",
                  },
                ].map(({ platform, color, fields, fraud }) => (
                  <div key={platform} className="docs-platform-card">
                    <div
                      className="docs-platform-badge"
                      style={{ background: color + "22", borderColor: color + "44" }}
                    >
                      <span style={{ color }}>{platform}</span>
                    </div>
                    <p className="docs-platform-fields">
                      Verified fields:{" "}
                      {fields.map((f) => (
                        <code key={f} className="docs-inline-code">
                          {f}
                        </code>
                      ))}
                    </p>
                    <p className="docs-platform-fraud">
                      <strong>Common fraud:</strong> {fraud}
                    </p>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── LeetCode Verification ─────────────────────────────────── */}
            <Section id="leetcode-verify" title="POST /api/verify/leetcode">
              <div className="docs-endpoint-bar">
                <Tag color="post">POST</Tag>
                <code className="docs-endpoint-path">/api/verify/leetcode</code>
              </div>
              <p className="docs-prose">
                Verify a candidate&apos;s LeetCode profile specifically to check for rating inflation and 
                discrepancies in solved problem counts.
              </p>
              <h3 className="docs-h3">Request Body</h3>
              <div className="docs-fields">
                <ResponseField name="username" type="string" required description="The candidate's LeetCode username." />
                <ResponseField name="totalSolved" type="number" description="Claimed total solved problems." />
                <ResponseField name="currentRating" type="number" description="Claimed current LeetCode rating." />
              </div>
            </Section>

            {/* ── Codeforces Verification ───────────────────────────────── */}
            <Section id="codeforces-verify" title="POST /api/verify/codeforces">
              <div className="docs-endpoint-bar">
                <Tag color="post">POST</Tag>
                <code className="docs-endpoint-path">/api/verify/codeforces</code>
              </div>
              <p className="docs-prose">
                Verify a candidate&apos;s Codeforces rank, max rating, and rating gaps against the live API.
              </p>
              <h3 className="docs-h3">Request Body</h3>
              <div className="docs-fields">
                <ResponseField name="username" type="string" required description="The candidate's Codeforces username." />
                <ResponseField name="rating" type="number" description="Claimed current Codeforces rating." />
                <ResponseField name="maxRating" type="number" description="Claimed maximum Codeforces rating." />
              </div>
            </Section>

            {/* ── CodeChef Verification ─────────────────────────────────── */}
            <Section id="codechef-verify" title="POST /api/verify/codechef">
              <div className="docs-endpoint-bar">
                <Tag color="post">POST</Tag>
                <code className="docs-endpoint-path">/api/verify/codechef</code>
              </div>
              <p className="docs-prose">
                Verify a candidate&apos;s CodeChef stars, rating, and global rank.
              </p>
              <h3 className="docs-h3">Request Body</h3>
              <div className="docs-fields">
                <ResponseField name="username" type="string" required description="The candidate's CodeChef username." />
                <ResponseField name="currentRating" type="number" description="Claimed current CodeChef rating." />
                <ResponseField name="stars" type="number" description="Claimed CodeChef stars (1-7)." />
              </div>
            </Section>

            {/* ── ATS Scoring ───────────────────────────────────────────── */}
            <Section id="ats-scoring" title="ATS Scoring">
              <p className="docs-prose">
                The ATS score (0–100) measures how well the resume would perform
                against standard Applicant Tracking System filters — before any
                verification is applied.
              </p>
              <div className="docs-score-grid">
                {[
                  ["80–100", "Excellent", "Strong keyword coverage, quantified achievements, clean formatting."],
                  ["60–79", "Good", "Minor gaps in keyword density or impact metrics."],
                  ["40–59", "Fair", "Notable formatting issues or missing sections."],
                  ["0–39", "Poor", "Significant ATS barriers — likely to be auto-filtered."],
                ].map(([range, label, desc]) => (
                  <div key={range} className="docs-score-row">
                    <code className="docs-score-range">{range}</code>
                    <strong>{label}</strong>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Skill Decay ───────────────────────────────────────────── */}
            <Section id="skill-decay" title="Skill Continuity (GitHub Pulse)">
              <p className="docs-prose">
                The <code className="docs-inline-code">skillDecay</code> array
                cross-references every skill listed on the resume with the
                candidate&apos;s GitHub commit history to find the last date each skill
                appeared in a commit diff.
              </p>
              <p className="docs-prose">
                A large gap between the claimed skill and the last active commit
                may indicate the candidate is listing technologies they only
                briefly touched years ago.
              </p>
              <Callout type="tip">
                A skill with <code className="docs-inline-code">lastUsed: null</code>{" "}
                means no public commits referencing that skill were found — not
                necessarily fraud, but worth probing in the interview.
              </Callout>
            </Section>

            {/* ── Greenhouse ────────────────────────────────────────────── */}
            <Section id="curl-examples" title="cURL Examples">
              <h3 className="docs-h3">Analyze a resume</h3>
              <CodeBlock lang="bash" filename="cURL" code={CURL_EXAMPLE} />

              <h3 className="docs-h3">Health check</h3>
              <CodeBlock
                lang="bash"
                filename="cURL"
                code={`curl http://65.20.88.66:4000/health`}
              />
            </Section>

            <div className="docs-footer">
              <p>
                VerifAI API · Built for HackByte 4.0 ·{" "}
                <a
                  href="https://github.com/Naveen-Mandal/HackByte-4-MACT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="docs-inline-link"
                >
                  Open on GitHub
                </a>
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const docsStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  .docs-root {
    --docs-bg: #0b0e1a;
    --docs-surface: #111622;
    --docs-surface-2: #181e2e;
    --docs-border: rgba(148,163,184,0.1);
    --docs-text: #e2e8f0;
    --docs-muted: #7f8ea3;
    --docs-accent: #4f8ef7;
    --docs-accent-glow: rgba(79,142,247,0.15);
    --docs-green: #34d399;
    --docs-red: #f87171;
    --docs-sidebar-w: 260px;
    --docs-font: 'Outfit', sans-serif;
    --docs-mono: 'JetBrains Mono', monospace;
    min-height: 100vh;
    background: var(--docs-bg);
    color: var(--docs-text);
    font-family: var(--docs-font);
  }

  /* Light mode overrides */
  :root:not(.dark) .docs-root {
    --docs-bg: #f5f7ff;
    --docs-surface: #ffffff;
    --docs-surface-2: #f0f4ff;
    --docs-border: rgba(15,23,42,0.1);
    --docs-text: #0f172a;
    --docs-muted: #5a6a83;
    --docs-accent: #2563eb;
    --docs-accent-glow: rgba(37,99,235,0.1);
  }

  /* ── Top bar ── */
  .docs-topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--docs-surface);
    border-bottom: 1px solid var(--docs-border);
    backdrop-filter: blur(12px);
  }
  .docs-topbar-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .docs-logo {
    font-family: var(--docs-font);
    font-weight: 800;
    font-size: 1.25rem;
    color: var(--docs-text);
    text-decoration: none;
    letter-spacing: -0.03em;
    margin-right: auto;
  }
  .docs-logo span {
    color: var(--docs-accent);
  }
  .docs-topnav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .docs-topnav-link {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--docs-muted);
    text-decoration: none;
    transition: all 0.15s;
  }
  .docs-topnav-link:hover {
    background: var(--docs-surface-2);
    color: var(--docs-text);
  }

  .docs-menu-btn {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }
  .docs-menu-btn span {
    display: block;
    width: 22px;
    height: 2px;
    background: var(--docs-muted);
    border-radius: 99px;
  }

  /* ── Layout ── */
  .docs-layout {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    min-height: calc(100vh - 60px);
  }

  /* ── Sidebar ── */
  .docs-sidebar {
    width: var(--docs-sidebar-w);
    flex-shrink: 0;
    border-right: 1px solid var(--docs-border);
    position: sticky;
    top: 60px;
    height: calc(100vh - 60px);
    overflow-y: auto;
    background: var(--docs-surface);
  }
  .docs-sidebar-inner {
    padding: 28px 16px 48px;
  }
  .docs-sidebar-eyebrow {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--docs-accent);
    margin-bottom: 20px;
    padding: 0 8px;
  }
  .docs-nav-group {
    margin-bottom: 24px;
  }
  .docs-nav-group-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--docs-muted);
    padding: 0 8px;
    margin-bottom: 4px;
  }
  .docs-nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .docs-nav-item {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 7px 12px;
    border-radius: 8px;
    font-size: 0.875rem;
    color: var(--docs-muted);
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--docs-font);
  }
  .docs-nav-item:hover {
    background: var(--docs-surface-2);
    color: var(--docs-text);
  }
  .docs-nav-item.active {
    background: var(--docs-accent-glow);
    color: var(--docs-accent);
    font-weight: 600;
  }

  /* ── Main ── */
  .docs-main {
    flex: 1;
    min-width: 0;
    padding: 0 48px 80px;
    max-width: 900px;
  }

  /* ── Hero ── */
  .docs-hero {
    padding: 56px 0 48px;
    border-bottom: 1px solid var(--docs-border);
    margin-bottom: 0;
  }
  .docs-hero-title {
    font-family: var(--docs-font);
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--docs-text);
    margin: 16px 0 16px;
    line-height: 1.1;
  }
  .docs-hero-sub {
    font-size: 1.1rem;
    color: var(--docs-muted);
    max-width: 640px;
    line-height: 1.65;
    margin: 0 0 24px;
  }
  .docs-hero-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .docs-chip {
    padding: 6px 14px;
    background: var(--docs-surface-2);
    border: 1px solid var(--docs-border);
    border-radius: 99px;
    font-size: 0.8rem;
    color: var(--docs-muted);
    font-weight: 500;
  }

  /* ── Sections ── */
  .docs-section {
    padding: 56px 0 0;
    border-top: 1px solid var(--docs-border);
    margin-top: 0;
  }
  .docs-section:first-of-type {
    border-top: none;
  }
  .docs-section-title {
    font-family: var(--docs-font);
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--docs-text);
    margin-bottom: 20px;
  }
  .docs-h3 {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--docs-text);
    margin: 28px 0 12px;
  }
  .docs-prose {
    font-size: 0.975rem;
    line-height: 1.75;
    color: var(--docs-muted);
    margin-bottom: 16px;
  }
  .docs-prose strong, .docs-prose em {
    color: var(--docs-text);
  }
  .docs-list {
    padding-left: 20px;
    margin: 0 0 16px;
    color: var(--docs-muted);
    font-size: 0.95rem;
    line-height: 1.75;
  }
  .docs-list--ordered {
    list-style: decimal;
  }
  .docs-list:not(.docs-list--ordered) {
    list-style: disc;
  }
  .docs-list li {
    margin-bottom: 6px;
  }
  .docs-list strong {
    color: var(--docs-text);
  }
  .docs-inline-code {
    font-family: var(--docs-mono);
    font-size: 0.82em;
    background: var(--docs-surface-2);
    border: 1px solid var(--docs-border);
    border-radius: 5px;
    padding: 1px 6px;
    color: var(--docs-accent);
  }
  .docs-inline-link {
    color: var(--docs-accent);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    font-size: inherit;
  }
  .docs-inline-link:hover {
    text-decoration: underline;
  }

  /* ── Code block ── */
  .docs-code-block {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--docs-border);
    margin: 16px 0 24px;
    background: #090d18;
  }
  :root:not(.dark) .docs-code-block {
    background: #1e2535;
  }
  .docs-code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: rgba(255,255,255,0.04);
    border-bottom: 1px solid var(--docs-border);
  }
  .docs-code-lang {
    font-family: var(--docs-mono);
    font-size: 0.75rem;
    color: var(--docs-muted);
    letter-spacing: 0.04em;
  }
  .docs-copy-btn {
    background: none;
    border: 1px solid var(--docs-border);
    border-radius: 6px;
    color: var(--docs-muted);
    font-size: 0.75rem;
    cursor: pointer;
    padding: 3px 10px;
    transition: all 0.15s;
    font-family: var(--docs-font);
  }
  .docs-copy-btn:hover {
    background: var(--docs-surface-2);
    color: var(--docs-text);
  }
  .docs-code-pre {
    padding: 20px;
    overflow-x: auto;
    margin: 0;
    font-family: var(--docs-mono);
    font-size: 0.82rem;
    line-height: 1.65;
    color: #c3cfe8;
  }
  .docs-code-pre code {
    font-family: inherit;
    white-space: pre;
  }

  /* ── Callout ── */
  .docs-callout {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 16px 18px;
    border-radius: 10px;
    border: 1px solid;
    font-size: 0.9rem;
    line-height: 1.65;
    margin: 16px 0 24px;
  }
  .docs-callout-icon {
    font-size: 1rem;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .docs-callout-info {
    background: rgba(79,142,247,0.08);
    border-color: rgba(79,142,247,0.2);
    color: #93c5fd;
  }
  :root:not(.dark) .docs-callout-info {
    background: rgba(37,99,235,0.06);
    border-color: rgba(37,99,235,0.2);
    color: #1e40af;
  }
  .docs-callout-warning {
    background: rgba(251,191,36,0.08);
    border-color: rgba(251,191,36,0.2);
    color: #fcd34d;
  }
  :root:not(.dark) .docs-callout-warning {
    color: #92400e;
    background: rgba(251,191,36,0.1);
    border-color: rgba(251,191,36,0.3);
  }
  .docs-callout-tip {
    background: rgba(52,211,153,0.07);
    border-color: rgba(52,211,153,0.2);
    color: #6ee7b7;
  }
  :root:not(.dark) .docs-callout-tip {
    color: #065f46;
    background: rgba(52,211,153,0.08);
    border-color: rgba(52,211,153,0.25);
  }
  .docs-callout a, .docs-callout button {
    color: inherit;
    font-weight: 600;
    text-decoration: underline;
  }

  /* ── Endpoint bar ── */
  .docs-endpoint-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--docs-surface-2);
    border: 1px solid var(--docs-border);
    border-radius: 10px;
    padding: 12px 18px;
    margin-bottom: 20px;
  }
  .docs-endpoint-path {
    font-family: var(--docs-mono);
    font-size: 0.9rem;
    color: var(--docs-text);
    flex: 1;
  }

  /* ── Response fields ── */
  .docs-fields {
    border: 1px solid var(--docs-border);
    border-radius: 10px;
    overflow: hidden;
    margin: 16px 0 24px;
  }
  .docs-response-field {
    padding: 16px 18px;
    border-bottom: 1px solid var(--docs-border);
  }
  .docs-response-field:last-child {
    border-bottom: none;
  }
  .docs-field-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .docs-field-name {
    font-family: var(--docs-mono);
    font-size: 0.85rem;
    color: var(--docs-accent);
    background: var(--docs-accent-glow);
    padding: 2px 8px;
    border-radius: 5px;
    border: 1px solid rgba(79,142,247,0.2);
  }
  .docs-field-type {
    font-size: 0.78rem;
    color: var(--docs-muted);
    border: 1px solid var(--docs-border);
    padding: 1px 6px;
    border-radius: 5px;
    font-family: var(--docs-mono);
  }
  .docs-field-required {
    font-size: 0.72rem;
    color: #f87171;
    border: 1px solid rgba(248,113,113,0.3);
    background: rgba(248,113,113,0.08);
    padding: 1px 8px;
    border-radius: 5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .docs-field-desc {
    font-size: 0.87rem;
    color: var(--docs-muted);
    line-height: 1.6;
    margin: 0;
  }

  /* ── Table ── */
  .docs-table-wrap {
    overflow-x: auto;
    margin: 16px 0 24px;
    border: 1px solid var(--docs-border);
    border-radius: 10px;
    overflow: hidden;
  }
  .docs-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .docs-table th {
    text-align: left;
    padding: 12px 16px;
    background: var(--docs-surface-2);
    color: var(--docs-muted);
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid var(--docs-border);
  }
  .docs-table td {
    padding: 12px 16px;
    color: var(--docs-muted);
    border-bottom: 1px solid var(--docs-border);
    line-height: 1.55;
  }
  .docs-table tr:last-child td {
    border-bottom: none;
  }
  .docs-table code {
    font-family: var(--docs-mono);
    font-size: 0.8em;
    color: var(--docs-accent);
  }

  /* ── Status badges ── */
  .docs-status {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 0.78rem;
    font-weight: 600;
  }
  .docs-status--active {
    background: rgba(52,211,153,0.12);
    color: #34d399;
    border: 1px solid rgba(52,211,153,0.25);
  }

  /* ── Platform cards ── */
  .docs-platform-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin: 20px 0 24px;
  }
  .docs-platform-card {
    background: var(--docs-surface-2);
    border: 1px solid var(--docs-border);
    border-radius: 12px;
    padding: 18px;
  }
  .docs-platform-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 8px;
    border-width: 1px;
    border-style: solid;
    font-weight: 700;
    font-size: 0.85rem;
    margin-bottom: 12px;
  }
  .docs-platform-fields {
    font-size: 0.82rem;
    color: var(--docs-muted);
    margin-bottom: 10px;
    line-height: 1.7;
  }
  .docs-platform-fraud {
    font-size: 0.82rem;
    color: var(--docs-muted);
    line-height: 1.6;
  }
  .docs-platform-fraud strong {
    color: var(--docs-text);
  }

  /* ── Score grid ── */
  .docs-score-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid var(--docs-border);
    border-radius: 10px;
    overflow: hidden;
    margin: 16px 0 24px;
  }
  .docs-score-row {
    display: grid;
    grid-template-columns: 90px 80px 1fr;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    border-bottom: 1px solid var(--docs-border);
    font-size: 0.875rem;
  }
  .docs-score-row:last-child {
    border-bottom: none;
  }
  .docs-score-row p {
    color: var(--docs-muted);
    margin: 0;
  }
  .docs-score-row strong {
    color: var(--docs-text);
  }
  .docs-score-range {
    font-family: var(--docs-mono);
    font-size: 0.8em;
    color: var(--docs-accent);
    background: var(--docs-accent-glow);
    padding: 3px 8px;
    border-radius: 6px;
  }

  /* ── Footer ── */
  .docs-footer {
    margin-top: 80px;
    padding-top: 32px;
    border-top: 1px solid var(--docs-border);
    font-size: 0.85rem;
    color: var(--docs-muted);
    text-align: center;
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .docs-sidebar {
      position: fixed;
      top: 60px;
      left: 0;
      height: calc(100vh - 60px);
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      z-index: 40;
      width: 280px;
      box-shadow: 4px 0 24px rgba(0,0,0,0.3);
    }
    .docs-sidebar.open {
      transform: translateX(0);
    }
    .docs-menu-btn {
      display: flex;
    }
    .docs-topnav {
      display: none;
    }
    .docs-main {
      padding: 0 20px 80px;
    }
    .docs-score-row {
      grid-template-columns: 80px 70px 1fr;
      gap: 10px;
    }
  }
`;
