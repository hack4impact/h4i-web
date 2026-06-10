import { createClient } from "contentful";

if (!process.env.CONTENTFUL_SPACE_ID) {
  throw new Error("CONTENTFUL_SPACE_ID environment variable is not set");
}
if (!process.env.CONTENTFUL_PREVIEW_TOKEN) {
  throw new Error("CONTENTFUL_PREVIEW_TOKEN environment variable is not set");
}

// Uses the Preview API to serve draft content
export const contentfulClient = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_PREVIEW_TOKEN,
  host: "preview.contentful.com",
  environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
});
