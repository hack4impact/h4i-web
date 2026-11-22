import type { ProjectPatch } from "./validation";
import { patchSchema } from "./validation";

export type ProjectFormValue = Required<
  Omit<ProjectPatch, "teamMembers" | "resourceLinks">
> & {
  teamMembers: { userId: string; memberId?: string | null; role: string }[];
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

// Completely blank UI rows are placeholders, not meaningful draft data.
export function autosaveValue(value: ProjectFormValue): ProjectFormValue {
  return {
    ...value,
    teamMembers: value.teamMembers.filter(
      (row) => row.userId || row.role.trim()
    ),
    resourceLinks: value.resourceLinks.filter((row) => row.url.trim()),
  };
}
export function errorSection(field: string): number {
  const root = field.split(".")[0];
  if (
    [
      "nonprofitPartner",
      "nonprofitPartnerId",
      "nonprofitPartnerName",
      "nonprofitPartnerPhoto",
      "startDate",
      "endDate",
    ].includes(root)
  )
    return 1;
  if (["problemStatement", "goalStatement"].includes(root)) return 2;
  if (root === "teamMembers") return 3;
  if (["solutionDescription", "demoMedia"].includes(root)) return 4;
  if (root === "resourceLinks") return 5;
  return 0;
}

// Server indexes refer to persisted rows. Empty UI placeholders may precede
// those rows, so translate errors back to the row actually shown to the editor.
export function draftFieldPath(value: ProjectFormValue, path: string): string {
  const match = /^(teamMembers|resourceLinks)\.(\d+)(.*)$/.exec(path);
  if (!match) return path;
  const group = match[1] as "teamMembers" | "resourceLinks";
  const clean = autosaveValue(value);
  const row = clean[group][Number(match[2])];
  const index = (value[group] as unknown[]).indexOf(row);
  return index < 0 ? path : `${group}.${index}${match[3]}`;
}
export function draftErrors(value: ProjectFormValue): Record<string, string> {
  return Object.fromEntries(
    Object.entries(formErrors(autosaveValue(value))).map(([path, error]) => [
      draftFieldPath(value, path),
      error,
    ])
  );
}
