// PII patterns for goal text and OCR output (ARCH §7, FLOW-2, PRIV-7).
// Mirrors backend/showme/core/pii.py exactly; pii-vectors.json keeps the two honest.

export type PiiKind = "email" | "iban" | "postcode" | "card" | "phone" | "digits";

export type PiiSpan = {
  readonly start: number;
  readonly end: number;
  readonly kind: PiiKind;
  readonly text: string;
};

type Rule = { kind: PiiKind; pattern: RegExp; accept?: (digits: string) => boolean };

const isCard = (digits: string): boolean => digits.length >= 13 && digits.length <= 19 && luhn(digits);

const RULES: readonly Rule[] = [
  { kind: "email", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g },
  { kind: "iban", pattern: /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){2,7}(?:[ ]?\d{1,3})?\b/g },
  { kind: "postcode", pattern: /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi },
  { kind: "card", pattern: /\b(?:\d[ -]?){12,18}\d\b/g, accept: isCard },
  { kind: "phone", pattern: /\+?\d[\d ()-]{7,}\d/g, accept: (d) => d.length >= 9 && d.length <= 15 },
  { kind: "digits", pattern: /\b\d{8,}\b/g },
];

const digitsOnly = (text: string): string => text.replace(/\D/g, "");

export function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** All matches, in the same order pii.py produces them: rule order, then start, then end. */
export function findPii(text: string): PiiSpan[] {
  const spans: PiiSpan[] = [];
  for (const rule of RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      const start = match.index;
      if (start === undefined || rule.accept?.(digitsOnly(match[0])) === false) continue;
      spans.push({ start, end: start + match[0].length, kind: rule.kind, text: match[0] });
    }
  }
  return spans.sort((a, b) => a.start - b.start || a.end - b.end);
}

/** Merge overlapping and adjacent interval matches (review 2026-10-29 #1). */
export function mergeSpans(spans: readonly { start: number; end: number }[]): { start: number; end: number }[] {
  if (spans.length === 0) return [];
  const sorted = [...spans].sort((a, b) => a.start - b.start || a.end - b.end);
  const first = sorted[0];
  if (!first) return [];
  const merged: { start: number; end: number }[] = [{ start: first.start, end: first.end }];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];
    if (!prev || !curr) continue;
    if (curr.start <= prev.end) {
      prev.end = Math.max(prev.end, curr.end);
    } else {
      merged.push({ start: curr.start, end: curr.end });
    }
  }
  return merged;
}

/** Replace every match with "[hidden]"; overlaps are merged the way pii.py merges them. */
export function maskPii(text: string): string {
  const spans = findPii(text);
  if (spans.length === 0) return text;
  const merged = mergeSpans(spans);
  const out: string[] = [];
  let pos = 0;
  for (const { start, end } of merged) {
    out.push(text.slice(pos, start), "[hidden]");
    pos = end;
  }
  out.push(text.slice(pos));
  return out.join("");
}
