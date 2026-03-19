"use client";

import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react/popover";
import { Avatar } from "@base-ui/react/avatar";
import { credentialsSignOut } from "@/actions/auth";

// Icons

function LogoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
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
      strokeWidth="1.5"
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
      strokeWidth="1.5"
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
    <div className="flex items-center gap-2">
      <span>Hack for Impact</span>
      <span>/</span>
      <span>Admin</span>
      <span>/</span>
      <span>{pageLabel}</span>
    </div>
  );
}

// User menu

function UserMenu() {
  const initials = "AK";
  const name = "Admin Khoa";

  return (
    <Popover.Root>
      <Popover.Trigger className="flex h-8 cursor-pointer items-center gap-1.5 px-2">
        <Avatar.Root className="flex h-4.5 w-4.5 shrink-0 items-center justify-center">
          <Avatar.Fallback className="leading-none">{initials}</Avatar.Fallback>
        </Avatar.Root>
        <span>{name}</span>
        <span>
          <ChevronDownIcon />
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner align="end" sideOffset={4}>
          <Popover.Popup className="min-w-35 p-1">
            <Popover.Close
              className="flex w-full cursor-pointer items-center px-3 py-1.5"
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
    <header className="flex h-12 shrink-0 items-center justify-between px-4">
      <div className="flex items-center gap-2.5">
        <span>
          <LogoIcon />
        </span>
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3">
        <button
          className="flex h-8 w-8 items-center justify-center"
          aria-label="Notifications"
        >
          <BellIcon />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
