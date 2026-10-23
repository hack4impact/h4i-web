import { createGraphQLHandler } from "@/lib/graphql/yoga";
import type { Viewer } from "@/lib/sourced-projects/contact-gating";

export const VOLUNTEER: Viewer = {
  id: "seed-user-volunteer-uiuc",
  role: "VOLUNTEER",
  chapterId: "seed-chapter-uiuc",
};
export const LEAD: Viewer = {
  id: "seed-user-lead-berkeley",
  role: "CHAPTER_LEADER",
  chapterId: "seed-chapter-berkeley",
};
export const ADMIN: Viewer = {
  id: "seed-user-admin",
  role: "ADMIN",
  chapterId: null,
};

export type GraphQLResult = {
  data?: Record<string, unknown>;
  errors?: { message: string; extensions: Record<string, unknown> }[];
};

// Goes through the real HTTP handler so assertions see the exact response body.
export async function run(
  query: string,
  viewer: Viewer | null,
  variables?: Record<string, unknown>
): Promise<GraphQLResult & { raw: string }> {
  const yoga = createGraphQLHandler(async () => viewer);
  const response = await yoga.fetch("http://localhost/api/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const raw = await response.text();
  return { ...JSON.parse(raw), raw };
}
