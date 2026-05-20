import Link from "next/link";

export default function MiasComingSoonPage() {
  return (
    <main className="min-h-screen bg-amber-50 px-6 py-16 text-zinc-900">
      <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center rounded-[2rem] border border-amber-200 bg-white/80 p-8 text-center shadow-xl shadow-amber-900/10">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-700">Mia&apos;s Handmade Shop</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Coming Soon</h1>
        <p className="mt-5 max-w-2xl text-lg text-zinc-600">
          This page is getting a full rebuild before it goes live. Check back later for crochet pieces,
          handmade gifts, and a cleaner shopping experience.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Back to Home
        </Link>
      </section>
    </main>
  );
}

