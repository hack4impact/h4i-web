import { auth } from "@/lib/authn";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return <>{children}</>;
}
