import { createYoga } from "graphql-yoga";
import type { Viewer } from "@/lib/sourced-projects/contact-gating";
import { schema, type GraphQLContext } from "@/lib/graphql/schema";

// The viewer resolver is injected so tests can drive the real handler without
// an Auth.js session.
export function createGraphQLHandler(
  getViewer: (request: Request) => Promise<Viewer | null>
) {
  return createYoga<object, GraphQLContext>({
    schema,
    graphqlEndpoint: "/api/graphql",
    graphiql: process.env.NODE_ENV !== "production",
    fetchAPI: { Response },
    async context({ request }) {
      return { viewer: await getViewer(request) };
    },
  });
}
