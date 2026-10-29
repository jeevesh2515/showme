import Link from "next/link";

export default function Start() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <h1 className="type-title">What do you want to do?</h1>
      <p className="type-body mt-6">
        The goal box and the screenshot drop zone are not built yet. When they
        are, your screenshot will be hidden-in-browser before anything is sent,
        and you will check it first.
      </p>
      <p className="type-small mt-10">
        <Link href="/" className="underline">
          Back to the start
        </Link>
      </p>
    </main>
  );
}
