// EVAL-8: 20-task E2E suite. Screenshot -> real redaction pipeline in the web app -> /v1/step -> act -> repeat.
// Success is only ever the task predicate. Results and report.md are generated from the run, never hand-written.
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PREDICATE_TYPES, predicateHolds } from "./predicate.mjs";

const { chromium, devices } = createRequire(
  new URL("../../apps/web/package.json", import.meta.url),
)("@playwright/test");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

// shortcut: parses only eval/e2e/tasks.yaml's flat shape (list of maps + one nested predicate map).
// Double-quoted values get YAML's \\ unescape (predicate regexes rely on it); other escapes unsupported.
// Upgrade to a real YAML parser if the file grows.
const unquote = (v) => {
  const s = String(v);
  const dq = /^"(.*)"$/.exec(s);
  if (dq) return dq[1].replace(/\\\\/g, "\\");
  return s.replace(/^'(.*)'$/, "$1");
};

function parseTasks(text) {
  const tasks = [];
  for (const [i, raw] of text.split("\n").entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:-\s+)?([a-z_]+):\s*(.*)$/.exec(line);
    if (!m) throw new Error(`tasks.yaml:${i + 1}: cannot parse "${line}"`);
    const [, key, value] = m;
    if (key === "tasks" && !value) continue; // top-level key
    if (/^\s*-\s/.test(raw)) {
      const task = {};
      task[key] = key === "max_steps" ? Number(value) : unquote(value);
      tasks.push(task);
      continue;
    }
    const task = tasks.at(-1);
    if (!task) throw new Error(`tasks.yaml:${i + 1}: field before first task`);
    const depth = raw.length - raw.trimStart().length;
    if (depth <= 4) {
      if (key === "predicate" && !value) task.predicate = {};
      else task[key] = key === "max_steps" ? Number(unquote(value)) : unquote(value);
    } else {
      if (!task.predicate) throw new Error(`tasks.yaml:${i + 1}: nested field outside predicate`);
      task.predicate[key] = unquote(value);
    }
  }
  return tasks;
}

function validate(tasks) {
  const problems = [];
  if (tasks.length !== 20) problems.push(`expected 20 tasks, found ${tasks.length}`);
  const ids = new Set();
  for (const t of tasks) {
    if (!t.id || !/^e2e-\d{2}-[a-z0-9-]+$/.test(t.id)) problems.push(`${t.id}: bad id`);
    else if (ids.has(t.id)) problems.push(`${t.id}: duplicate id`);
    ids.add(t.id);
    for (const field of ["goal", "start_url", "viewport", "predicate", "max_steps"]) {
      if (t[field] === undefined || t[field] === "") problems.push(`${t.id}: missing ${field}`);
    }
    if (t.start_url && !/^https?:\/\//.test(t.start_url)) problems.push(`${t.id}: start_url must be http(s)`);
    if (t.viewport && !["desktop", "mobile"].includes(t.viewport)) problems.push(`${t.id}: bad viewport`);
    if (t.max_steps !== 10) problems.push(`${t.id}: max_steps must be 10`);
    const pr = t.predicate;
    if (!pr?.type || !(pr.type === "selector" ? pr.selector : pr.pattern)) problems.push(`${t.id}: predicate needs type and pattern (selector for type selector)`);
    else if (!PREDICATE_TYPES.has(pr.type)) problems.push(`${t.id}: bad predicate type`);
    else if (pr.type === "cookie" && !pr.name) problems.push(`${t.id}: cookie predicate needs name`);
    else if (pr.type !== "selector") {
      try {
        new RegExp(t.predicate.pattern);
      } catch {
        problems.push(`${t.id}: predicate pattern is not a valid regex`);
      }
    }
  }
  const mobile = tasks.filter((t) => t.viewport === "mobile").length;
  if (mobile < 6) problems.push(`need at least 6 mobile tasks, found ${mobile}`);
  return problems;
}

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);

const date = new Date().toISOString().slice(0, 10);
const tasks = parseTasks(readFileSync(join(HERE, "tasks.yaml"), "utf8"));
const problems = validate(tasks);

if (flag("dry-run")) {
  const mobile = tasks.filter((t) => t.viewport === "mobile").length;
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(
    `OK: ${tasks.length} tasks, ${new Set(tasks.map((t) => t.id)).size} unique ids, ${mobile} mobile, all predicates present`,
  );
  process.exit(0);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

const web = arg("web", "https://showme-web-delta.vercel.app").replace(/\/$/, "");
const sha = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
const outDir = resolve(ROOT, arg("out", `eval/results/${date}-e2e-${sha}`));
// Hard stop on real spend: summed cost_usd from every /v1/step and /v1/refine response the app receives.
const budgetUsd = Number(arg("budget-usd", "3"));
let spentUsd = 0;
const headed = flag("headed");
let selected = tasks;
const only = arg("tasks", "");
if (only) selected = tasks.filter((t) => only.split(",").includes(t.id));
if (arg("limit")) selected = selected.slice(0, Number(arg("limit")));
mkdirSync(outDir, { recursive: true });

async function upload(showme, file, goal) {
  const next = showme.getByTestId("next-screenshot-input");
  if (await next.count()) {
    await next.setInputFiles(file); // keeps the app's step history for the next /v1/step call
  } else if (await showme.getByTestId("file-input").count()) {
    await showme.getByTestId("goal-input").fill(goal);
    await showme.getByTestId("file-input").setInputFiles(file);
  } else {
    await showme.getByTestId("start-over").click();
    await showme.getByTestId("goal-input").fill(goal);
    await showme.getByTestId("file-input").setInputFiles(file);
  }
  await showme.getByTestId("review-continue").waitFor({ timeout: 120_000 });
}

const taskResults = [];
const ratingRows = [];
for (const task of selected) {
  if (spentUsd >= budgetUsd) {
    console.log(`STOP budget $${budgetUsd} reached ($${spentUsd.toFixed(4)}); ${task.id} and later tasks not run`);
    break;
  }
  const dir = join(outDir, "trail", task.id);
  mkdirSync(dir, { recursive: true });
  const stepLines = [];
  const record = { id: task.id, success: false, steps: 0, honesty_events: [], refused: false, cost_usd: 0 };
  let browser;
  try {
    browser = await chromium.launch({ headless: !headed });
    const targetCtx = await browser.newContext(
      task.viewport === "mobile"
        ? { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }
        : { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 },
    );
    const showmeCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    let target = await targetCtx.newPage();
    const showme = await showmeCtx.newPage();
    showme.on("response", async (r) => {
      if (r.request().method() !== "POST" || !/\/v1\/(step|refine)$/.test(new URL(r.url()).pathname)) return;
      const cost = Number((await r.json().catch(() => null))?.cost_usd) || 0;
      spentUsd += cost;
      record.cost_usd += cost;
    });
    const goal = task.goal;

    await target.goto(task.start_url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await target.waitForTimeout(2500);
    await showme.goto(`${web}/app`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await showme.getByTestId("goal-input").waitFor({ timeout: 45_000 });
    await showme.waitForTimeout(1500); // let React hydrate before setInputFiles

    for (let n = 1; n <= task.max_steps; n++) {
      if (spentUsd >= budgetUsd) {
        record.error = "budget_exhausted";
        break;
      }
      let shot;
      try {
        shot = await target.screenshot(); // deviceScaleFactor 1: pixels are CSS pixels
      } catch {
        await target.waitForTimeout(1000);
        shot = await target.screenshot();
      }
      await upload(showme, { name: "screen.png", mimeType: "image/png", buffer: shot }, goal);

      const responseP = showme.waitForResponse(
        (r) => r.url().includes("/v1/step") && r.request().method() === "POST",
        { timeout: 120_000 },
      );
      const refineP = showme
        .waitForResponse((r) => r.url().includes("/v1/refine") && r.request().method() === "POST", { timeout: 20_000 })
        .catch(() => null);
      await showme.getByTestId("review-continue").click();
      const response = await responseP;
      const body = await response.json();
      const http = response.status();
      if (http !== 200) throw new Error(`/v1/step ${http}: ${body?.error?.code ?? "unknown"}`);
      record.steps = n;

      const post = JSON.parse(response.request().postData() ?? "{}");
      const meta = post.image_meta ?? {};
      writeFileSync(join(dir, `step-${n}.jpg`), Buffer.from(String(post.image).split(",")[1] ?? "", "base64"));

      const line = {
        task: task.id,
        step: n,
        http,
        request: { goal: post.goal, image_meta: meta, history_len: (post.history ?? []).length },
        response: body,
        action_taken: null,
        predicate: null,
        highlight: "none",
      };
      if (body.target) {
        const refineRes = await refineP;
        const refineBody = refineRes ? await refineRes.json().catch(() => null) : null;
        line.highlight = refineBody?.mode === "outline" ? "sam_outline" : "model_box";
      }

      if (body.status === "refuse") {
        record.refused = true;
        record.honesty_events.push(`step ${n}: refuse`);
        stepLines.push(line);
        break;
      }
      if (body.status === "not_visible") record.honesty_events.push(`step ${n}: not_visible`);
      if (body.status === "unsure") record.honesty_events.push(`step ${n}: unsure`);

      if (body.status === "done") {
        await target.waitForTimeout(500);
        line.predicate = await predicateHolds(target, task.predicate);
        stepLines.push(line);
        if (line.predicate) record.success = true; // model said done and the predicate agrees; otherwise a miss, not a loop
        break;
      }

      const vp = target.viewportSize();
      const scaleX = vp.width / (meta.width || vp.width);
      const scaleY = vp.height / (meta.height || vp.height);
      const scroll = (d) => {
        const amount = Math.round(Math.min(vp.width, vp.height) * 0.75);
        const delta = { up: [0, -amount], down: [0, amount], left: [-amount, 0], right: [amount, 0] }[d] ?? [0, amount];
        return target.mouse.wheel(delta[0], delta[1]);
      };

      if (body.status === "not_visible") {
        const direction = body.scroll_direction !== "none" ? body.scroll_direction : "down";
        line.action_taken = `scroll ${direction}`;
        await scroll(direction);
      } else if (body.action === "scroll" || !body.target) {
        const direction = body.scroll_direction !== "none" ? body.scroll_direction : "down";
        line.action_taken = `scroll ${direction}`;
        await scroll(direction);
      } else {
        const { x, y } = body.target.point;
        line.action_taken = `click ${Math.round(x * scaleX)},${Math.round(y * scaleY)}`;
        await target.mouse.click(x * scaleX, y * scaleY);
        if (body.action === "type" && body.type_text) {
          line.action_taken += ` type "${body.type_text}"`;
          await target.keyboard.type(body.type_text);
        }
      }

      await target.waitForTimeout(1500);
      // Actions that open a new tab: follow it, or the predicate can never hold on the old page.
      const pages = targetCtx.pages();
      if (pages.length > 1 && pages.at(-1) !== target) target = pages.at(-1);
      line.predicate = await predicateHolds(target, task.predicate);
      stepLines.push(line);
      if (line.predicate) {
        record.success = true;
        break;
      }
      // Loop guard: same target label (or identical action) 3 times with no predicate progress wastes spend; stop and record it.
      const last3 = stepLines.slice(-3);
      const label = last3[0]?.response?.target?.label;
      const sameLabel = label && last3.every((l) => l.response?.target?.label === label);
      if (last3.length === 3 && (sameLabel || last3.every((l) => l.action_taken && l.action_taken === last3[0].action_taken))) {
        record.honesty_events.push(`step ${n}: loop_detected`);
        break;
      }
    }
  } catch (error) {
    record.error = String(error).slice(0, 300);
  } finally {
    writeFileSync(join(dir, "steps.jsonl"), stepLines.map((l) => JSON.stringify(l)).join("\n") + (stepLines.length ? "\n" : ""));
    for (const l of stepLines) ratingRows.push(`${l.task},${l.step},../results/${outDir.split("/").at(-1)}/trail/${l.task}/step-${l.step}.jpg,${l.highlight},`);
    await browser?.close();
    taskResults.push(record);
    console.log(`${record.success ? "PASS" : "FAIL"} ${record.id} steps=${record.steps}${record.error ? ` error=${record.error}` : ""}`);
  }
}

const passed = taskResults.filter((r) => r.success).length;
const results = {
  date,
  git_sha: sha,
  web,
  tasks_selected: selected.length,
  budget_usd: budgetUsd,
  cost_usd: Number(spentUsd.toFixed(6)),
  tasks: taskResults,
  success_rate: taskResults.length ? Number((passed / taskResults.length).toFixed(4)) : 0,
  avg_steps: taskResults.length
    ? Number((taskResults.reduce((sum, r) => sum + r.steps, 0) / taskResults.length).toFixed(2))
    : 0,
};
writeFileSync(join(outDir, "results.json"), JSON.stringify(results, null, 2) + "\n");

const rows = taskResults.map(
  (r) =>
    `| ${r.id} | ${r.success ? "pass" : "fail"} | ${r.steps} | ${r.cost_usd.toFixed(4)} | ${r.refused ? "yes" : "no"} | ${r.honesty_events.join(", ") || "-"} | ${r.error ?? "-"} |`,
);
const report = `# E2E suite ${date}

Generated by \`eval/e2e/run.mjs\` from \`results.json\` — do not edit by hand.

- Web app: ${web}
- Git SHA: ${sha}
- Tasks run: ${taskResults.length} of ${selected.length} selected
- Cost: $${results.cost_usd.toFixed(4)} (summed cost_usd from /v1/step and /v1/refine responses; budget $${budgetUsd})
- Success rate: ${(results.success_rate * 100).toFixed(1)}% (${passed}/${taskResults.length})
- Average steps: ${results.avg_steps}
- Refusals: ${taskResults.filter((r) => r.refused).length}
- Honesty events (unsure / not_visible): ${taskResults.reduce((n, r) => n + r.honesty_events.filter((e) => !e.endsWith("refuse")).length, 0)}

| Task | Result | Steps | Cost USD | Refused | Honesty events | Error |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}

Redacted screenshot trail and per-step model responses: \`trail/<task>/step-<n>.jpg\` and \`trail/<task>/steps.jsonl\`.
`;
writeFileSync(join(outDir, "report.md"), report);
writeFileSync(join(HERE, "highlight_ratings.csv"), "task,step,screenshot,shown,rating\n" + ratingRows.join("\n") + "\n");
console.log(`wrote ${outDir} — success ${passed}/${taskResults.length}, avg steps ${results.avg_steps}`);
