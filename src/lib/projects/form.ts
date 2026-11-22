import type { ProjectPatch } from "./validation";
import { patchSchema } from "./validation";

export type ProjectFormValue = Required<
  Omit<ProjectPatch, "teamMembers" | "resourceLinks">
> & {
  teamMembers: { userId: string; role: string }[];
  resourceLinks: {
    type: "Slack" | "GitHub" | "GoogleDrive" | "Other";
    url: string;
  }[];
};
export function formValue(project: ProjectPatch = {}): ProjectFormValue {
  return {
    name: project.name ?? "",
    chapterId: project.chapterId ?? "",
    stage: project.stage ?? "design",
    tagline: project.tagline ?? "",
    techStack: project.techStack ?? [],
    causeAreas: project.causeAreas ?? [],
    nonprofitPartnerId: project.nonprofitPartnerId ?? null,
    nonprofitPartnerName: project.nonprofitPartnerName ?? "",
    nonprofitPartnerPhoto: project.nonprofitPartnerPhoto ?? null,
    startDate: project.startDate?.slice(0, 10) ?? "",
    endDate: project.endDate?.slice(0, 10) ?? "",
    problemStatement: project.problemStatement ?? "",
    goalStatement: project.goalStatement ?? "",
    solutionDescription: project.solutionDescription ?? "",
    demoMedia: project.demoMedia ?? [],
    teamMembers: project.teamMembers ?? [],
    resourceLinks: project.resourceLinks ?? [],
  };
}
export function formPayload(value: ProjectFormValue): ProjectPatch {
  return {
    ...value,
    startDate: value.startDate || null,
    endDate: value.endDate || null,
  };
}
export function formErrors(value: ProjectFormValue): Record<string, string> {
  const errors: Record<string, string> = {};
  const parsed = patchSchema.safeParse(formPayload(value));
  if (!parsed.success)
    for (const issue of parsed.error.issues)
      errors[issue.path.join(".")] ??= issue.message;
  if (!value.name.trim()) errors.name = "Enter a project name to save a draft.";
  if (!value.chapterId) errors.chapterId = "Select a permitted chapter.";
  if (value.startDate && value.endDate && value.endDate < value.startDate)
    errors.endDate = "End date must not precede start date.";
  return errors;
}
