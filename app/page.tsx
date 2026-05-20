import type * as React from "react"

import Image from "next/image"
import Link from "next/link"

import yarnball from "./Mias/images/yarnball.jpeg"

function PokeballMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false" {...props}>
      <defs>
        <radialGradient id="pbShade" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="55%" stopColor="#000000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="82" fill="#ef4444" />
      <path d="M18 100a82 82 0 0 0 164 0H18z" fill="#f8fafc" />
      <rect x="18" y="92" width="164" height="16" rx="8" fill="#0b0b0f" />
      <circle cx="100" cy="100" r="26" fill="#0b0b0f" />
      <circle cx="100" cy="100" r="18" fill="#f8fafc" />
      <circle cx="100" cy="100" r="12" fill="#e2e8f0" />
      <circle cx="100" cy="100" r="82" fill="url(#pbShade)" />
      <circle
        cx="100"
        cy="100"
        r="82"
        fill="none"
        stroke="#0b0b0f"
        strokeWidth="10"
      />
    </svg>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="min-h-screen flex flex-col md:flex-row">
        <Link
          href="/PokemonStore"
          aria-label="Go to Pokemon Store"
          className="group relative flex-1 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-rose-600 to-slate-950" />
          <div className="absolute inset-0 bg-black/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative flex min-h-[50vh] md:min-h-screen items-center justify-center p-8">
            <div className="text-center">
              <PokeballMark className="mx-auto h-48 w-48 drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-[1.04]" />
              <h1 className="mt-7 text-4xl font-bold tracking-tight text-white">
                Ponchos Pokemon
              </h1>
              <p className="mt-2 text-white/85">
                Welcoming all trainers! Collect, Sell, and keep up with the latest pokemon news!
              </p>
              <div className="mt-6 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors group-hover:bg-white/15">
                Enter
              </div>
            </div>
          </div>
        </Link>

        <Link
          href="/Mias"
          aria-label="Go to Mias"
          className="group relative flex-1 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-white"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-slate-950" />
          <div className="absolute inset-0 bg-black/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative flex min-h-[50vh] md:min-h-screen items-center justify-center p-8">
            <div className="text-center">
              <div className="relative mx-auto h-48 w-48">
                <Image
                  src={yarnball}
                  alt="Yarn ball"
                  fill
                  className="rounded-full object-cover drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-[1.04]"
                  priority
                />
              </div>
              <h2 className="mt-7 text-4xl font-bold tracking-tight text-white">
                Stitched By Mimi
              </h2>
              <p className="mt-2 text-white/85">Handmade crochet creations</p>
              <div className="mt-6 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors group-hover:bg-white/15">
                Enter
              </div>
            </div>
          </div>
        </Link>
      </div>
    </main>
  )
}
