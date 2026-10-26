import { auth } from "@/lib/auth";
import { createGraphQLHandler } from "@/lib/graphql/yoga";

const yoga = createGraphQLHandler(async () => {
  const user = (await auth())?.user;
  return user
    ? { id: user.id, role: user.role, chapterId: user.chapterId }
    : null;
});

export async function GET(request: Request) {
  return yoga.handleRequest(request, {});
}

export async function POST(request: Request) {
  return yoga.handleRequest(request, {});
}
