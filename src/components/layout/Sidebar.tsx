"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { Avatar } from "@base-ui/react/avatar";
import { credentialsSignOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

// User menu

function UserMenu() {
  const initials = "AK";
  const name = "Admin Khoa";

  return (
    <Popover.Root>
      <Popover.Trigger className="flex h-8 w-full cursor-pointer items-center gap-1.5 px-2 hover:bg-(--hover-bg)">
        <Avatar.Root className="flex h-4.5 w-4.5 shrink-0 items-center justify-center bg-(--accent) text-[10px] font-medium text-white">
          <Avatar.Fallback className="leading-none">{initials}</Avatar.Fallback>
        </Avatar.Root>
        <span className="flex-1 text-left">{name}</span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={4}>
          <Popover.Popup className="min-w-35 border border-(--border) bg-(--surface-raised) p-1 shadow-sm">
            <Popover.Close
              className="flex w-full cursor-pointer items-center px-3 py-1.5 hover:bg-(--hover-bg)"
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
  count?: number;
};

function NavItem({ href, label, count }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex h-7 items-center gap-1.5 px-2",
          isActive
            ? "bg-(--active-bg) font-medium"
            : "text-(--text-secondary) hover:bg-(--hover-bg) hover:text-(--text-primary)"
        )}
      >
        <span className="flex-1">{label}</span>
        {count !== undefined && (
          <span className="tabular-nums">{count.toLocaleString()}</span>
        )}
      </Link>
    </li>
  );
}

// Section label

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label mb-1 px-2">{children}</p>;
}

// Nav section

function NavSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </div>
  );
}

// Sidebar

export function Sidebar() {
  return (
    <nav
      aria-label="Main"
      className="flex h-full w-50 shrink-0 flex-col border-r border-(--border) bg-(--surface-panel)"
    >
      <div className="shrink-0 px-2 py-4">
        <UserMenu />
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 pb-4">
        <NavSection label="Overview">
          <NavItem href="/dashboard" label="Dashboard" />
        </NavSection>

        <NavSection label="Directories">
          <NavItem href="/chapters" label="Chapters" />
          <NavItem href="/partners" label="Partners" />
          <NavItem href="/projects" label="Projects" />
          <NavItem href="/volunteers" label="Volunteers" />
        </NavSection>
      </div>

      <div className="shrink-0 px-2 py-4">
        <NavSection label="Settings">
          <NavItem href="/settings" label="Settings" />
        </NavSection>
      </div>
    </nav>
  );
}
