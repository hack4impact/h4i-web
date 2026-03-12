"use server";

import { getPartners as _getPartners } from "@/lib/notion/api";

export async function getPartners() {
  return _getPartners();
}
