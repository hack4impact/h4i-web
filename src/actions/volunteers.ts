"use server";

import { assertSession } from "@/lib/auth/guards";

import { getVolunteers as _getVolunteers } from "@/lib/notion/api";

export async function getVolunteers() {
  await assertSession();
  return _getVolunteers();
}
