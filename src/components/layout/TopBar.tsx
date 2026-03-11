"use client";

import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { Avatar } from "@base-ui/react/avatar";
import { credentialsSignOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

// Icons

function LogoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Breadcrumb

const pageLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/chapters": "Chapters",
  "/partners": "Partners",
  "/projects": "Projects",
  "/volunteers": "Volunteers",
  "/settings": "Settings",
};

function Breadcrumb() {
  const pathname = usePathname();

  const segment = "/" + pathname.split("/")[1];
  const pageLabel = pageLabels[segment] ?? "Dashboard";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-primary font-semibold">Hack for Impact</span>
      <span className="text-text-meta">/</span>
      <span className="text-text-secondary">Admin</span>
      <span className="text-text-meta">/</span>
      <span className="text-text-secondary">{pageLabel}</span>
    </div>
  );
}

// User menu

function UserMenu() {
  const initials = "AK";
  const name = "Admin Khoa";

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          "flex h-8 cursor-pointer items-center gap-1.5 rounded-sm px-2",
          "bg-canvas transition-opacity hover:opacity-80",
          "focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-2"
        )}
      >
        <Avatar.Root className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE]">
          <Avatar.Fallback className="text-[9px] leading-none text-[#1E40AF]">
            {initials}
          </Avatar.Fallback>
        </Avatar.Root>
        <span className="text-text-primary text-sm">{name}</span>
        <span className="text-text-meta">
          <ChevronDownIcon />
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={4}>
          <Popover.Popup
            className={cn(
              "border-border bg-card min-w-35 rounded-md border p-1 shadow-md",
              "origin-top-right data-starting-scale:scale-95 data-starting-style:opacity-0",
              "transition-[transform,opacity] duration-100"
            )}
          >
            <Popover.Close
              className="text-text-secondary hover:bg-surface hover:text-text-primary focus-visible:outline-brand flex w-full cursor-pointer items-center rounded-sm px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
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

// TopBar

export function TopBar() {
  return (
    <header className="border-border bg-topbar flex h-12 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2.5">
        <span className="text-text-meta">
          <LogoIcon />
        </span>
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3">
        <button
          className="text-text-meta hover:bg-surface hover:text-text-secondary focus-visible:outline-brand flex h-8 w-8 items-center justify-center rounded-sm transition-colors focus-visible:outline-2"
          aria-label="Notifications"
        >
          <BellIcon />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
