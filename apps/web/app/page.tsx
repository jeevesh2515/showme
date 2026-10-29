import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="type-display max-w-[16ch]">
        Stuck on a screen? ShowMe points to the next tap.
      </h1>
      <p className="type-body mt-6">
        Add a screenshot, say what you want to do, and see exactly where to
        press. Private details are hidden on your device before anything is
        sent.
      </p>
      <p className="mt-8">
        <Link
          href="/app"
          className="type-body inline-flex min-h-12 items-center rounded-control bg-ink px-6 py-3 font-bold text-paper"
        >
          Try it with a screenshot
        </Link>
      </p>
      <p className="type-small mt-10 max-w-[60ch] text-ink/70">
        This page is a placeholder while the product is built. Accuracy numbers,
        the demo video and the shared-guide flow are not available yet; nothing
        here is a claim about how well ShowMe works.
      </p>
      <nav className="type-small mt-6 flex gap-6">
        <Link href="/eval" className="underline">
          How often it is right
        </Link>
        <Link href="/app" className="underline">
          Open the app
        </Link>
      </nav>
    </main>
  );
}
