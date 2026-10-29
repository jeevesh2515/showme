import Link from "next/link";

export default function Eval() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <h1 className="type-title">How often it is right</h1>
      <p className="type-body mt-6">
        Not measured yet. Every number on this page will be read from a
        generated file in <code>eval/results/</code> and will link to its raw
        output, including the weakest result.
      </p>
      <p className="type-small mt-10">
        <Link href="/" className="underline">
          Back to the start
        </Link>
      </p>
    </main>
  );
}
