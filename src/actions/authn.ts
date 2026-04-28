"use server";

import { signIn, signOut } from "@/lib/authn";
import { AuthError } from "next-auth";

export async function credentialsSignIn(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error; // re-throw redirect
  }
}

export async function credentialsSignOut() {
  await signOut({ redirectTo: "/sign-in" });
}
