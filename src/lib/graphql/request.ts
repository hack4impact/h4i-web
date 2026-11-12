export type GraphQLRequest = <TData>(
  query: string,
  variables?: Record<string, unknown>
) => Promise<TData>;

export type GraphQLInputIssue = { path: string; message: string };

type GraphQLResponse<TData> = {
  data?: TData | null;
  errors?: {
    message: string;
    extensions?: { code?: string; issues?: GraphQLInputIssue[] };
  }[];
};

export class GraphQLRequestError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    // Per-field problems on a BAD_USER_INPUT error.
    readonly issues: GraphQLInputIssue[] = []
  ) {
    super(message);
  }
}

const ENDPOINT = "/api/graphql";

async function send<TData>(
  fetcher: (url: string, init: RequestInit) => Promise<Response>,
  url: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  const response = await fetcher(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await response.json()) as GraphQLResponse<TData>;
  const [error] = body.errors ?? [];
  if (error || !body.data) {
    throw new GraphQLRequestError(
      error?.message ?? `GraphQL request failed (${response.status})`,
      error?.extensions?.code,
      error?.extensions?.issues
    );
  }
  return body.data;
}

// For client components: goes over HTTP with the session cookie.
export const browserRequest: GraphQLRequest = (query, variables) =>
  send(fetch, ENDPOINT, query, variables);

// For server code: runs the given handler in-process, so the request is
// authorized with the current session and gated exactly like an HTTP call.
export function createServerRequest(handler: {
  handleRequest: (
    request: Request,
    context: object
  ) => Response | Promise<Response>;
}): GraphQLRequest {
  return (query, variables) =>
    send(
      async (url, init) => handler.handleRequest(new Request(url, init), {}),
      `http://localhost${ENDPOINT}`,
      query,
      variables
    );
}
