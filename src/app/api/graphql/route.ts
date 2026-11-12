import { graphqlHandler } from "@/lib/graphql/handler";

export async function GET(request: Request) {
  return graphqlHandler.handleRequest(request, {});
}

export async function POST(request: Request) {
  return graphqlHandler.handleRequest(request, {});
}
