"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  isCollapsed: boolean;
}

export function Logo({ isCollapsed }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 1. Esse useEffect garante que o código abaixo só rode no Cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("h-10", isCollapsed ? "w-10" : "w-32")} />;
  }

  let src = "/logo-full-dark.png";

  if (isCollapsed) {
    src = resolvedTheme === "dark" ? "/logo-icon-dark.png" : "/logo-icon-light.png";
  } else {
    src = resolvedTheme === "dark" ? "/logo-full-dark.png" : "/logo-full-light.png";
  }

  return (
    <div className="flex items-center w-full px-3">
      <div className="relative transition-all duration-300 ease-in-out">
        {/* Versão Full (Aberto) */}
        <div className="inset-0 w-22 h-15 flex items-center">
          <Image src={src} alt="Logo Tournieux" height={40} width={150} priority />
        </div>
      </div>
    </div>
  );
}

