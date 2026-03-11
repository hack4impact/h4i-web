"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Icons

function DashboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function ChaptersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PartnersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function VolunteersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// Nav item

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ComponentType;
  count?: number;
};

function NavItem({ href, label, icon: Icon, count }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex h-8 items-center gap-2.5 rounded-sm px-3 text-sm transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          isActive
            ? "bg-canvas font-medium text-text-primary"
            : "text-text-secondary hover:bg-canvas/60"
        )}
      >
        <span className="shrink-0 text-text-meta">
          <Icon />
        </span>
        <span className="flex-1">{label}</span>
        {count !== undefined && (
          <span className="tabular-nums text-xs text-text-meta">
            {count.toLocaleString()}
          </span>
        )}
      </Link>
    </li>
  );
}

// Section label

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-meta">
      {children}
    </p>
  );
}

// Nav section

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
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
    <nav aria-label="Main" className="flex h-full w-[200px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-4">
        <NavSection label="Overview">
          <NavItem href="/dashboard" label="Dashboard" icon={DashboardIcon} />
        </NavSection>

        <NavSection label="Directories">
          <NavItem href="/chapters" label="Chapters" icon={ChaptersIcon} />
          <NavItem href="/partners" label="Partners" icon={PartnersIcon} />
          <NavItem href="/projects" label="Projects" icon={ProjectsIcon} />
          <NavItem href="/volunteers" label="Volunteers" icon={VolunteersIcon} />
        </NavSection>
      </div>

      <div className="border-t border-border px-2 py-4">
        <NavSection label="Settings">
          <NavItem href="/settings" label="Settings" icon={SettingsIcon} />
        </NavSection>
      </div>
    </nav>
  );
}
