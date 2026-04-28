import { auth } from "@/lib/authn";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex h-screen">
      <Sidebar user={session!.user} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
