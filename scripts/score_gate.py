#!/usr/bin/env python3
"""Persistent Day-gate scorer (MEMORY D15). Stdlib only.

Checks mechanical, verifiable facts only - never judges prose quality.
Writes docs/SCORE.md (generated, do not hand-edit score) and appends
.learnings/score-history.json. Exit 1 if score < 8.5.

Usage: python3 scripts/score_gate.py [day-label]
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THRESHOLD = 8.5

def read(p):
    f = ROOT / p
    return f.read_text(errors="ignore") if f.exists() else ""

def exists(p): return (ROOT / p).exists()

def git(*a):
    try: return subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True, timeout=10).stdout.strip()
    except Exception: return ""

# (axis, weight, label, passed)
C = []
def check(axis, weight, label, ok): C.append((axis, weight, label, bool(ok)))

# Completeness (25)
for p in ["docs/PRD.md","docs/REQUIREMENTS.md","docs/ARCHITECTURE.md","docs/RULES.md","docs/PHASES.md","docs/DESIGN.md","docs/MEMORY.md","docs/RISKS.md","docs/SPIKES.md",".learnings/00-step-log.md","LICENSE","docs/prompts/day-2-oct-28.md"]:
    check("Completeness", 25/16, f"exists {p}", exists(p))
check("Completeness", 25/16, ".learnings/01-10 all exist", all(exists(f".learnings/{i:02d}-") or any((ROOT/".learnings").glob(f"{i:02d}-*.md")) for i in range(1,11)))
check("Completeness", 25/16, "founder briefing .learnings/daily/2026-10-27.md", exists(".learnings/daily/2026-10-27.md"))
check("Completeness", 25/16, "Day1 founder boxes ticked in PHASES", read("docs/PHASES.md").count("- [x]") >= 6)
check("Completeness", 25/16, "D14 founder approval recorded", "D14" in read("docs/MEMORY.md") and "Indie" in read("docs/MEMORY.md"))

# Consistency (20)
check("Consistency", 4, "no <PLACEHOLDER> left in day-2 prompt", not re.search(r"<(STARTUP|MIT|\$|public GitHub)", read("docs/prompts/day-2-oct-28.md")))
req = set(re.findall(r"\b(?:PRIV|FLOW|API|EVAL|A11Y|WEB|ENG)-\d+\b", read("docs/REQUIREMENTS.md")))
cited = set(re.findall(r"\b(?:PRIV|FLOW|API|EVAL|A11Y|WEB|ENG)-\d+\b", read("docs/ARCHITECTURE.md")))
check("Consistency", 4, "ARCH cited req IDs all defined", cited <= req)
check("Consistency", 4, "track=Indie consistent (PRD+MEMORY)", "Track: Indie" in read("docs/PRD.md"))
check("Consistency", 4, "AGENTS/CLAUDE in sync (body after line 6 identical)", read("AGENTS.md").split("\n",6)[-1] == read("CLAUDE.md").split("\n",6)[-1])
check("Consistency", 4, "README honest stub (>200 chars, says not run)", len(read("README.md")) > 200 and "not run" in read("README.md"))
links_ok = True
for md in (ROOT/"docs").glob("*.md"):
    for t in re.findall(r"\]\(([^)#]+\.md)\)", md.read_text(errors="ignore")):
        if not t.startswith("http") and not (md.parent/t).exists(): links_ok=False
check("Consistency", 4, "docs/*.md relative links resolve", links_ok)

# Evidence honesty (20)
for s in ["spikes/grounding/smoke.py","spikes/sam/api_sam.py","spikes/redaction/run.mjs"]:
    check("Evidence", 20/6, f"spike script {s}", exists(s))
check("Evidence", 20/6, "SPIKES labels estimates/UNVERIFIED + reproduction logs linked", "UNVERIFIED" in read("docs/SPIKES.md") and "spikes/results/2026-10-27-grounding" in read("docs/SPIKES.md"))
check("Evidence", 20/6, "no hand-made eval/results claimed (dir absent or generated-only)", not exists("eval/results/RESULTS.md") or "generated" in read("eval/results/RESULTS.md").lower())
check("Evidence", 20/6, "A2 downgraded from Supported (Unsupported or Refuted)", ("Unsupported" in read("docs/MEMORY.md")) or ("Refuted" in read("docs/MEMORY.md")))
check("Evidence", 20/6, "archived grounding log reproduces 10/10 + 5/5", "10/10" in read("spikes/results/2026-10-27-grounding-spark-minimal.txt") and "5/5" in read("spikes/results/2026-10-27-grounding-spark-minimal.txt"))
check("Evidence", 20/6, "D17 Indie criteria sourced from official page", "D17" in read("docs/MEMORY.md") and "dev.meta.ai/events/global-hackathon" in read("docs/MEMORY.md"))

# Privacy/security (20)
gi = read(".gitignore")
for pat in [".env", ".mcp.json", "traineddata", "fixtures/*.png", "eval/data/"]:
    check("Privacy", 20/9, f".gitignore covers {pat}", pat in gi)
check("Privacy", 20/9, ".env not tracked by git", ".env" not in git("ls-files").splitlines())
check("Privacy", 20/9, "PRIV-10 + PRIV-11 + API-9 defined", all(x in read("docs/REQUIREMENTS.md") for x in ["PRIV-10","PRIV-11","API-9"]))
check("Privacy", 20/9, "exact CSP directives specified", "worker-src" in read("docs/ARCHITECTURE.md"))
check("Privacy", 20/9, "contributor ban in core-shared validator spec", "showme/core" in read("docs/ARCHITECTURE.md") and "contributor" in read("docs/ARCHITECTURE.md"))

# Day-2 readiness (15)
d2 = read("docs/prompts/day-2-oct-28.md")
check("Day2 readiness", 3, "day-2 founder block filled (INDIE/MIT/cap)", all(x in d2 for x in ["INDIE","MIT","$60 total"]))
check("Day2 readiness", 3, "core signatures frozen for parallel eval agent", "Frozen core signatures" in d2)
check("Day2 readiness", 3, "eval cache key includes effort+sam_on", "effort" in read("docs/ARCHITECTURE.md") and "sam_on" in read("docs/ARCHITECTURE.md"))
check("Day2 readiness", 3, "git repo exists", exists(".git"))
check("Day2 readiness", 3, "public remote origin set", "github.com" in git("remote","get-url","origin"))

axes = {}
for axis, w, label, ok in C:
    a = axes.setdefault(axis, [0.0, 0.0]); a[1] += w; a[0] += w if ok else 0.0
score = round(sum(min(a[0], a[1]) for a in axes.values()) / sum(a[1] for a in axes.values()) * 10, 2)
fails = [f"{a}: {l}" for a, _, l, ok in C if not ok]
out = ["# Score gate (generated by scripts/score_gate.py, do not hand-edit)", "",
       f"**Score: {score}/10** - threshold {THRESHOLD} and zero failing checks required - {'PASS' if score>=THRESHOLD and not fails else 'FAIL: fix items below and re-run'}", "",
       "| Axis | Score |", "| --- | --- |"]
for a,(got,total) in axes.items(): out.append(f"| {a} | {min(got,total)/total*10:.1f}/10 ({min(got,total):.1f}/{total:.0f}) |")
out += ["", "## Failing checks (fix these, then re-run)"] + ([f"- {f}" for f in fails] or ["- none"])
(ROOT/"docs/SCORE.md").write_text("\n".join(out)+"\n")
hist = ROOT/".learnings/score-history.json"
try: h = json.loads(hist.read_text()) if hist.exists() else []
except Exception: h = []
h.append({"label": sys.argv[1] if len(sys.argv)>1 else "day1", "score": score, "sha": git("rev-parse","--short","HEAD") or "no-git", "fails": fails})
hist.write_text(json.dumps(h, indent=1)+"\n")
passed = score >= THRESHOLD and not fails
print(f"score={score}/10 threshold={THRESHOLD} {'PASS' if passed else 'FAIL'} fails={len(fails)}")
for f in fails: print(" FAIL", f)
assert score == score and 0 <= score <= 10
sys.exit(0 if passed else 1)
