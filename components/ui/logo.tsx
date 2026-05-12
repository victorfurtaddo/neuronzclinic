"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

interface LogoProps {
  isCollapsed: boolean;
}

export function Logo({ isCollapsed }: LogoProps) {
  const { resolvedTheme = "light" } = useTheme();

  const src = isCollapsed
    ? resolvedTheme === "dark"
      ? "/logo-icon-dark.png"
      : "/logo-icon-light.png"
    : resolvedTheme === "dark"
      ? "/logo-full-dark.png"
      : "/logo-full-light.png";

  return (
    <div className="flex w-full items-center px-3">
      <div className="relative transition-all duration-300 ease-in-out">
        <div className="flex h-15 w-22 items-center">
          <Image src={src} alt="Logo Tournieux" height={40} width={150} priority />
        </div>
      </div>
    </div>
  );
}
