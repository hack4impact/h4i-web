import { Sidebar } from "@/components/layout/Sidebar";
import { requireSession } from "@/lib/auth/guards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The real gate. proxy.ts only checked that a cookie existed; this looks the
  // session up in the database and redirects if it is missing or expired.
  // Applies to every page nested under (protected).
  const session = await requireSession();

  return (
    <div className="flex h-screen">
      <Sidebar user={{ email: session.user.email, role: session.user.role }} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
