"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  FolderOpen,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { credentialsSignOut } from "@/actions/authn";

interface SidebarProps {
  userName?: string | null;
  userRole?: string | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/chapters", label: "Chapters", Icon: Building2 },
  { href: "/partners", label: "Partners", Icon: Handshake },
  { href: "/projects", label: "Projects", Icon: FolderOpen },
  { href: "/volunteers", label: "Volunteers", Icon: Users },
];

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const navItemClass = (active: boolean) =>
  cn(
    "label flex items-center gap-2.5 rounded-[var(--radius-6)] px-3 py-2 transition-colors",
    active
      ? "bg-panel-highlight-1 text-blue-500"
      : "text-gray-2 hover:bg-gray-5 hover:text-inverse"
  );

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="border-separator bg-root shadow-popup sticky top-3 m-3 flex h-[calc(100vh-1.5rem)] w-64 shrink-0 flex-col rounded-xl border">
      <div className="border-separator flex h-16 items-center border-b px-5">
        <Link href="/dashboard">
          <Image
            src="/logo.svg"
            alt="Hack4Impact"
            width={120}
            height={18}
            className="logo-adaptive"
          />
        </Link>
      </div>

      <nav
        aria-label="Main navigation"
        className="flex flex-1 flex-col gap-0.5 p-3 pt-4"
      >
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={navItemClass(active)}>
              <Icon size={14} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-separator flex flex-col gap-0.5 border-t p-3">
        {userName && (
          <div className="mb-1 px-3 py-2">
            <p className="label-xs text-inverse truncate">{userName}</p>
            {userRole && (
              <p className="label-xs text-gray-3 mt-0.5">
                {formatRole(userRole)}
              </p>
            )}
          </div>
        )}

        <Link
          href="/settings"
          className={navItemClass(
            pathname === "/settings" || pathname.startsWith("/settings/")
          )}
        >
          <Settings size={14} strokeWidth={1.5} />
          Settings
        </Link>

        <form action={credentialsSignOut}>
          <button
            type="submit"
            className="label text-gray-2 hover:bg-gray-5 hover:text-inverse flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius-6)] px-3 py-2 transition-colors"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
