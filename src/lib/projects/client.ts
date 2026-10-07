import type { ProjectResponse } from "./types";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Project request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const projectsClient = {
  list: () => request<ProjectResponse[]>("/api/projects"),
  get: (id: string) =>
    request<ProjectResponse>(`/api/projects/${encodeURIComponent(id)}`),
};
