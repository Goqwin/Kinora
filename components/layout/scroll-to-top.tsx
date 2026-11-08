"use client";

import { useEffect } from "react";

/**
 * Detail pages opened from long lists must start at the top. Blocking
 * navigations (instant = false) can leave the old scroll position in place.
 */
export function ScrollToTop() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, []);
  return null;
}
