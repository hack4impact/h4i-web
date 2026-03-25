"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { Avatar } from "@base-ui/react/avatar";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  FolderOpen,
  Users,
  ChevronDown,
} from "lucide-react";
import { Separator } from "@base-ui/react/separator";
import { credentialsSignOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

// User menu

function UserMenu() {
  const initials = "AD";
  const name = "Administrator";
  const email = "admin@hack4impact.org";

  return (
    <Popover.Root>
      <Popover.Trigger className="hover:bg-ghost-hover data-popup-open:bg-ghost-hover flex w-fit cursor-pointer items-center gap-10 px-4 py-4 pr-8">
        <Avatar.Root className="flex size-24 shrink-0 items-center justify-center bg-(--accent) text-sm font-medium text-white">
          <Avatar.Fallback className="leading-none">{initials}</Avatar.Fallback>
        </Avatar.Root>
        <span className="flex-1 text-left font-medium">{name}</span>
        <ChevronDown size={12} strokeWidth={1} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={4} className="z-50">
          <Popover.Popup className="bg-panel border-separator max-w-224 border p-4 shadow-sm">
            <div className="text-secondary flex flex-col gap-2 px-12 py-4">
              <span className="text-text-3">Signed in as</span>
              <span className="text-text-primary">{email}</span>
            </div>
            <Separator className="my-4" />
            <Link
              href="/settings"
              className="hover:bg-ghost-hover flex w-full items-center px-12 py-4"
            >
              Settings
            </Link>
            <Popover.Close
              className="hover:bg-ghost-hover flex w-full cursor-pointer items-center px-12 py-4"
              onClick={() => credentialsSignOut()}
            >
              Sign out
            </Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Nav item

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
        "flex h-32 w-full cursor-default items-center gap-8 px-8 text-lg",
        isActive
          ? "bg-(--active-bg) font-medium"
          : "text-lg hover:bg-(--hover-bg) hover:text-(--text-primary)"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="tabular-nums">{count.toLocaleString()}</span>
      )}
    </Link>
  );
}

// Sidebar

export function Sidebar() {
  return (
    <aside className="bg-panel border-separator flex h-full w-240 flex-none shrink-0 flex-col gap-24 border-r text-lg">
      <div className="flex flex-1 flex-col gap-24 p-12">
        <UserMenu />
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
