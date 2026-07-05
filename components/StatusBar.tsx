"use client";

import { useEffect, useState } from "react";

export default function StatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setJustRestored(true);
      setTimeout(() => setJustRestored(false), 4000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !justRestored) return null; // hide when online and stable

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full text-center text-xs font-semibold py-2 px-4 transition-all duration-500 ${
        justRestored
          ? "bg-emerald-500 text-white"
          : "bg-slate-700 text-slate-200"
      }`}
    >
      {justRestored ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" aria-hidden="true" />
          Connection restored
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-400" aria-hidden="true" />
          Offline — Showing Cached Content
        </span>
      )}
    </div>
  );
}
