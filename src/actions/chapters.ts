"use server";

import { assertSession } from "@/lib/auth/guards";

import { getChapters as _getChapters } from "@/lib/notion/api";

export async function getChapters() {
  await assertSession();
  return _getChapters();
}
