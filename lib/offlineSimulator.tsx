"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface OfflineContextValue {
  isOnline: boolean;
  isSimulating: boolean;
  toggleSimulation: () => void;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  isSimulating: false,
  toggleSimulation: () => {},
});

/**
 * Wraps the app and provides a global isOnline value.
 * When simulation is active, isOnline is forced to false
 * regardless of the actual network state.
 */
export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [realOnline, setRealOnline]     = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    setRealOnline(navigator.onLine);
    const on  = () => setRealOnline(true);
    const off = () => setRealOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  const isOnline = isSimulating ? false : realOnline;

  return (
    <OfflineContext.Provider value={{ isOnline, isSimulating, toggleSimulation }}>
      {children}
    </OfflineContext.Provider>
  );
}

/** Use this everywhere instead of navigator.onLine */
export function useOnlineStatus() {
  return useContext(OfflineContext);
}
