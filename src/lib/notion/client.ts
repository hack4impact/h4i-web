import { Client } from "@notionhq/client";

/**
 * Notion-backed directory pages (volunteers/partners/…) need NOTION_API_KEY.
 * Missing key must not crash the whole app module graph — getters already
 * catch fetch failures and return empty rows.
 */
if (!process.env.NOTION_API_KEY) {
  console.warn(
    "NOTION_API_KEY is not set — Notion directory pages will show empty data"
  );
}

export const notion = new Client({
  auth: process.env.NOTION_API_KEY || "missing-notion-api-key",
});

export const PROGRAMS_DATA_SOURCE_ID = "27b197ab-f07b-80ab-999b-000bc1682f4f";
export const PROJECTS_DATA_SOURCE_ID = "27b197ab-f07b-80cf-8d0e-000b8507cb8f";
export const PARTNERS_DATA_SOURCE_ID = "27b197ab-f07b-80a4-8a5d-000b57c0e149";
export const VOLUNTEERS_DATA_SOURCE_ID = "27b197ab-f07b-8071-9196-000babef012e";
