"use client";

import { useEffect } from "react";

/**
 * Attaches an IntersectionObserver to every element with class "reveal".
 * When 20% of the element is visible, adds the "visible" class which
 * triggers the CSS transition defined in globals.css.
 */
export function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            // Once revealed, stop observing to save resources
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
