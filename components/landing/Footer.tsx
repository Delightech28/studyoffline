import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">
              Study<span className="text-blue-400">Offline</span>
            </span>
          </Link>

          {/* Hackathon note */}
          <p className="text-xs text-center text-slate-500">
            Built for the{" "}
            <span className="text-blue-400 font-medium">Build with Gemma Hackathon</span>
            {" "}—{" "}
            <span className="text-slate-400">COOU 2026</span>
          </p>

          {/* Nav links */}
          <nav className="flex items-center gap-5 text-xs" aria-label="Footer navigation">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <Link href="/ask" className="hover:text-white transition-colors">Ask</Link>
            <Link href="/upload" className="hover:text-white transition-colors">Upload</Link>
            <Link href="/history" className="hover:text-white transition-colors">History</Link>
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} StudyOffline · Powered by Gemma 4 via Google AI Studio
        </div>
      </div>
    </footer>
  );
}
