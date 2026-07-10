"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAdminLoggedIn } from "@/lib/auth";

/**
 * useAdminGuard — Admin Pages Ko Protect Karta Hai
 * Infinite loop fix: useRef use karke router ko call kiya.
 */
export function useAdminGuard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    // Sirf mount par ek baar check karega
    if (isAdminLoggedIn()) {
      setAuthorized(true);
    } else {
      routerRef.current.push("/admin-login");
    }
  }, []);

  return { authorized };
}
