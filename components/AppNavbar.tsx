"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useOnlineStatus } from "@/lib/offlineSimulator";

interface AppNavbarProps {
  title: string;
  notification?: string | null;
}

export default function AppNavbar({ title, notification }: AppNavbarProps) {
  const { isOnline } = useOnlineStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/ask",     label: "Ask AI" },
    { href: "/upload",  label: "Upload Notes" },
    { href: "/history", label: "History" },
  ];

  return (
    <header className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm z-40">
      {/* Offline banner */}
      {!isOnline && !notification && (
        <div role="status" aria-live="polite" className="w-full bg-slate-800 text-slate-200 text-xs font-semibold text-center py-2 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
          Offline — Showing Cached Content
        </div>
      )}
      {notification && (
        <div role="alert" aria-live="assertive" className="w-full bg-emerald-500 text-white text-xs font-semibold text-center py-2 flex items-center justify-center gap-2 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" aria-hidden="true" />
          {notification}
        </div>
      )}

      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.966 8.966 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">
            Study<span className="text-blue-600">Offline</span>
          </span>
        </Link>

        {/* Page title — centre */}
        <div className="hidden md:flex flex-1 justify-center">
          <span className="text-sm font-semibold text-slate-500 tracking-wide">{title}</span>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          <div
            role="status" aria-live="polite"
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-300 ${
              isOnline ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} aria-hidden="true" />
            {isOnline ? "Online" : "Offline"}
          </div>
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "text-blue-600 font-semibold"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Mobile: status dot + hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`}
            aria-label={isOnline ? "Online" : "Offline"}
            role="status"
          />
          <button
            className="p-2 rounded-md text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-blue-50 shadow-lg animate-fade-in">
          <div className="px-4 py-4 flex flex-col gap-3">
            <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg w-fit ${isOnline ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} aria-hidden="true" />
              {isOnline ? "Online" : "Offline — Cached Only"}
            </div>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm font-medium py-1 transition-colors ${
                  pathname === l.href ? "text-blue-600" : "text-slate-700 hover:text-blue-600"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
