import type { Metadata } from "next";
import Link from "next/link";

// DESIGN.md §4.6: a shared guide is never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SharedGuide() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <h1 className="type-title">Shared guide</h1>
      <p className="type-body mt-6">
        Shared guides are not built yet. When they are, this page will show the
        steps someone shared with you, and it will delete itself after 7 days.
      </p>
      <p className="type-small mt-10">
        <Link href="/" className="underline">
          Back to the start
        </Link>
      </p>
    </main>
  );
}
