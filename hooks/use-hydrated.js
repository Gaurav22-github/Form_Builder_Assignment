"use client";

import { useEffect, useState } from "react";

/**
 * useHydrated — SSR (Server-Side Rendering) Problem Ka Solution
 *
 * PROBLEM:
 * Next.js pehle server par HTML render karta hai, phir browser pe.
 * Server ke paas `window` aur `localStorage` nahi hota.
 * Agar directly localStorage access karo, error aata hai.
 *
 * SOLUTION:
 * Yeh hook tab `true` return karta hai jab component browser mein
 * successfully mount ho chuka hota hai.
 * `useEffect` SIRF browser par run karta hai, server par nahi.
 * Isliye isliye yeh ek reliable signal hai ki ab localStorage safe hai.
 *
 * USE:
 *   const hydrated = useHydrated();
 *   if (!hydrated) return; // Server par mat chalo
 *   const data = localStorage.getItem("key"); // Ab safe hai
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false); // Shuru mein false
  useEffect(() => setHydrated(true), []);           // Browser pe mount hone ke baad true
  return hydrated;
}
