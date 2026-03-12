/* eslint-disable @typescript-eslint/no-explicit-any */
import { unstable_cache } from "next/cache";
import { mapPartner, mapProgram, mapProject, mapVolunteer } from "./mappers";
import { stripOrgPrefix } from "./utils";
import type { Chapter } from "@/data/chapters";
import type { Partner } from "@/data/partners";
import type { Project } from "@/data/projects";
import type { Volunteer } from "@/data/volunteers";
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

async function fetchPrograms() {
  try {
    const results = await fetchAllPages(PROGRAMS_DATA_SOURCE_ID);
    return results.map((p: any) => mapProgram(p));
  } catch (error) {
    console.error("Failed to fetch programs from Notion:", error);
    return [];
  }
}

async function fetchProjects() {
  try {
    const results = await fetchAllPages(PROJECTS_DATA_SOURCE_ID);
    return results.map((p: any) => mapProject(p));
  } catch (error) {
    console.error("Failed to fetch projects from Notion:", error);
    return [];
  }
}

async function fetchPartners() {
  try {
    const results = await fetchAllPages(PARTNERS_DATA_SOURCE_ID);
    return results.map((p: any) => mapPartner(p));
  } catch (error) {
    console.error("Failed to fetch partners from Notion:", error);
    return [];
  }
}

async function fetchVolunteers() {
  try {
    const results = await fetchAllPages(VOLUNTEERS_DATA_SOURCE_ID);
    return results.map((v: any) => mapVolunteer(v));
  } catch (error) {
    console.error("Failed to fetch volunteers from Notion:", error);
    return [];
  }
}

const getCachedPrograms = unstable_cache(fetchPrograms, ["notion-programs"], {
  revalidate: 3600,
});
const getCachedProjects = unstable_cache(fetchProjects, ["notion-projects"], {
  revalidate: 3600,
});
const getCachedPartners = unstable_cache(fetchPartners, ["notion-partners"], {
  revalidate: 3600,
});
const getCachedVolunteers = unstable_cache(
  fetchVolunteers,
  ["notion-volunteers"],
  { revalidate: 3600 }
);

function mapProjectStatus(
  status: string | null
): "Active" | "Scoping" | "Complete" | "Inactive" {
  if (status === "Active") return "Active";
  if (status === "Done") return "Complete";
  if (status === "Inactive") return "Inactive";
  return "Scoping";
}

function mapVolunteerStatus(
  status: string | null
): "Active" | "Hiatus" | "Inactive" {
  if (status === "Active") return "Active";
  if (status === "Inactive") return "Inactive";
  return "Hiatus";
}

function mapChapterStatus(
  status: string | null
): "Active" | "Forming" | "Inactive" {
  if (status === "Active") return "Active";
  if (status === "Forming") return "Forming";
  return "Inactive";
}

export async function getChapters(): Promise<Chapter[]> {
  const [programs, notionProjects, volunteers] = await Promise.all([
    getCachedPrograms(),
    getCachedProjects(),
    getCachedVolunteers(),
  ]);

  return programs.map((program: any) => {
    const memberCount = volunteers.filter(
      (v: any) => v.chapterId === program.id
    ).length;

    const projectCount = notionProjects.filter((p: any) =>
      p.relatedIds.chapters.includes(program.id)
    ).length;

    return {
      id: program.id,
      name: stripOrgPrefix(program.name),
      university: stripOrgPrefix(program.name),
      volunteers: memberCount,
      projects: projectCount || null,
      coExecDirectors: null,
      status: mapChapterStatus(program.status),
    } satisfies Chapter;
  });
}

export async function getPartners(): Promise<Partner[]> {
  const [notionPartners, programs, notionProjects] = await Promise.all([
    getCachedPartners(),
    getCachedPrograms(),
    getCachedProjects(),
  ]);

  const programMap = new Map(
    programs.map((p: any) => [p.id, stripOrgPrefix(p.name)])
  );

  return notionPartners.map((partner: any) => {
    const projectCount =
      partner.relatedIds.projects.length ||
      notionProjects.filter((p: any) =>
        p.relatedIds.partners.includes(partner.id)
      ).length;

    const chapterName =
      partner.relatedIds.chapters
        .map((id: string) => programMap.get(id))
        .filter(Boolean)
        .join(", ") || "";

    return {
      id: partner.id,
      organization: partner.name,
      type: partner.organizationTypes[0] ?? "",
      projects: projectCount || null,
      chapter: chapterName,
      since: "",
    } satisfies Partner;
  });
}

export async function getProjects(): Promise<Project[]> {
  const [notionProjects, programs, notionPartners] = await Promise.all([
    getCachedProjects(),
    getCachedPrograms(),
    getCachedPartners(),
  ]);

  const programMap = new Map(
    programs.map((p: any) => [p.id, stripOrgPrefix(p.name)])
  );
  const partnerMap = new Map(notionPartners.map((p: any) => [p.id, p.name]));

  return notionProjects
    .filter((p: any) => p.type !== "Leadership")
    .map((project: any) => {
      const chapterName =
        project.relatedIds.chapters
          .map((id: string) => programMap.get(id))
          .filter(Boolean)
          .join(", ") || "";

      const partnerName =
        project.relatedIds.partners
          .map((id: string) => partnerMap.get(id))
          .filter(Boolean)
          .join(", ") || "";

      const volunteerCount =
        project.team.techLeads.length +
        project.team.productManagers.length +
        project.team.designLeads.length +
        project.team.designers.length +
        project.team.developers.length;

      return {
        id: project.id,
        name: project.name,
        chapter: chapterName,
        type: project.type ?? "",
        volunteers: volunteerCount,
        partner: partnerName,
        status: mapProjectStatus(project.status),
      } satisfies Project;
    });
}

export async function getVolunteers(): Promise<Volunteer[]> {
  const [volunteers, programs] = await Promise.all([
    getCachedVolunteers(),
    getCachedPrograms(),
  ]);

  const programMap = new Map(
    programs.map((p: any) => [p.id, stripOrgPrefix(p.name)])
  );

  return volunteers.map((volunteer: any) => {
    const chapterName = volunteer.chapterId
      ? (programMap.get(volunteer.chapterId) ?? "")
      : "";

    const projectCount =
      volunteer.projectAssignments.asPM.length +
      volunteer.projectAssignments.asDev.length +
      volunteer.projectAssignments.asDes.length +
      volunteer.projectAssignments.asTL.length +
      volunteer.projectAssignments.asDL.length;

    return {
      id: volunteer.id,
      name: volunteer.name,
      chapter: chapterName,
      role: volunteer.demographics.roles[0] ?? "",
      projects: projectCount,
      joined: "",
      status: mapVolunteerStatus(volunteer.status),
    } satisfies Volunteer;
  });
}
