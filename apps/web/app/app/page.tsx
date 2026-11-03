/* eslint-disable @next/next/no-img-element -- user screenshots are dynamic blobs, next/image cannot optimise them */
"use client";
// FLOW-1..13 + PRIV-2/4: start -> mandatory review -> step -> loop. History + goal live in tab memory only.
import { useCallback, useEffect, useRef, useState } from "react";
import Overlay from "../../components/Overlay";
import { createGuide, deleteGuide, refine, step as apiStep, ApiClientError, type HistoryItem, type PointPx, type RefineResponse, type StepResponse, type Target } from "../../lib/api/client";
import { appendHistory, progressText } from "../../lib/flow";
import { redact, type RedactedImage } from "../../lib/redaction/redact";
import { brushRegion, piiRegions, type OcrLine } from "../../lib/redaction/regions";
import type { Region } from "../../lib/redaction/types";
import { maskPii } from "../../lib/redaction/patterns";

type Phase = "start" | "review" | "looking" | "step" | "share";
type TrailStep = { id: number; n: number; instruction: string; status: StepResponse["status"]; caution: string; image: RedactedImage; target: Target | null; svgPath: string | null; svgOrigin: PointPx | null };
const BTN_PRIMARY = "type-body min-h-12 rounded-control bg-ink px-6 py-3 font-bold text-paper disabled:opacity-50";
const BTN_SECONDARY = "type-body min-h-12 rounded-control border-2 border-ink bg-paper px-5 py-2 font-bold text-ink hover:bg-mist";
const BTN_TOOLBAR = "type-body min-h-12 rounded-control border-2 border-ink bg-paper px-2 sm:px-5 py-2 font-bold text-ink hover:bg-mist";
const SHOT_HELP = [["iPhone", "side button + volume up."], ["Android", "power + volume down."], ["Windows", "Windows key + Shift + S."], ["Mac", "Command + Shift + 4."]] as const;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Pointer position as a 0-1 fraction of the element; clamped because pointer capture reports points outside it.
const frac = (e: React.PointerEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); return { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) }; };
const ERROR_COPY: Record<string, string> = {
  rate_limited: "ShowMe has had a lot of requests from this connection. Try again later.",
  spend_cap_reached: "ShowMe is resting until tomorrow so it stays free. Your screenshot was not sent.",
  invalid_image: "This file is not a picture we can read. Use a PNG or JPG screenshot.",
  image_too_large: "This file is not a picture we can read. Use a PNG or JPG screenshot.",
};

function errorCopy(err: unknown): string {
  const fallback = "That did not work on our side. Your screenshot was not saved. Try again.";
  if (!(err instanceof ApiClientError)) return fallback;
  if (err.code === "rate_limited" && err.retryAfterS) return `ShowMe has had a lot of requests from this connection. Try again in about ${Math.ceil(err.retryAfterS / 60)} minutes.`;
  return ERROR_COPY[err.code] ?? fallback;
}

export default function AppPage() {
  const [phase, setPhase] = useState<Phase>("start");
  const [dragging, setDragging] = useState(false);
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [lines, setLines] = useState<readonly OcrLine[]>([]);
  const [entries, setEntries] = useState<{ r: Region; manual: boolean }[]>([]);
  const [undone, setUndone] = useState<{ r: Region; manual: boolean }[]>([]);
  const [ocrFailed, setOcrFailed] = useState(false);
  const regions = entries.map((e) => e.r);
  const manualCount = entries.filter((e) => e.manual).length;
  const [brush, setBrush] = useState(false);
  const [draft, setDraft] = useState<{ x: number; y: number; x2: number; y2: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [trail, setTrail] = useState<TrailStep[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [consent, setConsent] = useState(false);
  const [created, setCreated] = useState<{ url: string; delete_key: string; expires_at: string; steps: number } | null>(null);
  const [shareError, setShareError] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guideDeleted, setGuideDeleted] = useState(false);
  const [current, setCurrent] = useState<StepResponse | null>(null);
  const [refinement, setRefinement] = useState<RefineResponse | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const redactedRef = useRef<RedactedImage | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const startedRef = useRef(0);
  const genRef = useRef(0); // B3: stale async results must never land on a newer screenshot
  const stepIdRef = useRef(0); // n is reused after a rejected step, so late outlines match on this id
  const shareBusyRef = useRef(false); // synchronous: two taps can land before a re-render disables the button

  // DESIGN §4.4: on phones, scroll the ring into the upper part of the view, above the docked card.
  useEffect(() => {
    if (phase !== "step") return;
    // On a short laptop window the taller review page leaves the step scrolled past the ring.
    if (!window.matchMedia("(max-width: 767px)").matches) { window.scrollTo({ top: 0 }); return; }
    const badge = document.querySelector('[data-testid="step-badge"]');
    const img = badge?.closest("div")?.querySelector("img");
    if (!badge || !img) return;
    // Measure only once the screenshot has its height; before load the badge sits at the top of an empty box.
    const go = () => {
      const top = badge.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.2;
      window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    };
    if (img.complete && img.naturalHeight > 0) go();
    else img.addEventListener("load", go, { once: true });
    return () => img.removeEventListener("load", go);
  }, [phase, current]);

  useEffect(() => {
    if (phase !== "looking") return;
    const t = setInterval(() => setElapsed(Date.now() - startedRef.current), 250);
    return () => clearInterval(t);
  }, [phase]);

  const loadImage = useCallback(async (file: Blob) => {
    const gen = ++genRef.current;
    setError("");
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setError(ERROR_COPY.invalid_image ?? ""); return; }
    if (file.size > 20 * 1024 * 1024) { setError(ERROR_COPY.invalid_image ?? ""); return; }
    // PRIV-2: drop the previous screenshot's review now, so Continue cannot redact this image with the old regions while OCR runs.
    bitmapRef.current = null; setEntries([]); setUndone([]); setLines([]); setPhase("start"); setChecking(true);
    try {
      const bitmap = await createImageBitmap(file);
      if (gen !== genRef.current) return;
      bitmapRef.current = bitmap;
      setImageUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
      const { recognize, terminateOcr } = await import("../../lib/redaction/worker");
      let ocrLines: readonly OcrLine[] = [];
      // shortcut: dense pages can stall tesseract for minutes; after 15s show review with no auto-blocks (user hides manually), upgrade to worker termination+retry if stalls recur.
      let failed = false;
      try { ocrLines = (await Promise.race([recognize(file), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("ocr timeout")), 15_000))])).lines; } catch (err) { failed = true; if (err instanceof Error && err.message === "ocr timeout") void terminateOcr(); }
      if (gen !== genRef.current) return;
      setOcrFailed(failed);
      setLines(ocrLines);
      setEntries(piiRegions(ocrLines).map((r) => ({ r, manual: false })));
      setPhase("review");
      setChecking(false);
    } catch { if (gen === genRef.current) { setError(ERROR_COPY.invalid_image ?? ""); setChecking(false); } }
  }, []);

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (file) void loadImage(file);
  }, [loadImage]);

  function hideLine(line: OcrLine) {
    setUndone([]);
    const r = { x: line.bbox.x0, y: line.bbox.y0, width: line.bbox.x1 - line.bbox.x0, height: line.bbox.y1 - line.bbox.y0 };
    // A double-tap must not stack two identical blocks: the second Undo would look broken.
    setEntries((prev) => (prev.some((e) => e.r.x === r.x && e.r.y === r.y && e.r.width === r.width && e.r.height === r.height) ? prev : [...prev, { r, manual: true }]));
  }

  // R3 safety net: one tap hides every line OCR could read, for when pattern matching missed private text.
  function hideAllLines() {
    setUndone([]);
    setEntries((prev) => {
      const seen = new Set(prev.map(({ r }) => `${r.x},${r.y},${r.width},${r.height}`));
      const add = lines
        .map((l) => ({ r: { x: l.bbox.x0, y: l.bbox.y0, width: l.bbox.x1 - l.bbox.x0, height: l.bbox.y1 - l.bbox.y0 }, manual: true }))
        .filter(({ r }) => !seen.has(`${r.x},${r.y},${r.width},${r.height}`));
      return [...prev, ...add];
    });
  }

  // FLOW-1: one-tap demo with a made-up billing screen (synthetic data); it goes through the same review as any upload.
  async function loadSample() {
    try {
      const res = await fetch("/examples/billing.png");
      if (!res.ok) throw new Error(String(res.status));
      setGoal((g) => g.trim() || "Cancel subscription");
      await loadImage(await res.blob());
    } catch { setError("The example picture did not load. Add your own screenshot instead."); }
  }

  async function continueReview() {
    const bitmap = bitmapRef.current;
    if (!bitmap) return;
    const gen = genRef.current;
    setError("");
    try {
      const redacted = redact(bitmap, regions, manualCount);
      redactedRef.current = redacted;
      setPhase("looking"); startedRef.current = Date.now(); setElapsed(0);
      window.scrollTo({ top: 0 }); // the review page is taller than this one, so the progress text would sit off-screen
      const result = await apiStep(redacted, maskPii(goal.trim()).slice(0, 300), history);
      if (gen !== genRef.current) return;
      setCurrent(result); setRefinement(null); setPhase("step");
      // PRIV-5: trail of redacted step images, tab memory only, for the opt-in share second review.
      const id = ++stepIdRef.current;
      setTrail((t) => [...t, { id, n: t.length + 1, instruction: result.instruction, status: result.status, caution: result.caution, image: redacted, target: result.target, svgPath: null, svgOrigin: null }]);
      if (result.target) {
        try {
          const r = await refine(redacted, result.target.box, result.target.point);
          if (gen === genRef.current) setRefinement(r);
          const svg = r.svg_path;
          if (svg) setTrail((t) => t.map((s) => (s.id === id ? { ...s, svgPath: svg, svgOrigin: r.origin ?? null } : s)));
        } catch { if (gen === genRef.current) setRefinement(null); }
      }
    } catch (err) {
      if (gen !== genRef.current) return;
      setPhase("review");
      setError(errorCopy(err));
    }
  }

  function nextWith(result: "done" | "failed") {
    genRef.current++; // this step's pending outline must not reach whatever is on screen next
    if (current) setHistory((h) => appendHistory(h, current, result));
    // A step the helper marked wrong must not reach the recipient; history keeps it so the model avoids repeating it.
    if (result === "failed") setTrail((t) => t.slice(0, -1));
    setCurrent(null); setRefinement(null); setPhase("start");
  }

  async function createLink() {
    if (shareBusyRef.current) return;
    shareBusyRef.current = true; setShareBusy(true);
    setShareError("");
    try {
      const res = await createGuide(maskPii(goal.trim()).slice(0, 300), trail, consent);
      setCreated({ ...res, steps: trail.length }); setGuideDeleted(false);
    } catch (err) {
      setShareError(
        err instanceof ApiClientError
          ? err.message || (ERROR_COPY[err.code] ?? "That did not work on our side. Your pictures were not shared. Try again.")
          : "That did not work on our side. Your pictures were not shared. Try again."
      );
    } finally { shareBusyRef.current = false; setShareBusy(false); }
  }

  async function deleteLink() {
    if (!created || shareBusyRef.current) return;
    shareBusyRef.current = true; setShareBusy(true);
    setShareError("");
    const token = created.url.split("/").pop() ?? "";
    try { await deleteGuide(token, created.delete_key); setCreated(null); setConsent(false); setGuideDeleted(true); } catch { setShareError("That did not work on our side. Try deleting again."); } finally { shareBusyRef.current = false; setShareBusy(false); }
  }

  // A live link stays on screen with its delete key: clearing it here would strand that link for 7 days.
  function openShare() {
    setChecked(trail.map(() => false)); setConsent(false); setShareError(""); setPhase("share");
  }

  function resetAll() {
    // The delete key lives only in this tab's state, so a live link cannot be deleted after this.
    if (created && !window.confirm("Start over? You will no longer be able to delete your shared link. It stays live until it expires.")) return;
    setHistory([]); setTrail([]); setCurrent(null); setRefinement(null); setCreated(null); setConsent(false); setChecked([]); setGuideDeleted(false); setGoal(""); setPhase("start");
  }

  function readAloud() {
    if (current && "speechSynthesis" in window) { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(current.instruction)); }
  }

  // DESIGN §5: N next, R read aloud, Esc cancel. Ignored while typing or with modifiers held.
  const shortcutRef = useRef<(e: KeyboardEvent) => void>(() => undefined);
  shortcutRef.current = (e) => {
    const t = e.target as HTMLElement | null;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    if (e.key === "Escape" && phase === "looking") { genRef.current++; setPhase("review"); return; }
    if (phase !== "step" || !current) return;
    if (e.key === "Escape") setPhase("start");
    else if (e.key === "r" || e.key === "R") readAloud();
    else if ((e.key === "n" || e.key === "N") && (current.status === "ok" || current.status === "unsure" || current.status === "not_visible")) nextWith("done");
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => shortcutRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const stepNumber = history.length + 1;
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 pt-2 pb-4 sm:px-6 sm:py-12" onPaste={onPaste}>
      <h1 className="sr-only">ShowMe</h1>
      {error && <p role="alert" className="type-body mb-6 rounded-panel bg-blush p-4 text-caution">{error}</p>}

      {checking && <p role="status" data-testid="ocr-checking" className="type-body mb-6 rounded-panel bg-sun p-4">Checking your picture for private details. This can take a few seconds.</p>}

      {phase === "start" && (
        <section className="mx-auto max-w-2xl">
          <label className="type-title block" htmlFor="goal">What do you want to do?</label>
          <p className="type-small mt-2">Turn a screenshot into a step-by-step guide you or someone you help can follow.</p>
          <input data-testid="goal-input" id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={300} placeholder="cancel my subscription" className="type-body mt-4 min-h-14 w-full rounded-control border-2 border-ink bg-paper px-4 py-3" />
          <label data-testid="drop-zone"
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) void loadImage(f); }}
            className={`mt-8 flex cursor-pointer flex-col items-center gap-4 rounded-panel border-2 border-dashed px-6 py-8 text-center sm:py-12 hover:bg-sun focus-within:bg-sun focus-within:border-ink focus-within:outline focus-within:outline-[3px] focus-within:outline-highlighter ${dragging ? "border-ink bg-sun" : "border-ink/40 bg-mist"}`}>
            <span className="type-instruction">Add a screenshot, or paste it here</span>
            <span className={`${BTN_PRIMARY} inline-flex items-center`}>Choose a picture</span>
            <span className="type-small [@media(pointer:coarse)]:hidden">You can also paste with Ctrl+V or Command+V, or drag a picture onto this box.</span>
            <input data-testid="file-input" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) void loadImage(f); }} />
          </label>
          <button data-testid="sample-demo-btn" type="button" onClick={() => void loadSample()} className="type-small mt-4 inline-flex min-h-12 items-center gap-3 rounded-control border-2 border-ink bg-sun px-4 py-2 font-bold text-ink hover:bg-highlighter">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 15h6" /><rect x="6" y="8" width="8" height="3" rx="1" /></svg>
            Try with an example billing screenshot
          </button>
          <details className="mt-8">
            <summary data-testid="screenshot-help" className="type-body cursor-pointer py-2 font-bold text-ink underline underline-offset-4">How do I take a screenshot?</summary>
            <ul className="type-small mt-4 grid gap-3 sm:grid-cols-2">
              {SHOT_HELP.map(([device, how]) => (<li key={device} className="rounded-panel bg-mist p-4"><strong>{device}:</strong> {how}</li>))}
            </ul>
          </details>
          <p className="type-small mt-8 flex items-start gap-3">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            Your screenshot stays on this device until you check it.
          </p>
          {history.length > 0 && <p className="type-small mt-3 rounded-panel bg-sun p-4">Step {stepNumber}. Add the next screenshot to continue.</p>}
        </section>
      )}

      {phase === "review" && (
        <section className="mx-auto max-w-3xl">
          <h2 className="type-title text-[1.5rem] sm:text-[2rem] leading-tight">Check what we will send</h2>
          <p className="type-body text-[1.125rem] sm:text-[1.25rem] leading-snug mt-1.5 sm:mt-3">We hid {regions.length - manualCount} {regions.length - manualCount === 1 ? "thing" : "things"} that looked private. Tap anything else you want hidden.</p>
          <p className="type-small mt-2">We find email addresses and long numbers automatically. Names, addresses and passwords are not hidden automatically. Hide them with the brush.</p>
          {brush && <p className="type-small mt-2 rounded-panel bg-sun p-3">Brush on: drag over anything private. Lift your finger to check the block, then Undo if it is in the wrong place.</p>}
          {ocrFailed ? <p className="type-small mt-2 rounded-panel bg-sun p-3 sm:mt-3 sm:p-4">We could not check this picture automatically. Check the picture and hide anything private yourself.</p> : lines.length === 0 && <p className="type-small mt-2 rounded-panel bg-sun p-3 sm:mt-3 sm:p-4">We could not find any text to hide automatically. Check the picture and hide anything private.</p>}
          <div className="mt-2 flex flex-wrap gap-1 sm:mt-6 sm:gap-3">
            <button data-testid="brush-toggle" aria-pressed={brush} onClick={() => setBrush((b) => !b)} className={`${BTN_TOOLBAR} ${brush ? "!bg-ink !text-paper" : ""}`}>{brush ? "Brush on" : "Brush"}</button>
            <button data-testid="undo-btn" disabled={entries.length === 0} onClick={() => { const last = entries.at(-1); if (!last) return; setEntries((r) => r.slice(0, -1)); setUndone((u) => [...u, last]); }} className={`${BTN_TOOLBAR} disabled:opacity-50`}>Undo</button>
            <button data-testid="redo-btn" disabled={undone.length === 0} onClick={() => { const next = undone.at(-1); if (!next) return; setUndone((u) => u.slice(0, -1)); setEntries((r) => [...r, next]); }} className={`${BTN_TOOLBAR} disabled:opacity-50`}>Redo</button>
            {lines.length > 0 && <button data-testid="hide-all-btn" onClick={hideAllLines} className={BTN_TOOLBAR}>Hide all text</button>}
            <button data-testid="zoom-in" onClick={() => setZoom((z) => Math.min(2, z + 0.25))} className={BTN_TOOLBAR}>Zoom in</button>
            <button data-testid="zoom-out" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className={BTN_TOOLBAR}>Zoom out</button>
          </div>
          <div className="relative mt-2 overflow-auto rounded-panel border-2 border-mist bg-mist p-2 sm:mt-6">
            <div style={{ width: `${zoom * 100}%` }} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img data-testid="review-image" src={imageUrl} alt="Your screenshot for checking" draggable={false} onDragStart={(e) => e.preventDefault()}
                className={`w-full select-none ${brush ? "cursor-crosshair touch-none" : "cursor-pointer"}`}
                onClick={(e) => {
                  const bm = bitmapRef.current;
                  if (brush || !bm) return;
                  // A11Y-7: phone-scaled lines are 2-7 px tall and a few px apart, so a tap hides the nearest line within 22 css px (a 44 px target) instead of needing an exact hit.
                  const rect = e.currentTarget.getBoundingClientRect(), s = bm.width / rect.width;
                  const x = (e.clientX - rect.left) * s, y = (e.clientY - rect.top) * s;
                  const dist = (l: OcrLine) => Math.hypot(Math.max(l.bbox.x0 - x, 0, x - l.bbox.x1), Math.max(l.bbox.y0 - y, 0, y - l.bbox.y1));
                  const best = lines.reduce<OcrLine | null>((a, l) => (!a || dist(l) < dist(a) ? l : a), null);
                  if (best && dist(best) <= 22 * s) hideLine(best);
                }}
                onPointerDown={(e) => { if (!brush) return; e.currentTarget.setPointerCapture(e.pointerId); const p = frac(e); dragRef.current = p; setDraft({ ...p, x2: p.x, y2: p.y }); }}
                onPointerMove={(e) => { const d = dragRef.current; if (!brush || !d) return; const p = frac(e); setDraft({ ...d, x2: p.x, y2: p.y }); }}
                onPointerCancel={() => { dragRef.current = null; setDraft(null); }}
                onPointerUp={(e) => {
                  const d = dragRef.current;
                  dragRef.current = null; setDraft(null);
                  if (!brush || !d || !bitmapRef.current) return;
                  const w = bitmapRef.current.width, h = bitmapRef.current.height, p = frac(e);
                  const nr = { x: Math.min(d.x, p.x) * w, y: Math.min(d.y, p.y) * h, width: Math.abs(p.x - d.x) * w, height: Math.abs(p.y - d.y) * h };
                  if (nr.width <= 2 || nr.height <= 2) return;
                  setUndone([]);
                  setEntries((prev) => [...prev, { r: brushRegion(nr, lines), manual: true }]);
                }} />
              {lines.map((line, i) => (
                <button key={i} data-testid="ocr-line" aria-label={`Hide: ${line.text}`}
                  style={{ left: `${(line.bbox.x0 / (bitmapRef.current?.width ?? 1)) * 100}%`, top: `${(line.bbox.y0 / (bitmapRef.current?.height ?? 1)) * 100}%`, width: `${((line.bbox.x1 - line.bbox.x0) / (bitmapRef.current?.width ?? 1)) * 100}%`, height: `${((line.bbox.y1 - line.bbox.y0) / (bitmapRef.current?.height ?? 1)) * 100}%` }}
                  // Pointer taps go to the image (nearest-line hit test); these buttons stay for keyboard and screen readers.
                  className="pointer-events-none absolute border border-ink/20"
                  onClick={() => hideLine(line)} />
              ))}
              {entries.map(({ r, manual }, i) => (
                <div key={i} data-testid="hidden-region" className="fade-in pointer-events-none absolute flex items-center justify-center overflow-hidden bg-ink" style={{ left: `${(r.x / (bitmapRef.current?.width ?? 1)) * 100}%`, top: `${(r.y / (bitmapRef.current?.height ?? 1)) * 100}%`, width: `${(r.width / (bitmapRef.current?.width ?? 1)) * 100}%`, height: `${(r.height / (bitmapRef.current?.height ?? 1)) * 100}%` }}>
                  {!manual && <svg aria-hidden="true" className="h-3 max-h-full w-3 text-highlighter" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
                </div>
              ))}
              {draft && <div aria-hidden="true" className="fade-in pointer-events-none absolute border-2 border-dashed border-ink bg-ink/30" style={{ left: `${Math.min(draft.x, draft.x2) * 100}%`, top: `${Math.min(draft.y, draft.y2) * 100}%`, width: `${Math.abs(draft.x2 - draft.x) * 100}%`, height: `${Math.abs(draft.y2 - draft.y) * 100}%` }} />}
            </div>
          </div>
          <p className="type-small mt-1 sm:mt-4">The only thing that leaves this device is what this screen shows.</p>
          <button data-testid="review-continue" disabled={!goal.trim()} onClick={() => void continueReview()} className={`${BTN_PRIMARY} mt-2 sm:mt-6 w-full`}>Looks private. Continue</button>
          {!goal.trim() && <p className="type-small mt-3">Go back and type what you want to do first.</p>}
        </section>
      )}

      {phase === "looking" && (
        <section className="mx-auto max-w-2xl">
          <p data-testid="progress-text" className="type-instruction" aria-live="polite">{progressText(elapsed)}</p>
          <div aria-hidden="true" className="mt-8 h-64 rounded-panel bg-mist motion-safe:animate-pulse" />
        </section>
      )}

      {phase === "step" && current && (
        <section className="md:grid md:grid-cols-[1fr_380px] md:grid-rows-[auto_1fr] md:gap-x-8">
          <div className="md:row-span-2">
            {current.status === "not_visible" ? (
              <div data-testid="not-visible-panel">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={redactedRef.current?.dataUrl ?? imageUrl} alt="Your screenshot" className="w-full rounded-panel border-2 border-mist" /><p className="type-body mt-4">{current.instruction}</p>{current.scroll_direction !== "none" && <p data-testid="scroll-arrow" className="type-instruction mt-3">Scroll {current.scroll_direction}</p>}</div>
            ) : current.status === "done" ? (
              <div data-testid="done-screen" className="rounded-panel bg-sage p-8"><p className="type-instruction text-done">You did it: {goal}</p><div className="mt-6 flex flex-wrap gap-3"><button data-testid="share-btn" onClick={openShare} className={BTN_PRIMARY}>Share these steps</button><button data-testid="start-new-btn" onClick={resetAll} className={BTN_SECONDARY}>Start something new</button></div></div>
            ) : current.status === "refuse" ? (
              <div data-testid="refuse-panel" className="rounded-panel border-2 border-mist bg-mist p-6"><p className="type-body">{current.instruction}</p></div>
            ) : bitmapRef.current && (
              <Overlay imageUrl={redactedRef.current?.dataUrl ?? imageUrl} width={redactedRef.current?.meta.width ?? bitmapRef.current.width} height={redactedRef.current?.meta.height ?? bitmapRef.current.height} step={current} refinement={refinement} stepNumber={stepNumber} />
            )}
          </div>
          {/* DESIGN §4.4: on phones the instruction and primary action dock at the bottom; the ring is scrolled into the upper part. */}
          <div aria-live="polite" className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 mt-6 border-t-2 border-ink bg-paper px-4 sm:px-6 py-3 md:py-4 md:static md:mx-0 md:mt-0 md:self-start md:rounded-panel md:border-2 md:border-mist md:p-6">
            <p className="type-small flex items-center gap-3 font-bold"><span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-highlighter text-ink">{stepNumber}</span><span>Step {stepNumber}</span></p>
            {current.caution && <p data-testid="caution-banner" className="type-body mt-3 flex items-start gap-3 rounded-panel bg-blush p-3 md:mt-4 md:p-4 text-caution"><svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17.5v.01" /></svg><span><strong>Careful:</strong> {current.caution.replace(/^careful:\s*/i, "")}</span></p>}
            {current.status === "unsure" && <p className="type-body mt-3 rounded-panel bg-sun p-3 md:mt-4 md:p-4">I think it is this one. Check before you tap.</p>}
            <p data-testid="step-instruction" className="type-instruction mt-3 md:mt-4">{current.instruction}</p>
            {current.type_text && <p className="type-body mt-2 md:mt-3">Type: {current.type_text}</p>}
            {current.status !== "done" && current.status !== "refuse" && <button data-testid="next-btn" onClick={() => nextWith("done")} className={`${BTN_PRIMARY} mt-3 md:mt-4 w-full`}>I did it, next</button>}
          </div>
          <div className="mt-6 md:col-start-2 md:mt-4 md:px-6">
            <button data-testid="read-aloud" onClick={readAloud} className={`${BTN_SECONDARY} w-full`}>Read it to me</button>
            {current.status !== "done" && current.status !== "refuse" && (<>
              <button data-testid="failed-btn" onClick={() => nextWith("failed")} className={`${BTN_SECONDARY} mt-3 w-full`}>That didn&apos;t work</button>
              <label className={`${BTN_SECONDARY} mt-3 flex w-full cursor-pointer items-center justify-center focus-within:outline focus-within:outline-[3px] focus-within:outline-highlighter`}>Add next screenshot<input data-testid="next-screenshot-input" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) { if (current && (current.status === "ok" || current.status === "unsure")) setHistory((h) => appendHistory(h, current, "done")); void loadImage(f); } }} /></label>
              {trail.length > 0 && (<>
                <p className="type-small mt-3">Each new screenshot adds one step. Together they become the guide path the other person follows in their own app.</p>
                <button data-testid="share-early-btn" onClick={openShare} className={`${BTN_SECONDARY} mt-3 w-full`}>Share guide ({trail.length} {trail.length === 1 ? "step" : "steps"})</button>
              </>)}
            </>)}
            <p data-testid="shortcut-help" className="type-small mt-6 [@media(pointer:coarse)]:hidden">Keyboard: N next step, R read aloud, Esc cancel</p>
            <button data-testid="start-over" onClick={resetAll} className="type-small mt-2 min-h-12 underline underline-offset-4">Start over</button>
          </div>
        </section>
      )}

      {phase === "share" && (
        <section className="mx-auto max-w-2xl">
          <h2 className="type-title">Share these steps</h2>
          <p className="type-body mt-3">Check each picture before sharing. These are the checked pictures from your steps, with private details hidden.</p>
          {trail.map((t, i) => (
            <div key={t.n} className="mt-8 rounded-panel border-2 border-mist bg-paper p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img data-testid={`share-image-${i}`} src={t.image.dataUrl} alt={`Step ${t.n}. ${t.instruction}`} className="w-full rounded-control" />
              <p className="type-body mt-4">Step {t.n}. {t.instruction}</p>
              <label className="type-body mt-3 flex min-h-12 items-center gap-3">
                <input data-testid={`share-check-${i}`} type="checkbox" checked={checked[i] ?? false} onChange={(e) => setChecked((c) => c.map((v, j) => (j === i ? e.target.checked : v)))} className="h-6 w-6 accent-ink" />
                I checked this picture
              </label>
            </div>
          ))}
          <label className="type-body mt-8 flex min-h-12 items-start gap-3 rounded-panel bg-sun p-4">
            <input data-testid="share-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-6 w-6 shrink-0 accent-ink" />
            I understand anyone with the link can see these pictures for 7 days
          </label>
          {shareError && <p role="alert" className="type-body mt-4 rounded-panel bg-blush p-4 text-caution">{shareError}</p>}
          {trail.length > 15 && <p data-testid="guide-too-long" className="type-body mt-4 rounded-panel bg-sun p-4">Guides hold up to 15 steps. Finish this guide at step 15 or start over and split the task into two guides.</p>}
          {!created && (
            <button data-testid="create-link" disabled={shareBusy || trail.length === 0 || trail.length > 15 || checked.length !== trail.length || !checked.every(Boolean) || !consent} onClick={() => void createLink()} className={`${BTN_PRIMARY} mt-6 w-full`}>Create link</button>
          )}
          {created && (
            <div className="mt-8 rounded-panel bg-mist p-6">
              <p className="type-body">Your link:</p>
              <p data-testid="guide-url" className="type-body mt-2 break-all font-bold">{created.url}</p>
              <p data-testid="guide-expiry" className="type-small mt-3">This link deletes itself on {new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date(created.expires_at))}.</p>
              {trail.length !== created.steps && <p data-testid="guide-outdated" className="type-small mt-3">This link has your first {created.steps} {created.steps === 1 ? "step" : "steps"}. To share the newest steps, delete it and create a new link.</p>}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button data-testid="copy-link" onClick={() => { void navigator.clipboard?.writeText(created.url); setCopied(true); }} className={BTN_PRIMARY}>Copy link</button>
                {copied && <span className="type-body">Copied</span>}
                <button data-testid="delete-link" disabled={shareBusy} onClick={() => void deleteLink()} className={BTN_SECONDARY}>Delete now</button>
              </div>
            </div>
          )}
          {guideDeleted && <p data-testid="guide-deleted" className="type-body mt-8 rounded-panel bg-sage p-4 text-done">This link has been deleted. Anyone who had it will now see that the guide has gone.</p>}
          <button data-testid="share-back" onClick={() => setPhase("step")} className="type-small mt-6 min-h-12 underline underline-offset-4">Back to your steps</button>
        </section>
      )}
    </main>
  );
}
