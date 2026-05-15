"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { AUTH_SESSION_EVENT, hasValidSession } from "@/lib/auth-session";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useSyncExternalStore(subscribeToAuthSession, hasValidSession, () => false);

  useEffect(() => {
    if (pathname === "/login" && isAuthenticated) {
      router.replace("/");
      return;
    }

    if (pathname !== "/login" && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, pathname, router]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }

    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isMounted]);

  if (pathname === "/login") {
    return <main className="flex min-h-screen w-full bg-background">{children}</main>;
  }

  if (!isAuthenticated) {
    return <main className="flex min-h-screen w-full bg-background" />;
  }

  if (!isMounted) {
    return <div className="flex h-screen bg-background" />;
  }

  return (
    <>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </>
  );
}

function subscribeToAuthSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(AUTH_SESSION_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(AUTH_SESSION_EVENT, onStoreChange);
  };
}
