import type { ProjectListResponse, ProjectResponse } from "./types";
import type { ProjectFilters } from "./filters";

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    if (response.status === 401)
      throw new Error("Your session has expired. Please sign in again.");
    throw new Error(
      `Projects could not be loaded (${response.status}). Please try again.`
    );
  }
  return response.json() as Promise<T>;
}

export const projectsClient = {
  list: (filters: ProjectFilters = {}, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    return request<ProjectListResponse>(`/api/projects?${params}`, signal);
  },
  get: (id: string) =>
    request<ProjectResponse>(`/api/projects/${encodeURIComponent(id)}`),
};
