"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoleRedirector() {
  const router = useRouter();

  useEffect(() => {
    const userStr = (document.cookie.split('; ').find(row => row.startsWith('user=')) ? (decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('user='))?.split('=')[1] || '{}')) : null);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "admin") {
          router.replace("/admin");
        } else if (user.role === "mitra") {
          router.replace("/mitra");
        }
      } catch (e) {
        // Safe fail
      }
    }
  }, [router]);

  return null; // This component doesn't render anything visually
}
