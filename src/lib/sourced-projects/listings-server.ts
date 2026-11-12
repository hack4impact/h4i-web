import { graphqlHandler } from "@/lib/graphql/handler";
import { createServerRequest } from "@/lib/graphql/request";
import { createListingsApi } from "@/lib/sourced-projects/listings-api";

export const listingsApi = createListingsApi(
  createServerRequest(graphqlHandler)
);
