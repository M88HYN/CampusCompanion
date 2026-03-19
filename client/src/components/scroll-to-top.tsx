import { useEffect } from "react";
import { useLocation } from "wouter";
import { useReducedMotion } from "framer-motion";

export function ScrollToTop() {
  const [location] = useLocation();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [location, reducedMotion]);

  return null;
}