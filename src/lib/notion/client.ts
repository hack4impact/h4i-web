import { Client } from '@notionhq/client'

if (!process.env.NOTION_API_KEY) {
  throw new Error('NOTION_API_KEY environment variable is not set')
}

export const notion = new Client({ auth: process.env.NOTION_API_KEY })

// Notion Data Source IDs for each database
export const PROGRAMS_DATA_SOURCE_ID = '27b197ab-f07b-80ab-999b-000bc1682f4f'
export const PROJECTS_DATA_SOURCE_ID = '27b197ab-f07b-80cf-8d0e-000b8507cb8f'
export const PARTNERS_DATA_SOURCE_ID = '27b197ab-f07b-80a4-8a5d-000b57c0e149'
export const VOLUNTEERS_DATA_SOURCE_ID = '27b197ab-f07b-8071-9196-000babef012e'
export const TERMS_DATA_SOURCE_ID = '27c197ab-f07b-8077-8044-000b13443d6e'
