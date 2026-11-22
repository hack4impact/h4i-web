import type { ProjectPatch } from "./validation";

export class ProjectRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: {
      missingFields?: string[];
      fieldErrors?: Record<string, string[]>;
    }
  ) {
    super(message);
  }
}
export type ProjectSaveResult = ProjectPatch & {
  id: string;
  isDraft: boolean;
  hasUnpublishedChanges?: boolean;
};
async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ProjectRequestError(
      data.error || `Request failed (${response.status})`,
      response.status,
      data.details
    );
  return data;
}
export const projectClient = {
  save: (id: string | null, fields: ProjectPatch) =>
    request<ProjectSaveResult>(
      id ? `/api/projects/${encodeURIComponent(id)}` : "/api/projects",
      {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      }
    ),
  publish: (id: string) =>
    request<ProjectSaveResult>(
      `/api/projects/${encodeURIComponent(id)}/publish`,
      { method: "POST" }
    ),
  upload: (id: string, file: File) => {
    const body = new FormData();
    body.set("file", file);
    return request<{ url: string }>(
      `/api/projects/${encodeURIComponent(id)}/media`,
      { method: "POST", body }
    );
  },
};
