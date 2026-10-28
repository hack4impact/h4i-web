"use server";

import { assertSession } from "@/lib/auth/guards";

import { getPartners as _getPartners } from "@/lib/notion/api";

export async function getPartners() {
  await assertSession();
  return _getPartners();
}
