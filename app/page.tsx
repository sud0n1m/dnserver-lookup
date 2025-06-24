"use client";

import React, { useState } from "react";

export default function Home() {
  const [domains, setDomains] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [csvUrl, setCsvUrl] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResults([]);
    setCsvUrl(null);
    try {
      const response = await fetch("/api/analyze-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains: domains.split("\n").map(d => d.trim()).filter(Boolean) }),
      });
      const data = await response.json();
      setResults(data.results || []);
      // Generate CSV
      const csv = [
        ["Domain", "Uses Cloudflare", "Guessed Provider", "DNS Response"],
        ...data.results.map((r: any) => [r.domain, r.usesCloudflare ? "Yes" : "No", r.provider, r.dnsResponse]),
      ].map((row: any[]) => row.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      setCsvUrl(URL.createObjectURL(blob));
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-8 gap-8">
      <h1 className="text-2xl font-bold mb-4">DNS Server Lookup Utility</h1>
      <textarea
        className="w-full max-w-xl h-40 p-2 border rounded mb-4"
        placeholder="Enter one domain per line..."
        value={domains}
        onChange={e => setDomains(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
        onClick={handleAnalyze}
        disabled={loading || !domains.trim()}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>
      {results.length > 0 && (
        <div className="w-full max-w-3xl mt-8">
          <h2 className="text-lg font-semibold mb-2">Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Domain</th>
                  <th className="border px-2 py-1">Uses Cloudflare</th>
                  <th className="border px-2 py-1">Guessed Provider</th>
                  <th className="border px-2 py-1">DNS Response</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">{r.domain}</td>
                    <td className="border px-2 py-1">{r.usesCloudflare ? "Yes" : "No"}</td>
                    <td className="border px-2 py-1">{r.provider}</td>
                    <td className="border px-2 py-1 whitespace-pre-wrap max-w-xs">{r.dnsResponse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {csvUrl && (
            <a
              href={csvUrl}
              download="dns-results.csv"
              className="inline-block mt-4 bg-green-600 text-white px-4 py-2 rounded"
            >
              Download CSV
            </a>
          )}
        </div>
      )}
    </div>
  );
}
