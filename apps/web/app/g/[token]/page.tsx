import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuideStepper from "../../../components/GuideStepper";
import type { GetGuideResponse } from "../../../lib/api/client";

// DESIGN.md §4.6: a shared guide is never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

async function fetchGuide(token: string): Promise<GetGuideResponse | null> {
  const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${backend}/v1/guides/${encodeURIComponent(token)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as GetGuideResponse;
  } catch {
    return null;
  }
}

export default async function SharedGuide({ params }: { params: { token: string } }) {
  const guide = await fetchGuide(params.token);
  if (!guide) notFound();
  const expiry = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date(guide.expires_at));
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <h1 className="type-title">Shared guide</h1>
      <p data-testid="guide-banner" className="type-body mt-4 rounded-panel bg-mist p-4">Shared guide. Deletes itself on {expiry}.</p>
      <p className="type-body mt-4">{guide.goal}</p>
      <div className="mt-6">
        <GuideStepper guide={guide} />
      </div>
    </main>
  );
}
