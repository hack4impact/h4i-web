// JSON representation returned by the project API (dates serialize to strings).
import type {
  Project,
  ProjectTeamMember,
  ProjectResourceLink,
} from "@prisma/client";

export type ProjectResponse = Omit<
  Project,
  "startDate" | "endDate" | "lastUpdated" | "createdAt" | "updatedAt"
> & {
  startDate: string | null;
  endDate: string | null;
  lastUpdated: string | null;
  createdAt: string;
  updatedAt: string;
  teamMembers: (ProjectTeamMember & {
    user: { id: string; name: string | null };
  })[];
  resourceLinks: ProjectResourceLink[];
};
