/* eslint-disable @typescript-eslint/no-explicit-any */
import { unstable_cache } from "next/cache";
import { flattenNotionPage } from "./flatten";
import {
  notion,
  PROGRAMS_DATA_SOURCE_ID,
  PROJECTS_DATA_SOURCE_ID,
  PARTNERS_DATA_SOURCE_ID,
  VOLUNTEERS_DATA_SOURCE_ID,
} from "./client";

async function fetchAllPages(dataSourceId: string): Promise<any[]> {
  const allResults: any[] = [];
  let cursor: string | undefined;

  do {
    const query: any = { data_source_id: dataSourceId };
    if (cursor) query.start_cursor = cursor;
    const response: any = await (notion as any).dataSources.query(query);
    allResults.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return allResults;
}

export const getChapters = unstable_cache(
  async () => {
    try {
      const results = await fetchAllPages(PROGRAMS_DATA_SOURCE_ID);
      return results.map(flattenNotionPage);
    } catch (error) {
      console.error("Failed to fetch programs from Notion:", error);
      return [];
    }
  },
  ["notion-chapters"],
  { revalidate: 3600 }
);

export const getPartners = unstable_cache(
  async () => {
    try {
      const results = await fetchAllPages(PARTNERS_DATA_SOURCE_ID);
      return results.map(flattenNotionPage);
    } catch (error) {
      console.error("Failed to fetch partners from Notion:", error);
      return [];
    }
  },
  ["notion-partners"],
  { revalidate: 3600 }
);

export const getProjects = unstable_cache(
  async () => {
    try {
      const results = await fetchAllPages(PROJECTS_DATA_SOURCE_ID);
      return results.map(flattenNotionPage);
    } catch (error) {
      console.error("Failed to fetch projects from Notion:", error);
      return [];
    }
  },
  ["notion-projects"],
  { revalidate: 3600 }
);

export const getVolunteers = unstable_cache(
  async () => {
    try {
      const results = await fetchAllPages(VOLUNTEERS_DATA_SOURCE_ID);
      return results.map(flattenNotionPage);
    } catch (error) {
      console.error("Failed to fetch volunteers from Notion:", error);
      return [];
    }
  },
  ["notion-volunteers"],
  { revalidate: 3600 }
);
