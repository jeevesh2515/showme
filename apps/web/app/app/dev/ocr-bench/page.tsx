"use client";

// Dev-only OCR timing bench (Day 3 Phase 5). Returns 404 in production (notFound below).
import { notFound } from "next/navigation";
import { useState } from "react";

import { recognize } from "../../../../lib/redaction/worker";

const FIXTURES = ["billing.png", "login_mobile.png", "settings.png"];

type Row = { fixture: string; ms: number; lines: number };

export default function OcrBenchPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  if (process.env.NODE_ENV === "production") notFound();

  async function run() {
    setRunning(true);
    setError("");
    setRows([]);
    try {
      for (const fixture of FIXTURES) {
        const blob = await (await fetch(`/ocr-bench/${fixture}`)).blob();
        const result = await recognize(blob);
        setRows((prev) => [...prev, { fixture, ms: result.ms, lines: result.lines.length }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>OCR bench (dev only)</h1>
      <p>Runs the self-hosted tesseract.js worker on three synthetic fixtures. Record the timings in docs/MEMORY.md assumption A4.</p>
      <button onClick={run} disabled={running} style={{ minHeight: 48, padding: "0 20px" }}>
        {running ? "Running..." : "Run OCR bench"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
      <ul>
        {rows.map((row) => (
          <li key={row.fixture}>
            {row.fixture}: {row.ms} ms, {row.lines} lines
          </li>
        ))}
      </ul>
    </main>
  );
}
