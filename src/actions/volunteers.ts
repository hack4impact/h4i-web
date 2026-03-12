"use server";

import { getVolunteers as _getVolunteers } from "@/lib/notion/api";

export async function getVolunteers() {
  return _getVolunteers();
}
