"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Check local storage for user token/info
    const userStr = (document.cookie.split('; ').find(row => row.startsWith('user=')) ? (decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('user='))?.split('=')[1] || '{}')) : null);
    const accessToken = (document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]);

    if (!userStr || !accessToken) {
      // Not logged in -> redirect to login
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      // Check if user role is included in allowedRoles
      if (allowedRoles.includes(user.role)) {
        setIsAuthorized(true);
      } else {
        // Logged in but not the right role -> redirect to home or their own dashboard
        if (user.role === "admin") {
          router.replace("/admin");
        } else if (user.role === "mitra") {
          router.replace("/mitra");
        } else {
          router.replace("/");
        }
      }
    } catch (e) {
      // Invalid user data
      document.cookie = 'user=; path=/; max-age=0';
      document.cookie = 'access_token=; path=/; max-age=0';
      router.replace("/login");
    }
  }, [router, allowedRoles]);

  // While checking, show a loading slate
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-4xl text-blue-500 animate-spin">
            progress_activity
          </span>
          <p className="text-slate-500 font-medium text-sm animate-pulse">Memuat halaman aman...</p>
        </div>
      </div>
    );
  }

  // If check passed and is authorized, render the protected children
  return isAuthorized ? <>{children}</> : null;
}
