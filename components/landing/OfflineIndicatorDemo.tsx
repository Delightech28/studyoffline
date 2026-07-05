"use client";

import { useState, useEffect } from "react";

export default function OfflineIndicatorDemo() {
  // Real online/offline state
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="reveal max-w-3xl mx-auto rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 sm:p-12 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
              Always in the Know
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Live Connectivity Status
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
              StudyOffline always shows your current connection state. The badge
              below reflects your <em>actual</em> network status right now.
            </p>
          </div>

          {/* Live badge demo */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Current state badge */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Your status now</p>
              <StatusBadge online={isOnline} live />
            </div>

            <div className="hidden sm:block w-px h-16 bg-slate-700" aria-hidden="true" />

            {/* Both states shown */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">What each looks like</p>
              <div className="flex flex-col gap-2">
                <StatusBadge online={true}  live={false} />
                <StatusBadge online={false} live={false} />
              </div>
            </div>
          </div>

          {/* Info line */}
          <p className="text-center text-slate-500 text-xs mt-8">
            This indicator appears in the top bar of every page throughout the app.
            When offline, previously cached responses remain fully accessible.
          </p>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ online, live }: { online: boolean; live: boolean }) {
  return (
    <div
      role="status"
      aria-live={live ? "polite" : undefined}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-500 ${
        online
          ? "bg-emerald-950 border-emerald-700 text-emerald-300"
          : "bg-slate-700 border-slate-600 text-slate-300"
      }`}
    >
      <span
        aria-hidden="true"
        className={`w-2.5 h-2.5 rounded-full ${
          online ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
        }`}
      />
      {online ? "Online" : "Offline — Showing Cached Content"}
      {live && (
        <span className="text-[10px] font-normal opacity-60 ml-1">(live)</span>
      )}
    </div>
  );
}
