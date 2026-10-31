"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "@base-ui/react/menu";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  FolderOpen,
  Users,
  Contact,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarUser = {
  email: string;
  role: string;
};

/** "ada@x.org" -> "AD". Users have no name column, so initials come from the email. */
function initialsFromEmail(email: string) {
  return email.slice(0, 2).toUpperCase();
}

/** "PROJECT_LEAD" -> "Project lead" */
function formatRole(role: string) {
  const words = role.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function UserMenu({ user }: { user: SidebarUser }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const initials = initialsFromEmail(user.email);
  const name = formatRole(user.role);
  const email = user.email;

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      // POST, not a link: a GET logout can be triggered by any <img> tag
      // pointing at the URL, which would sign people out unexpectedly.
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Network failure -- fall through and send them to sign-in anyway.
    }
    router.push("/sign-in");
    router.refresh();
  }

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
              disabled={isSigningOut}
              onClick={handleSignOut}
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
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

export function Sidebar({ user }: { user: SidebarUser }) {
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
            href="/members"
            label="Members"
            icon={<Contact size={15} strokeWidth={1.5} />}
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
