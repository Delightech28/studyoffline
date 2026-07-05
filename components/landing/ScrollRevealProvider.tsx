"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

/**
 * Thin client component that activates the scroll-reveal observer.
 * Wrap the page in this so server components like Footer stay RSC.
 */
export default function ScrollRevealProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useScrollReveal();
  return <>{children}</>;
}
