"use client";

import { useOnlineStatus } from "@/lib/offlineSimulator";

/**
 * Floating demo toggle — bottom-right corner on all app pages.
 * Lets judges simulate offline mode without disconnecting the internet.
 */
export default function OfflineToggle() {
  const { isOnline, isSimulating, toggleSimulation } = useOnlineStatus();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Label — only visible when simulating */}
      {isSimulating && (
        <div className="bg-slate-900 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-fade-in tracking-wide">
          DEMO: Offline Mode Active
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleSimulation}
        title={isSimulating ? "Exit offline simulation" : "Simulate offline mode (demo)"}
        aria-label={isSimulating ? "Exit offline simulation" : "Simulate offline mode"}
        className={`group flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow-lg border transition-all duration-300 ${
          isSimulating
            ? "bg-amber-500 hover:bg-amber-400 text-white border-amber-400 shadow-amber-200"
            : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-slate-200"
        }`}
      >
        {/* Status dot */}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
            isSimulating ? "bg-white" : isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          }`}
          aria-hidden="true"
        />

        {isSimulating ? (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit Offline Demo
          </>
        ) : (
          <>
            {/* No-wifi icon */}
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            Simulate Offline
          </>
        )}
      </button>
    </div>
  );
}
