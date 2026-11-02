import Link from "next/link";
import results from "../../lib/results.generated.json";

// WEB-2: renders the generated RESULTS.md table; no hand-typed numbers (RULES §2).
const gh = (p: string) =>
  `https://github.com/jeevesh2515/showme/blob/main/eval/results/${p}`;

const wrap = "mx-auto max-w-6xl px-4 sm:px-6";

export default function Eval() {
  const e2e = results.headline.e2e;
  const h = results.headline;
  const current = new Set([h.screenspotV2, h.screenspotPro, h.negatives].map((r) => r?.predictions));
  return (
    <main>
      <div className={`${wrap} py-12 md:py-16`}>
        <h1 className="type-display">How often it is right</h1>
        <p className="type-body mt-6">
          Every number here is read at build time from a generated file in{" "}
          <code>eval/results/</code> and links to its raw predictions. Weakest
          results are shown with the same prominence as the best. Rows marked
          current are the numbers on the home page; the others are earlier
          prompts and development runs.
        </p>
        {h.honesty && (
          <p className="type-body mt-4">
            &ldquo;Negatives&rdquo; means goals the screen cannot satisfy: {h.honesty.absentHits} of {h.honesty.absentN} absent
            targets said not visible, {h.honesty.injectionHits} of {h.honesty.injectionN} injection probes said not visible,
            and {h.honesty.refuseHits} of {h.honesty.refuseN} harmful goals were refused. Held-out splits are by annotation, so
            they share screenshots with the development split, and one negatives image and goal pair appears in both.
          </p>
        )}

        <div
          className="mt-10 overflow-x-auto rounded-panel border-2 border-mist"
          tabIndex={0}
          role="region"
          aria-label="Evaluation runs"
        >
          <table className="type-small w-full text-left">
            <thead className="bg-mist">
              <tr>
                <th className="p-2">Suite</th>
                <th className="p-2">Accuracy</th>
                <th className="p-2">Prompt</th>
                <th className="p-2">Split</th>
                <th className="p-2">n</th>
                <th className="p-2">Model</th>
                <th className="p-2">Date</th>
                <th className="p-2">Raw output</th>
              </tr>
            </thead>
            <tbody>
              {[...results.rows].reverse().map((r) => (
                <tr key={r.predictions} className="border-t border-mist">
                  <td className="p-2">{r.suite}</td>
                  <td className="p-2 font-bold whitespace-nowrap">{r.accuracyPct}%{current.has(r.predictions) ? " (current)" : ""}</td>
                  <td className="p-2">{r.promptVersion ? `v${r.promptVersion}` : "not recorded"}</td>
                  <td className="p-2">{r.split}</td>
                  <td className="p-2">{r.n}</td>
                  <td className="p-2">
                    {r.model} ({r.effort})
                  </td>
                  <td className="p-2 whitespace-nowrap">{r.date}</td>
                  <td className="p-2">
                    <a href={gh(r.predictions)} className="inline-flex min-h-11 items-center underline">
                      predictions.jsonl
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {e2e && (
        <section className="bg-ink py-16 text-paper" aria-labelledby="e2e">
          <div className={wrap}>
            <h2 id="e2e" className="type-title">
              End-to-end tasks
            </h2>
            <p className="type-display mt-4 text-highlighter">
              {e2e.successPct}%
            </p>
            <p className="type-body mt-4">
              {e2e.date}: {e2e.passed} of {e2e.tasksRun} public tasks completed
              ({e2e.successPct}%), average {e2e.avgSteps} steps, {e2e.refusals}{" "}
              refusals.{" "}
              These tasks were also used during development, so this is a recorded run, not an unseen test.{" "}
              <a href={gh(`${e2e.dir}/report.md`)} className="inline-flex min-h-11 items-center underline">
                Full E2E report
              </a>
            </p>
          </div>
        </section>
      )}

      <div className={`${wrap} py-12 md:py-16`}>
        <p className="type-body">
          Calibration and verifier detail:{" "}
          <a href={gh("RESULTS.md")} className="inline-flex min-h-11 items-center underline">
            RESULTS.md
          </a>{" "}
          (AUROC, verifier precision, SAM ablation links).
        </p>
        <p className="type-small mt-8">
          <Link href="/" className="inline-flex min-h-11 items-center underline">
            Back to the start
          </Link>
        </p>
      </div>
    </main>
  );
}
