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
import { credentialsSignOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

function UserMenu() {
  const initials = "AD";
  const name = "Administrator";
  const email = "admin@hack4impact.org";

  return (
    <Menu.Root>
      <Menu.Trigger className="rounded-4 hover:bg-ghost-hover data-[popup-open]:bg-ghost-hover flex w-fit max-w-full items-center gap-10 px-4 py-4 pr-8 outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]">
        <div
          className="bg-blue-3 flex shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white"
          style={{ width: 24, height: 24 }}
        >
          {initials}
        </div>
        <span className="text-gray-1 truncate text-lg font-medium">{name}</span>
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
              <span className="text-gray-1 truncate">{email}</span>
            </div>
            <div className="menu-separator mx-0" />
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
        "rounded-4 flex h-32 w-auto shrink-0 cursor-default items-center gap-8 px-8 text-lg outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus)] sm:w-full",
        isActive
          ? "bg-ghost-hover text-gray-1"
          : "text-gray-2 hover:bg-ghost-hover"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 whitespace-nowrap">{label}</span>
      {count !== undefined && (
        <span className="text-gray-3 tabular-nums">
          {count.toLocaleString()}
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="border-separator bg-panel flex w-full flex-none flex-col border-b sm:h-full sm:w-240 sm:border-r sm:border-b-0">
      <div className="flex flex-1 flex-col gap-8 p-12 sm:gap-24">
        <UserMenu />
        <nav
          aria-label="Main"
          className="flex overflow-x-auto sm:block sm:space-y-2"
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
            label="Project Directory"
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
