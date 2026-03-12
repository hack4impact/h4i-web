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

export type NotionData = {
  rows: Record<string, string>[];
  columns: string[];
};

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

function createGetter(name: string, sourceId: string, cacheKey: string) {
  return unstable_cache(
    async (): Promise<NotionData> => {
      try {
        const results = await fetchAllPages(sourceId);
        const rows = results.map(flattenNotionPage);
        return {
          rows,
          columns: Object.keys(rows[0] ?? {}),
        };
      } catch (error) {
        console.error(`Failed to fetch ${name} from Notion:`, error);
        return { rows: [], columns: [] };
      }
    },
    [cacheKey],
    { revalidate: 3600 }
  );
}

export const getChapters = createGetter(
  "chapters",
  PROGRAMS_DATA_SOURCE_ID,
  "notion-chapters"
);
export const getPartners = createGetter(
  "partners",
  PARTNERS_DATA_SOURCE_ID,
  "notion-partners"
);
export const getProjects = createGetter(
  "projects",
  PROJECTS_DATA_SOURCE_ID,
  "notion-projects"
);
export const getVolunteers = createGetter(
  "volunteers",
  VOLUNTEERS_DATA_SOURCE_ID,
  "notion-volunteers"
);
