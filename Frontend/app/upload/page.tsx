"use client";

import { useState } from "react";

export default function UploadDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [extractData, setExtractData] = useState<any>(null);
  const [leetcodeData, setLeetcodeData] = useState<any>(null);
  const [codeforcesData, setCodeforcesData] = useState<any>(null);
  const [codechefData, setCodechefData] = useState<any>(null);
  const [analyzeData, setAnalyzeData] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    
    setExtractData(null);
    setLeetcodeData(null);
    setCodeforcesData(null);
    setCodechefData(null);
    setAnalyzeData(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", file);
      
      const extractRes = await fetch("http://65.20.88.66:4000/api/analyze-resume/extract", {
        method: "POST",
        body: formData,
      });
      
      const extractJson = await extractRes.json();
      setExtractData(extractJson);

      const lcData = extractJson?.data?.extractedData?.codingProfiles?.leetcode;
      const cfData = extractJson?.data?.extractedData?.codingProfiles?.codeforces;
      const ccData = extractJson?.data?.extractedData?.codingProfiles?.codechef;

      if (lcData?.username) {
        fetch("http://65.20.88.66:4000/api/verify/leetcode", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lcData)
        }).then(r => r.json()).then(setLeetcodeData).catch(e => setLeetcodeData({ error: e.message }));
      }
      
      if (cfData?.username) {
        fetch("http://65.20.88.66:4000/api/verify/codeforces", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfData)
        }).then(r => r.json()).then(setCodeforcesData).catch(e => setCodeforcesData({ error: e.message }));
      }
      
      if (ccData?.username) {
        fetch("http://65.20.88.66:4000/api/verify/codechef", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ccData)
        }).then(r => r.json()).then(setCodechefData).catch(e => setCodechefData({ error: e.message }));
      }

      fetch("http://65.20.88.66:4000/api/analyze-resume", {
        method: "POST", body: formData,
      }).then(r => r.json()).then(setAnalyzeData).catch(e => setAnalyzeData({ error: e.message }));

    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="p-8 font-mono text-sm max-w-6xl mx-auto space-y-8 text-(--on-surface) min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Raw API Testing UI</h1>
      
      <div className="flex gap-4 items-center mb-4">
        <input 
          type="file" 
          accept="application/pdf" 
          onChange={handleFileChange} 
          className="border border-(--surface-dim) p-2 w-full" 
        />
        <button 
          onClick={handleSubmit} 
          disabled={!file}
          className="px-6 py-2 border border-(--surface-dim) hover:bg-(--surface-dim)/10 font-bold rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
      
      {error && <div className="text-red-500 font-bold">Error: {error}</div>}

      {extractData && (
        <div className="border border-(--surface-dim) p-4 bg-(--surface-dim)/10 rounded">
          <h2 className="font-bold text-lg mb-2 text-brand-500">1. POST /api/analyze-resume/extract</h2>
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">{JSON.stringify(extractData, null, 2)}</pre>
        </div>
      )}

      {leetcodeData && (
        <div className="border border-(--surface-dim) p-4 bg-(--surface-dim)/10 rounded">
          <h2 className="font-bold text-lg mb-2 text-brand-500">2. POST /api/verify/leetcode</h2>
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">{JSON.stringify(leetcodeData, null, 2)}</pre>
        </div>
      )}

      {codeforcesData && (
        <div className="border border-(--surface-dim) p-4 bg-(--surface-dim)/10 rounded">
          <h2 className="font-bold text-lg mb-2 text-brand-500">3. POST /api/verify/codeforces</h2>
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">{JSON.stringify(codeforcesData, null, 2)}</pre>
        </div>
      )}

      {codechefData && (
        <div className="border border-(--surface-dim) p-4 bg-(--surface-dim)/10 rounded">
          <h2 className="font-bold text-lg mb-2 text-brand-500">4. POST /api/verify/codechef</h2>
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">{JSON.stringify(codechefData, null, 2)}</pre>
        </div>
      )}

      {analyzeData && (
        <div className="border border-(--surface-dim) p-4 bg-(--surface-dim)/10 rounded">
          <h2 className="font-bold text-lg mb-2 text-brand-500">5. POST /api/analyze-resume (Full Analysis)</h2>
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-xs">{JSON.stringify(analyzeData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
