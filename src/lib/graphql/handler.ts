import { auth } from "@/lib/auth";
import { createGraphQLHandler } from "@/lib/graphql/yoga";

// The app's GraphQL handler, authenticated with the Auth.js session. Used by
// the API route and, in-process, by server components.
export const graphqlHandler = createGraphQLHandler(async () => {
  const user = (await auth())?.user;
  return user
    ? { id: user.id, role: user.role, chapterId: user.chapterId }
    : null;
});
