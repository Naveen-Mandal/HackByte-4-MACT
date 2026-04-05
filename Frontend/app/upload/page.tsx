"use client";

import { useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://65.20.88.66:4000";

type JsonValue = Record<string, unknown>;

const STAGE_LABELS = [
  "Checking backend connectivity",
  "Extracting resume data",
  "Verifying coding profiles",
  "Running full resume analysis",
  "Finalizing results",
];

function createResumeFormData(file: File) {
  const formData = new FormData();
  formData.append("resume", file);
  return formData;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new Error(
      `Could not reach the backend at ${API_BASE_URL}. The backend is not listening on that port, or it stopped during analysis. Make sure the backend server is running and the API base URL is correct.`,
    );
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload as T;
}

async function fetchJsonWithRetry<T>(
  path: string,
  init: RequestInit | undefined,
  options: { retries?: number; delayMs?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 0;
  const delayMs = options.delayMs ?? 1200;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchJson<T>(path, init);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isNetworkError =
        message.includes("Could not reach the backend") ||
        message.includes("Failed to fetch");

      if (!isNetworkError || attempt === retries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw new Error("Unexpected retry exhaustion.");
}

function ResultCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-(--surface-dim) p-4 bg-(--surface-dim)/10 rounded-xl shadow-sm">
      <h2 className="font-bold text-lg mb-2 text-brand-500">{title}</h2>
      {children}
    </div>
  );
}

export default function UploadDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [extractData, setExtractData] = useState<JsonValue | null>(null);
  const [leetcodeData, setLeetcodeData] = useState<JsonValue | null>(null);
  const [codeforcesData, setCodeforcesData] = useState<JsonValue | null>(null);
  const [codechefData, setCodechefData] = useState<JsonValue | null>(null);
  const [analyzeData, setAnalyzeData] = useState<JsonValue | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stageIndex, setStageIndex] = useState<number>(-1);
  const [statusMessage, setStatusMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!file || isSubmitting) {
      return;
    }

    setExtractData(null);
    setLeetcodeData(null);
    setCodeforcesData(null);
    setCodechefData(null);
    setAnalyzeData(null);
    setError("");
    setIsSubmitting(true);

    try {
      setStageIndex(0);
      setStatusMessage("Checking backend status before upload.");
      await fetchJson<{ success: boolean; message: string }>("/health");

      setStageIndex(1);
      setStatusMessage("Uploading PDF and extracting structured resume data.");
      const extractJson = await fetchJson<JsonValue>("/api/analyze-resume/extract", {
        method: "POST",
        body: createResumeFormData(file),
      });

      setExtractData(extractJson);

      const extractedData =
        typeof extractJson.data === "object" && extractJson.data !== null
          ? (extractJson.data as Record<string, unknown>).extractedData
          : null;
      const codingProfiles =
        typeof extractedData === "object" && extractedData !== null
          ? (extractedData as Record<string, unknown>).codingProfiles
          : null;
      const lcData =
        typeof codingProfiles === "object" && codingProfiles !== null
          ? (codingProfiles as Record<string, unknown>).leetcode
          : null;
      const cfData =
        typeof codingProfiles === "object" && codingProfiles !== null
          ? (codingProfiles as Record<string, unknown>).codeforces
          : null;
      const ccData =
        typeof codingProfiles === "object" && codingProfiles !== null
          ? (codingProfiles as Record<string, unknown>).codechef
          : null;

      setStageIndex(2);
      setStatusMessage("Cross-checking coding profile claims.");
      const profileRequests: Promise<void>[] = [];

      if (lcData && typeof lcData === "object" && "username" in lcData) {
        profileRequests.push(
          fetchJson<JsonValue>("/api/verify/leetcode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(lcData),
          })
            .then(setLeetcodeData)
            .catch((requestError: Error) => setLeetcodeData({ error: requestError.message })),
        );
      }

      if (cfData && typeof cfData === "object" && "username" in cfData) {
        profileRequests.push(
          fetchJson<JsonValue>("/api/verify/codeforces", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cfData),
          })
            .then(setCodeforcesData)
            .catch((requestError: Error) => setCodeforcesData({ error: requestError.message })),
        );
      }

      if (ccData && typeof ccData === "object" && "username" in ccData) {
        profileRequests.push(
          fetchJson<JsonValue>("/api/verify/codechef", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ccData),
          })
            .then(setCodechefData)
            .catch((requestError: Error) => setCodechefData({ error: requestError.message })),
        );
      }

      setStageIndex(3);
      setStatusMessage(
        "Running the full analysis pipeline. This can take a few minutes for larger resumes.",
      );

      const analyzeRequest = fetchJsonWithRetry<JsonValue>(
        "/api/analyze-resume",
        {
          method: "POST",
          body: createResumeFormData(file),
        },
        { retries: 2, delayMs: 1500 },
      ).then(setAnalyzeData);

      await Promise.all([...profileRequests, analyzeRequest]);

      setStageIndex(4);
      setStatusMessage("All checks finished successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error while uploading the resume.");
      setStatusMessage("");
      setStageIndex(-1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 font-mono text-sm max-w-6xl mx-auto space-y-8 text-(--on-surface) min-h-screen">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Resume Upload Console</h1>
        <p className="text-(--on-surface-muted)">
          Upload a PDF, watch each verification stage progress, and inspect the raw API payloads.
        </p>
      </div>

      <div className="border border-(--surface-dim) bg-(--surface-floating) rounded-2xl p-5 space-y-4 ambient-shadow">
        <div className="flex gap-4 items-center flex-col md:flex-row">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="border border-(--surface-dim) p-3 w-full rounded-lg bg-(--surface-base)"
          />
          <button
            onClick={handleSubmit}
            disabled={!file || isSubmitting}
            className="px-6 py-3 border border-(--surface-dim) hover:bg-(--surface-dim)/10 font-bold rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-40"
          >
            {isSubmitting ? "Processing..." : "Submit Resume"}
          </button>
        </div>

        {file && (
          <p className="text-(--on-surface-muted)">
            Selected file: <span className="text-(--on-surface)">{file.name}</span>
          </p>
        )}

        {isSubmitting && (
          <div className="rounded-2xl border border-brand-200/50 bg-brand-50/60 dark:bg-brand-950/30 p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-700 animate-spin" />
              <div className="space-y-1">
                <p className="font-semibold text-brand-800 dark:text-brand-200">
                  {statusMessage}
                </p>
                <p className="text-(--on-surface-muted)">
                  The first extraction is quick, but the full verification can take a few minutes while
                  GitHub and AI checks complete.
                </p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-5">
              {STAGE_LABELS.map((label, index) => {
                const isDone = stageIndex > index;
                const isCurrent = stageIndex === index;
                return (
                  <div
                    key={label}
                    className={`rounded-xl border px-3 py-3 text-xs leading-relaxed ${
                      isDone
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : isCurrent
                          ? "border-brand-400/40 bg-brand-500/10 text-brand-800 dark:text-brand-200"
                          : "border-(--surface-dim) bg-(--surface-base) text-(--on-surface-muted)"
                    }`}
                  >
                    <div className="font-bold mb-1">Step {index + 1}</div>
                    <div>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300 rounded-xl p-4 font-bold">
          Error: {error}
        </div>
      )}

      {extractData && (
        <ResultCard title="1. POST /api/analyze-resume/extract">
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">
            {JSON.stringify(extractData, null, 2)}
          </pre>
        </ResultCard>
      )}

      {leetcodeData && (
        <ResultCard title="2. POST /api/verify/leetcode">
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">
            {JSON.stringify(leetcodeData, null, 2)}
          </pre>
        </ResultCard>
      )}

      {codeforcesData && (
        <ResultCard title="3. POST /api/verify/codeforces">
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">
            {JSON.stringify(codeforcesData, null, 2)}
          </pre>
        </ResultCard>
      )}

      {codechefData && (
        <ResultCard title="4. POST /api/verify/codechef">
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">
            {JSON.stringify(codechefData, null, 2)}
          </pre>
        </ResultCard>
      )}

      {analyzeData && (
        <ResultCard title="5. POST /api/analyze-resume (Full Analysis)">
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">
            {JSON.stringify(analyzeData, null, 2)}
          </pre>
        </ResultCard>
      )}
    </div>
  );
}
