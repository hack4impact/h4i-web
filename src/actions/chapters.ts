"use server";

import { getChapters as _getChapters } from "@/lib/notion/api";

export async function getChapters() {
  return _getChapters();
}
