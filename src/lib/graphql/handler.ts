import { auth } from "@/lib/auth";
import { createGraphQLHandler } from "@/lib/graphql/yoga";
import type { Viewer } from "@/lib/sourced-projects/contact-gating";

// The signed-in user as the API sees them, or null.
export async function getViewer(): Promise<Viewer | null> {
  const user = (await auth())?.user;
  return user
    ? { id: user.id, role: user.role, chapterId: user.chapterId }
    : null;
}

// The app's GraphQL handler, authenticated with the Auth.js session. Used by
// the API route and, in-process, by server components.
export const graphqlHandler = createGraphQLHandler(getViewer);
