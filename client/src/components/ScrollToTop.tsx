"use client";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    // delay one tick so layout paints before scroll
    requestAnimationFrame(() => 
      window.scrollTo({ 
        top: 0, 
        left: 0, 
        behavior: "instant" as ScrollBehavior 
      })
    );
  }, [location]);
  
  return null;
}
