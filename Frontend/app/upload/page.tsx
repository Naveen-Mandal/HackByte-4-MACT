"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  Briefcase, 
  Rocket, 
  Star,
  ChevronDown, 
  ExternalLink, 
  Shield, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";
import { FaGithub } from "react-icons/fa6";
import { SiLeetcode, SiCodeforces, SiCodechef } from "react-icons/si";

export default function UploadDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "analyzing" | "complete" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [report, setReport] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      submitResume(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      submitResume(selected);
    }
  };

  const submitResume = async (selectedFile: File) => {
    setStatus("analyzing");
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.append("resume", selectedFile);
      const response = await fetch("http://127.0.0.1:4000/api/analyze-resume", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || json.message || "Failed to analyze resume.");
      setReport(json.data.verificationReport);
      setStatus("complete");
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Connection refused to backend on port 4000.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen relative bg-(--surface-base) selection:bg-brand-800 selection:text-white">
      {/* Navbar */}
      <nav className="w-full p-6 flex justify-between items-center border-b border-(--surface-dim)">
        <Link href="/" className="font-display font-bold text-xl tracking-tighter text-brand-900 dark:text-white">
          Verif<span className="text-brand-500">AI</span>
        </Link>
        <ThemeToggle />
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <AnimatePresence mode="wait">
          {(status === "idle" || status === "error") && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center mt-20"
            >
              <h1 className="font-display text-4xl font-bold mb-8 text-(--on-surface)">Upload Candidate Profile</h1>
              {status === "error" && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900 flex items-center gap-3">
                  <AlertTriangle size={20} />
                  <p>{errorMessage}</p>
                </div>
              )}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="glass-panel w-full max-w-lg aspect-video flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-300 cursor-pointer hover:border-brand-800 transition-colors group"
              >
                <div className="p-4 rounded-full bg-(--surface-dim) mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} className="text-brand-800" />
                </div>
                <p className="font-semibold text-lg text-(--on-surface)">Click or drag resume here</p>
                <p className="text-sm text-(--on-surface-muted) mt-1">Accepts PDF files up to 5MB</p>
                <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              </div>
            </motion.div>
          )}

          {status === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center mt-32 space-y-6"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-(--surface-dim)"></div>
                <div className="absolute inset-0 rounded-full border-4 border-brand-800 border-t-transparent animate-spin"></div>
              </div>
              <div className="text-center">
                <h2 className="font-display text-2xl font-semibold text-(--on-surface)">Running Verification Protocol</h2>
                <p className="text-(--on-surface-muted) mt-2">Connecting to backend APIs to parse and verify...</p>
              </div>
            </motion.div>
          )}

          {status === "complete" && report && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-32"
            >
              {/* ── Header ────────────────────────────────────────── */}
              <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-(--surface-dim) pb-6 gap-4">
                <div>
                  <h1 className="font-display text-4xl font-bold text-(--on-surface)">{report.candidate?.name || "Unknown Candidate"}</h1>
                  <p className="text-(--on-surface-muted) text-lg">{report.candidate?.email || "No Email Provided"}</p>
                </div>
                <div className="px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-100 flex items-center gap-2 font-semibold">
                  <CheckCircle size={18} /> Verified
                </div>
              </header>

              {/* ── 1. AI Snapshot ────────────────────────────────── */}
              <AISnapshot review={report.finalAutomatedReview} />

              {/* ── 2. Coding Profiles (Order Corrected) ──────────── */}
              <CodingProfilesPanel data={report.codingProfilesVerification} />

              {/* ── 3. Internships (If any) ────────────────────────── */}
              {report.internships?.length > 0 && (
                <InternshipsPanel data={report.internships} />
              )}

              {/* ── 4. Project Verifications ──────────────────────── */}
              <GitHubPanel data={report.githubAnalytics} skillDecay={report.skillDecay} />

              {/* ── 5. ATS Score (Last) ────────────────────────────── */}
              <ATSPanel data={report.atsAnalysis} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

const probStyles: Record<string, string> = {
  "Strong": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800",
  "Good": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  "Moderate": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  "Low": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  "Very Low": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800",
};

function AISnapshot({ review }: { review: any }) {
  if (!review || typeof review !== "object") return null;

  const { strengths = [], cautions = [], redFlags = [], verdict, hiringProbability } = review;

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden w-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold font-display text-(--on-surface)">Executive Summary</h3>
          {verdict && <p className="text-sm text-(--on-surface-muted) mt-1 italic">{verdict}</p>}
        </div>
        <div className={cn("px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider", probStyles[hiringProbability] || probStyles["Moderate"])}>
          Prob: {hiringProbability || "Unknown"}
        </div>
      </div>

      <div className="space-y-4">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {strengths.map((s: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs border border-green-100 dark:border-green-900/40">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Cautions */}
        {cautions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cautions.map((c: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs border border-amber-100 dark:border-amber-900/40">
                {c}
              </span>
            ))}
          </div>
        )}

        {/* Red Flags */}
        {redFlags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {redFlags.map((r: string, i: number) => (
              <span key={i} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs border border-red-100 dark:border-red-900/40">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CodingProfilesPanel({ data }: { data: any }) {
  const lc = data?.results?.leetcode;
  const cf = data?.results?.codeforces;
  const cc = data?.results?.codechef;

  if (!lc && !cf && !cc) return null;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden w-full border border-(--surface-dim)">
      <div className="px-6 py-4 bg-(--surface-dim)/30 border-b border-(--surface-dim) flex items-center gap-2">
        <TrendingUp size={18} className="text-brand-500" />
        <h3 className="font-bold text-lg font-display text-(--on-surface)">Technical Rankings</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-(--surface-dim)">
        <ProfileCell title="LeetCode" icon={<SiLeetcode className="text-orange-500" />} data={lc} 
          metrics={[
            { label: "Solved", value: lc?.actual?.totalSolved },
            { label: "Rating", value: lc?.actual?.currentRating }
          ]}
        />
        <ProfileCell title="Codeforces" icon={<SiCodeforces className="text-blue-500" />} data={cf}
          metrics={[
            { label: "Rating", value: cf?.actual?.currentRating || cf?.actual?.rating },
            { label: "Rank", value: cf?.actual?.rank, isText: true }
          ]}
        />
        <ProfileCell title="CodeChef" icon={<SiCodechef className="text-amber-600" />} data={cc}
          metrics={[
            { label: "Stars", value: cc?.actual?.stars, isText: true },
            { label: "Rating", value: cc?.actual?.currentRating }
          ]}
        />
      </div>
    </div>
  );
}

function ProfileCell({ title, icon, data, metrics }: { title: string, icon: any, data: any, metrics: any[] }) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="font-bold text-sm text-(--on-surface)">{title}</span>
      </div>
      {!data ? (
        <p className="text-xs text-(--on-surface-muted)">Not found</p>
      ) : data.error ? (
        <p className="text-xs text-red-500 italic">{data.error}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((m, i) => (
              <div key={i}>
                <p className="text-[10px] uppercase tracking-wider text-(--on-surface-muted)">{m.label}</p>
                <p className={cn("font-bold text-brand-800 dark:text-brand-500", m.isText ? "text-sm" : "text-xl")}>
                  {m.value ?? "—"}
                </p>
              </div>
            ))}
          </div>
          {/* Claims Check */}
          {data.claims && (
            <div className="pt-3 border-t border-(--surface-dim) space-y-1">
              {Object.entries(data.claims).slice(0, 3).map(([k, v]: any, i) => {
                const disputed = data.mismatches?.some((m: string) => m.toLowerCase().includes(k.toLowerCase()));
                return (
                  <div key={i} className="flex justify-between items-center text-[10px]">
                    <span className="text-(--on-surface-muted) capitalize">{k}</span>
                    <span className={cn("font-bold", disputed ? "text-red-500" : "text-green-500")}>
                      {String(v)} {disputed ? "❌" : "✅"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InternshipsPanel({ data }: { data: any[] }) {
  return (
    <div className="glass-panel p-6 rounded-2xl w-full">
      <div className="flex items-center gap-2 mb-6 text-(--on-surface)">
        <Briefcase size={20} className="text-brand-500" />
        <h3 className="text-lg font-bold font-display">Work Experience</h3>
      </div>
      <div className="space-y-6">
        {data.map((job, i) => (
          <div key={i} className="relative pl-6 border-l-2 border-brand-200 dark:border-brand-800">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-500 border-4 border-(--surface-base)" />
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-(--on-surface)">{job.where}</h4>
              <span className="text-xs font-medium text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded">{job.time}</span>
            </div>
            <p className="text-sm text-(--on-surface-muted) leading-relaxed">{job.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GitHubPanel({ data, skillDecay }: { data: any, skillDecay: any[] }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden w-full">
      <div className="px-6 py-4 bg-(--surface-dim)/30 border-b border-(--surface-dim) flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaGithub className="text-(--on-surface)" size={18} />
          <h3 className="font-bold text-lg font-display text-(--on-surface)">Project Verifications</h3>
        </div>
        {data?.profile && (
          <span className="text-xs font-bold text-brand-800 dark:text-brand-500">@{data.profile.username}</span>
        )}
      </div>
      <div className="divide-y divide-(--surface-dim)">
        {data?.matches?.map((ga: any, i: number) => (
          <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Rocket size={16} className="text-brand-500" />
                <h4 className="font-bold text-(--on-surface)">{ga.project || ga.repo}</h4>
              </div>
              <p className="text-xs text-(--on-surface-muted) line-clamp-1">{ga.codeVerification || "Code authenticity analysis active."}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] uppercase text-(--on-surface-muted)">Match Score</p>
                <p className={cn("font-bold", ga.matchScore > 70 ? "text-green-500" : "text-amber-500")}>
                  {Math.round(ga.matchScore)}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600">
                <CheckCircle size={20} />
              </div>
            </div>
          </div>
        ))}
        {!data?.matches?.length && !data?.error && (
          <p className="p-6 text-sm text-(--on-surface-muted) italic">No primary project matches verified.</p>
        )}
        {data?.error && (
          <p className="p-6 text-sm text-red-500 italic">{data.error}</p>
        )}
      </div>
      {skillDecay?.length > 0 && (
        <div className="p-6 bg-(--surface-dim)/10 border-t border-(--surface-dim)">
          <p className="text-[10px] uppercase font-bold tracking-widest text-(--on-surface-muted) mb-3 text-center">Skill Continuity Index</p>
          <div className="flex flex-wrap justify-center gap-2">
            {skillDecay.slice(0, 8).map((sd, i) => (
              <div key={i} className="px-3 py-1 rounded-full bg-(--surface-dim) border border-(--surface-dim) flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-[10px] font-bold text-(--on-surface)">{sd.skill}</span>
                <span className="text-[9px] text-(--on-surface-muted)">{sd.lastUsed || "Recent"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ATSPanel({ data }: { data: any }) {
  const score = data?.atsScore || 0;
  const scoreStyles = score > 80 ? "text-green-500" : score > 50 ? "text-amber-500" : "text-red-500";

  return (
    <div className="glass-panel p-6 rounded-2xl w-full border-t-4 border-brand-800">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-(--surface-dim)" />
            <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * score) / 100} className={scoreStyles} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-black", scoreStyles)}>{score}</span>
            <span className="text-[10px] font-bold text-(--on-surface-muted)">/ 100</span>
          </div>
        </div>

        <div className="flex-1 w-full translate-y-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} className="text-brand-500" />
            <h3 className="text-lg font-bold font-display text-(--on-surface)">ATS Optimization</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data?.issues?.length > 0 ? (
              data.issues.slice(0, 6).map((iss: any, i: number) => {
                const sev = iss.severity?.toLowerCase();
                const sevColor = sev === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : sev === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
                return (
                  <div key={i} className={cn("text-[10px] font-bold px-2 py-1 rounded border border-transparent", sevColor)}>
                    {iss.issue}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-(--on-surface-muted) italic">No formatting issues detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
