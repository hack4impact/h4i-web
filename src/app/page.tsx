import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

export default async function RootPage() {
  const session = await getCurrentSession();
  redirect(session ? "/dashboard" : "/sign-in");
}
