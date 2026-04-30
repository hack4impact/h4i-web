"use server";

import { signIn, signOut } from "@/lib/authn";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

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

export async function credentialsSignUp(formData: FormData) {
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!firstName || !lastName || !email || !password) {
    return { error: "All fields are required." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const hashed = await bcrypt.hash(password, 12);
  await db.user.create({
    data: { name: `${firstName} ${lastName}`, email, password: hashed },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but sign-in failed. Please sign in." };
    }
    throw error;
  }
}

export async function credentialsSignOut() {
  await signOut({ redirectTo: "/sign-in" });
}
