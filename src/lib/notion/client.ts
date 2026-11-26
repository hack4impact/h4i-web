import { Client } from "@notionhq/client";

let client: Client | undefined;

// Created on first use so modules importing this file can load without the key.
export function getNotionClient(): Client {
  if (!client) {
    if (!process.env.NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY environment variable is not set");
    }
    client = new Client({ auth: process.env.NOTION_API_KEY });
  }
  return client;
}

export const PROGRAMS_DATA_SOURCE_ID = "27b197ab-f07b-80ab-999b-000bc1682f4f";
export const PROJECTS_DATA_SOURCE_ID = "27b197ab-f07b-80cf-8d0e-000b8507cb8f";
export const PARTNERS_DATA_SOURCE_ID = "27b197ab-f07b-80a4-8a5d-000b57c0e149";
export const VOLUNTEERS_DATA_SOURCE_ID = "27b197ab-f07b-8071-9196-000babef012e";
