/* eslint-disable @typescript-eslint/no-explicit-any */
import { unstable_cache } from 'next/cache'

import type { Chapter } from '@/lib/types/chapter'
import type { Partner } from '@/lib/types/partner'
import type { Project, TeamMember } from '@/lib/types/project'
import type { Volunteer } from '@/lib/types/volunteer'

import {
  notion,
  PARTNERS_DATA_SOURCE_ID,
  PROGRAMS_DATA_SOURCE_ID,
  PROJECTS_DATA_SOURCE_ID,
  TERMS_DATA_SOURCE_ID,
  VOLUNTEERS_DATA_SOURCE_ID,
} from './client'
import { mapPartner, mapProgram, mapProject, mapVolunteer } from './mappers'
import { normalizeLocation, stripOrgPrefix, toSlug } from './utils'

// Paginates through a Notion data source, collecting all results
async function fetchAllPages(dataSourceId: string): Promise<any[]> {
  const allResults: any[] = []
  let cursor: string | undefined

  do {
    const query: any = { data_source_id: dataSourceId }
    if (cursor) query.start_cursor = cursor

    const response: any = await (notion as any).dataSources.query(query)
    allResults.push(...response.results)
    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)

  return allResults
}

// Raw fetch functions — each maps Notion pages to domain objects
async function fetchPrograms() {
  try {
    const results = await fetchAllPages(PROGRAMS_DATA_SOURCE_ID)
    return results.map((p: any) => mapProgram(p))
  } catch (error) {
    console.error('Failed to fetch programs from Notion:', error)
    return []
  }
}

async function fetchProjects() {
  try {
    const results = await fetchAllPages(PROJECTS_DATA_SOURCE_ID)
    return results.map((p: any) => mapProject(p))
  } catch (error) {
    console.error('Failed to fetch projects from Notion:', error)
    return []
  }
}

async function fetchPartners() {
  try {
    const results = await fetchAllPages(PARTNERS_DATA_SOURCE_ID)
    return results.map((p: any) => mapPartner(p))
  } catch (error) {
    console.error('Failed to fetch partners from Notion:', error)
    return []
  }
}

async function fetchVolunteers() {
  try {
    const results = await fetchAllPages(VOLUNTEERS_DATA_SOURCE_ID)
    return results.map((v: any) => mapVolunteer(v))
  } catch (error) {
    console.error('Failed to fetch volunteers from Notion:', error)
    return []
  }
}

async function fetchTerms() {
  try {
    const results = await fetchAllPages(TERMS_DATA_SOURCE_ID)
    return results.map((page: any) => ({
      id: page.id,
      name:
        page.properties.Name?.title?.[0]?.plain_text ||
        page.properties.Name?.rich_text?.[0]?.plain_text ||
        '',
    }))
  } catch (error) {
    console.error('Failed to fetch terms from Notion:', error)
    return []
  }
}

// Cached fetchers — revalidate hourly (terms daily)
const getCachedPrograms = unstable_cache(fetchPrograms, ['notion-programs'], {
  revalidate: 3600,
})
const getCachedProjects = unstable_cache(fetchProjects, ['notion-projects'], {
  revalidate: 3600,
})
const getCachedPartners = unstable_cache(fetchPartners, ['notion-partners'], {
  revalidate: 3600,
})
const getCachedVolunteers = unstable_cache(
  fetchVolunteers,
  ['notion-volunteers'],
  { revalidate: 3600 },
)
const getCachedTerms = unstable_cache(fetchTerms, ['notion-terms'], {
  revalidate: 86400,
})

// Fetches all cached data and builds ID→name lookup maps for relations
async function getCommonData() {
  const [notionProjects, programs, notionPartners, volunteers, terms] =
    await Promise.all([
      getCachedProjects(),
      getCachedPrograms(),
      getCachedPartners(),
      getCachedVolunteers(),
      getCachedTerms(),
    ])

  const programMap = new Map(programs.map((p: any) => [p.id, p.name]))
  const partnerMap = new Map(notionPartners.map((p: any) => [p.id, p.name]))
  const volunteerMap = new Map(volunteers.map((v: any) => [v.id, v.name]))
  const termMap = new Map(terms.map((t: any) => [t.id, t.name]))

  return {
    notionProjects,
    programs,
    notionPartners,
    volunteers,
    terms,
    programMap,
    partnerMap,
    volunteerMap,
    termMap,
  }
}

// Resolves a raw Notion project into a typed Project with related names
function processProject(
  project: any,
  programMap: Map<string, string>,
  partnerMap: Map<string, string>,
  volunteerMap: Map<string, string>,
  termMap: Map<string, string>,
): Project {
  const slug = toSlug(project.name)

  const chapterName = project.relatedIds.chapters
    .map((id: string) => programMap.get(id))
    .filter(Boolean)
    .map((name: string) => stripOrgPrefix(name))
    .join(', ')

  const partnerName = project.relatedIds.partners
    .map((id: string) => partnerMap.get(id))
    .filter(Boolean)
    .join(', ')

  function resolveTeam(ids: string[], role: TeamMember['role']): TeamMember[] {
    return ids
      .map((id) => volunteerMap.get(id))
      .filter((name): name is string => !!name)
      .map((name) => ({ name, role }))
  }

  const team: TeamMember[] = [
    ...resolveTeam(project.team.techLeads, 'Tech Lead'),
    ...resolveTeam(project.team.productManagers, 'Project Manager'),
    ...resolveTeam(project.team.designLeads, 'Designer'),
    ...resolveTeam(project.team.designers, 'Designer'),
    ...resolveTeam(project.team.developers, 'Developer'),
  ]

  // Resolve activity relation IDs to term names
  const activityIds: string[] = project.activityIds ?? []
  const termNames = activityIds
    .map((id: string) => termMap.get(id))
    .filter((name): name is string => !!name)

  // Derive year from term names (e.g. ["Fall 2024", "Spring 2025"] → "2025")
  const years = termNames
    .map((t) => t.match(/\d{4}/)?.[0])
    .filter((y): y is string => !!y)
  const year = years.length > 0 ? years[years.length - 1] : ''

  // Duration is the resolved term names (e.g. "Fall 2024, Spring 2025")
  const duration = termNames.join(', ')

  return {
    id: project.id,
    slug,
    title: project.name,
    status: project.status ?? '',
    partner: partnerName,
    chapter: chapterName,
    year,
    tag: project.type ?? '',
    description: project.description,
    intro: '',
    sections: [],
    team,
    duration,
    technologies: undefined,
    website: undefined,
    github: project.links.github ?? undefined,
  } satisfies Project
}

// Public API: Chapters (active programs with member/project counts)
export async function getChapters(): Promise<Chapter[]> {
  const { programs, notionProjects, volunteers } = await getCommonData()

  const filteredPrograms = programs.filter(
    (program: any) => program.status !== 'Main',
  )

  return filteredPrograms.map((program: any) => {
    const slug = toSlug(program.name)

    const memberCount = volunteers.filter(
      (v: any) => v.chapterId === program.id && v.status === 'Active',
    ).length

    const projectCount = notionProjects.filter((p: any) =>
      p.relatedIds.chapters.includes(program.id),
    ).length

    const university = stripOrgPrefix(program.name)

    return {
      id: program.id,
      slug,
      name: program.name,
      university,
      location: normalizeLocation(program.place || ''),
      founded: program.foundedYear?.toString() ?? '',
      status: program.status ?? '',
      description: '',
      memberCount,
      projectCount,
      website: program.links.website ?? undefined,
      github: program.links.github ?? undefined,
      instagram: program.links.instagram ?? undefined,
    } satisfies Chapter
  })
}

export async function getChapterBySlug(
  slug: string,
): Promise<Chapter | undefined> {
  const programs = await getCachedPrograms()
  const program = programs.find((p: any) => toSlug(p.name) === slug)

  if (!program || program.status === 'Main') {
    return undefined
  }

  const [notionProjects, volunteers] = await Promise.all([
    getCachedProjects(),
    getCachedVolunteers(),
  ])

  const memberCount = volunteers.filter(
    (v: any) => v.chapterId === program.id && v.status === 'Active',
  ).length

  const projectCount = notionProjects.filter((p: any) =>
    p.relatedIds.chapters.includes(program.id),
  ).length

  const university = stripOrgPrefix(program.name)

  return {
    id: program.id,
    slug,
    name: program.name,
    university,
    location: normalizeLocation(program.place || ''),
    founded: program.foundedYear?.toString() ?? '',
    status: program.status ?? '',
    description: '',
    memberCount,
    projectCount,
    website: program.links.website ?? undefined,
    github: program.links.github ?? undefined,
    instagram: program.links.instagram ?? undefined,
  }
}

// Public API: Projects (excludes leadership-type projects)
export async function getProjects(): Promise<Project[]> {
  const { notionProjects, programMap, partnerMap, volunteerMap, termMap } =
    await getCommonData()

  return notionProjects
    .filter((p: any) => p.type !== 'Leadership')
    .map((project: any) =>
      processProject(project, programMap, partnerMap, volunteerMap, termMap),
    )
}

export async function getProjectBySlug(
  slug: string,
): Promise<Project | undefined> {
  const { notionProjects, programMap, partnerMap, volunteerMap, termMap } =
    await getCommonData()

  const project = notionProjects.find((p: any) => toSlug(p.name) === slug)

  if (!project || project.type === 'Leadership') {
    return undefined
  }

  return processProject(project, programMap, partnerMap, volunteerMap, termMap)
}

// Public API: Partners
export async function getPartners(): Promise<Partner[]> {
  const { notionPartners, notionProjects } = await getCommonData()

  return notionPartners.map((partner: any) => {
    const slug = toSlug(partner.name)

    const projectCount =
      partner.relatedIds.projects.length ||
      notionProjects.filter((p: any) =>
        p.relatedIds.partners.includes(partner.id),
      ).length

    return {
      id: partner.id,
      slug,
      name: partner.name,
      location: '',
      projectCount,
      description: partner.description,
      website: partner.links.website ?? undefined,
      organizationTypes: partner.organizationTypes ?? [],
      populations: partner.populations ?? [],
      subjects: partner.subjects ?? [],
    } satisfies Partner
  })
}

export async function getPartnerBySlug(
  slug: string,
): Promise<Partner | undefined> {
  const partners = await getCachedPartners()
  const partner = partners.find((p: any) => toSlug(p.name) === slug)

  if (!partner) {
    return undefined
  }

  const notionProjects = await getCachedProjects()
  const projectCount =
    partner.relatedIds.projects.length ||
    notionProjects.filter((p: any) =>
      p.relatedIds.partners.includes(partner.id),
    ).length

  return {
    id: partner.id,
    slug,
    name: partner.name,
    location: '',
    projectCount,
    description: partner.description,
    website: partner.links.website ?? undefined,
    organizationTypes: partner.organizationTypes ?? [],
    populations: partner.populations ?? [],
    subjects: partner.subjects ?? [],
  }
}

// Public API: Aggregate stats
export async function getVolunteerCounts(): Promise<{
  total: number
  active: number
}> {
  const { volunteers } = await getCommonData()
  const active = volunteers.filter((v: any) => v.status === 'Active').length
  return { total: volunteers.length, active }
}

export async function getDoneProjectCount(): Promise<number> {
  const { notionProjects } = await getCommonData()
  return notionProjects.filter((p: any) => p.status === 'Done').length
}

export async function getVolunteers(): Promise<Volunteer[]> {
  const [volunteers, programs] = await Promise.all([
    getCachedVolunteers(),
    getCachedPrograms(),
  ])

  const programMap = new Map(
    programs.map((p: any) => [p.id, stripOrgPrefix(p.name)]),
  )

  return volunteers.map((v: any) => ({
    id: v.id,
    name: v.name,
    status: v.status,
    chapter: v.chapterId ? (programMap.get(v.chapterId) ?? '') : '',
    roles: v.demographics.roles,
    major: v.demographics.major,
    gradYear: v.demographics.gradYear,
    links: v.links,
  }))
}
