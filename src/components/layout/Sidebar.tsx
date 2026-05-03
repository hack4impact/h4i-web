"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  FolderOpen,
  Users,
  ChevronDown,
} from "lucide-react";
import { credentialsSignOut } from "@/actions/authn";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/types";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: AppRole;
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function UserMenu({ user }: { user: User }) {
  return (
    <Menu.Root>
      <Menu.Trigger className="rounded-4 hover:bg-ghost-hover data-[popup-open]:bg-ghost-hover flex w-fit max-w-full items-center gap-10 px-4 py-4 pr-8 outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name ?? ""}
            className="rounded-6 h-24 w-24 shrink-0"
          />
        ) : (
          <div
            className="bg-blue-3 rounded-6 flex shrink-0 items-center justify-center text-[11px] font-medium text-white"
            style={{ width: 24, height: 24 }}
          >
            {initials(user.name)}
          </div>
        )}
        <span className="text-gray-1 truncate text-lg font-medium">
          {user.name ?? user.email}
        </span>
        <ChevronDown
          size={8}
          strokeWidth={1.5}
          className="text-gray-4 shrink-0"
        />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner align="start" sideOffset={4} className="z-50">
          <Menu.Popup className="menu-popup max-w-224">
            <div className="flex flex-col gap-2 px-12 py-4">
              <span className="text-gray-3">Signed in as</span>
              <span className="text-gray-1 truncate">{user.email}</span>
            </div>
            <div className="menu-separator mx-0" />
            <Menu.LinkItem
              className="menu-item"
              render={<Link href="/settings" />}
              closeOnClick
            >
              Settings
            </Menu.LinkItem>
            <Menu.Item
              className="menu-item"
              onClick={() => credentialsSignOut()}
            >
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
};

function NavItem({ href, label, icon, count }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "rounded-4 flex h-32 w-full cursor-default items-center gap-8 px-8 text-lg outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]",
        isActive
          ? "bg-ghost-hover text-gray-1"
          : "text-gray-2 hover:bg-ghost-hover"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-gray-3 tabular-nums">
          {count.toLocaleString()}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ user }: { user: User }) {
  return (
    <aside className="border-separator bg-panel flex h-full w-240 flex-none flex-col border-r">
      <div className="flex flex-1 flex-col gap-24 p-12">
        <UserMenu user={user} />
        <nav aria-label="Main" className="space-y-2">
          <NavItem
            href="/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard size={15} strokeWidth={1.5} />}
          />
          <NavItem
            href="/chapters"
            label="Chapters"
            icon={<Building2 size={15} strokeWidth={1.5} />}
          />
          <NavItem
            href="/partners"
            label="Partners"
            icon={<Handshake size={15} strokeWidth={1.5} />}
          />
          <NavItem
            href="/projects"
            label="Projects"
            icon={<FolderOpen size={15} strokeWidth={1.5} />}
          />
          <NavItem
            href="/volunteers"
            label="Volunteers"
            icon={<Users size={15} strokeWidth={1.5} />}
          />
        </nav>
      </div>
    </aside>
  );
}
