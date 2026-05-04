"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Avatar } from "@/components/ui/Avatar";
import {
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuLinkItem,
  MenuSeparator,
} from "@/components/ui/Menu";
import type { AppRole } from "@/types";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: AppRole;
};

function UserMenu({ user }: { user: User }) {
  return (
    <MenuRoot>
      <MenuTrigger className="rounded-4 hover:bg-ghost-hover data-[popup-open]:bg-ghost-hover flex w-fit max-w-full items-center gap-10 px-4 py-4 pr-8 outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]">
        <Avatar name={user.name} image={user.image ?? undefined} size="sm" />
        <span className="text-gray-1 truncate text-lg font-medium">
          {user.name ?? user.email}
        </span>
        <ChevronDown
          size={8}
          strokeWidth={1.5}
          className="text-gray-4 shrink-0"
        />
      </MenuTrigger>

      <MenuContent align="start" sideOffset={4} className="max-w-224">
        <div className="flex flex-col gap-2 px-12 py-4">
          <span className="text-gray-3">Signed in as</span>
          <span className="text-gray-1 truncate">{user.email}</span>
        </div>
        <MenuSeparator className="mx-0" />
        <MenuLinkItem render={<Link href="/settings" />} closeOnClick>
          Settings
        </MenuLinkItem>
        <MenuItem onClick={() => credentialsSignOut()}>Sign out</MenuItem>
      </MenuContent>
    </MenuRoot>
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
