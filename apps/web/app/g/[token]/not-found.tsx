import Link from "next/link";

export default function GuideNotFound() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <h1 className="type-title">This guide has gone</h1>
      <p className="type-body mt-6">The link may have been deleted, or its 7 days may be up. Ask the person who shared it to make a new one.</p>
      <p className="type-small mt-10">
        <Link href="/" className="underline">Back to the start</Link>
      </p>
    </main>
  );
}
