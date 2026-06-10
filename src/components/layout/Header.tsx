"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DesktopNav } from "./header/DesktopNav";
import { MobileNav } from "./header/MobileNav";
import { ThemeToggle } from "./header/ThemeToggle";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header>
      <nav className="flex h-16 items-center justify-between px-8 md:px-16">
        <Link href="/">
          <Image
            src="/logomark.svg"
            alt="Hack4Impact"
            width={32}
            height={32}
            className="logo-adaptive md:hidden"
          />
          <Image
            src="/logo.svg"
            alt="Hack4Impact"
            width={150}
            height={40}
            className="logo-adaptive hidden md:block"
          />
        </Link>

        <DesktopNav />

        <button
          type="button"
          className="font-sans text-base md:hidden"
          onClick={() => setMobileOpen((x) => !x)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? "Close" : "Menu"}
        </button>
      </nav>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <ThemeToggle />
    </header>
  );
}
