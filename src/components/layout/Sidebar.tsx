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
      <Popover.Trigger className="flex h-32 w-full cursor-pointer items-center gap-6 px-8 hover:bg-(--hover-bg)">
        <Avatar.Root className="flex h-18 w-18 shrink-0 items-center justify-center bg-(--accent) text-[10px] font-medium text-white">
          <Avatar.Fallback className="leading-none">{initials}</Avatar.Fallback>
        </Avatar.Root>
        <span className="flex-1 text-left">{name}</span>
        <ChevronDown size={12} strokeWidth={1} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={4} className="z-50">
          <Popover.Popup className="bg-panel border-separator min-w-140 border p-4 shadow-sm">
            <div className="px-12 py-6 text-(--text-secondary)">
              Signed in as
              <br />
              {email}
            </div>
            <Separator className="my-4" />
            <Link
              href="/settings"
              className="flex w-full items-center px-12 py-6 hover:bg-(--hover-bg)"
            >
              Settings
            </Link>
            <Popover.Close
              className="flex w-full cursor-pointer items-center px-12 py-6 hover:bg-(--hover-bg)"
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
        "flex h-32 items-center gap-8 px-8",
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
    <aside className="bg-panel border-separator flex h-full w-240 shrink-0 flex-col gap-24 border-r text-lg">
      <div className="shrink-0 px-8 py-16">
        <UserMenu />
      </div>
      <nav
        aria-label="Main"
        className="flex h-full flex-1 flex-col gap-1 overflow-y-auto px-8 pb-16"
      >
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
    </aside>
  );
}
