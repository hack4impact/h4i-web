"use server";

import { assertSession } from "@/lib/auth/guards";

import { getProjects as _getProjects } from "@/lib/notion/api";

export async function getProjects() {
  await assertSession();
  return _getProjects();
}
