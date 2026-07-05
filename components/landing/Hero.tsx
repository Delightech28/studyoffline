"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-16">
      {/* Background decorative blobs */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/3 -translate-y-1/4"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 -translate-x-1/4 translate-y-1/4"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Text column */}
        <div className="flex flex-col gap-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full w-fit animate-fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true" />
            Built for the Build with Gemma Hackathon
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight animate-fade-in-up">
            Learn Anywhere.{" "}
            <span className="text-blue-600 relative">
              Even Without
              <span
                aria-hidden="true"
                className="absolute bottom-1 left-0 right-0 h-2 bg-blue-200 opacity-50 rounded -z-10"
              />
            </span>{" "}
            Internet.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-lg animate-fade-in-up">
            StudyOffline is your AI-powered study companion. Ask questions, upload
            lecture notes, and get instant AI explanations — all cached locally so
            you can keep learning even when your connection drops.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up">
            <Link
              href="/ask"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-base px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
            >
              Start Learning
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base px-7 py-3.5 rounded-xl border border-slate-200 transition-all hover:-translate-y-0.5"
            >
              See How It Works
            </a>
          </div>

          {/* Trust line */}
          <p className="text-sm text-slate-500 animate-fade-in-up">
            Powered by Gemma 4 · Works on any device · No install required
          </p>
        </div>

        {/* Visual column */}
        <div className="relative flex justify-center lg:justify-end animate-fade-in-up">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/** SVG-based illustration: laptop + no-wifi crossed out + chat bubble */
function HeroVisual() {
  return (
    <div className="relative w-full max-w-md">
      {/* Laptop card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 relative z-10">
        {/* Laptop screen top bar */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="ml-2 flex-1 h-2 bg-slate-100 rounded-full" />
        </div>

        {/* No-wifi badge */}
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 w-fit">
          <NoWifiIcon />
          <span className="text-xs font-semibold text-red-600">No Internet — Offline Mode</span>
        </div>

        {/* Chat bubbles */}
        <div className="flex flex-col gap-3">
          {/* User message */}
          <div className="self-end flex items-end gap-2 max-w-[80%] ml-auto">
            <div className="bg-blue-600 text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
              Explain Newton&apos;s 3rd Law of Motion
            </div>
            <div className="w-6 h-6 rounded-full bg-blue-200 flex-shrink-0 flex items-center justify-center text-blue-700 text-[10px] font-bold">
              U
            </div>
          </div>

          {/* AI response */}
          <div className="flex items-start gap-2 max-w-[90%]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div className="bg-slate-50 border border-slate-100 text-slate-700 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
              <p className="font-semibold text-slate-900 mb-1">Newton&apos;s 3rd Law</p>
              <p>For every action, there is an equal and opposite reaction. This means forces always come in pairs…</p>
              {/* Cached badge */}
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Cached · Available Offline
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating offline badge */}
      <div className="absolute -top-3 -right-3 bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-20">
        <span className="w-2 h-2 rounded-full bg-slate-400" aria-hidden="true" />
        Offline
      </div>

      {/* Floating online badge below */}
      <div className="absolute -bottom-3 -left-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-20">
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" aria-hidden="true" />
        Responses saved
      </div>
    </div>
  );
}

function NoWifiIcon() {
  return (
    <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}
