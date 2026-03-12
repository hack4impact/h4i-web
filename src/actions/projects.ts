"use server";

import { getProjects as _getProjects } from "@/lib/notion/api";

export async function getProjects() {
  return _getProjects();
}
