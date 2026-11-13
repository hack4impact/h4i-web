import { z } from "zod";

export const stages = [
  "design",
  "development",
  "launched",
  "maintenance",
] as const;
const text = z.string().trim().max(20000);
const optionalText = text.nullable().optional();
const httpUrl = z.url().refine((value) => {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, "Use an HTTP or HTTPS URL");
const mediaUrl = z
  .string()
  .max(2000)
  .refine((value) => {
    if (/^\/(?!\/)[^\\\s]*$/.test(value)) return true;
    return httpUrl.safeParse(value).success;
  }, "Use a local asset path or HTTP(S) URL");
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Invalid calendar date");
export const patchSchema = z
  .object({
    name: z.string().trim().max(200).optional(),
    chapterId: z.string().min(1).max(200).optional(),
    stage: z.enum(stages).optional(),
    tagline: z.string().trim().max(180).nullable().optional(),
    techStack: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
    causeAreas: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
    nonprofitPartnerId: z.string().trim().max(200).nullable().optional(),
    nonprofitPartnerName: z.string().trim().max(200).nullable().optional(),
    nonprofitPartnerPhoto: mediaUrl.nullable().optional(),
    startDate: date.nullable().optional(),
    endDate: date.nullable().optional(),
    problemStatement: optionalText,
    goalStatement: optionalText,
    solutionDescription: optionalText,
    demoMedia: z.array(mediaUrl).max(50).optional(),
    teamMembers: z
      .array(
        z
          .object({
            userId: z.string().min(1).max(200),
            role: z.string().trim().max(100),
          })
          .strict()
      )
      .max(100)
      .refine(
        (rows) =>
          new Set(rows.map((row) => `${row.userId}\0${row.role}`)).size ===
          rows.length,
        "Duplicate team member and role"
      )
      .optional(),
    resourceLinks: z
      .array(
        z
          .object({
            type: z.enum(["Slack", "GitHub", "GoogleDrive", "Other"]),
            url: httpUrl.max(2000),
          })
          .strict()
      )
      .max(100)
      .optional(),
  })
  .strict();
export const createSchema = patchSchema.extend({
  name: z.string().trim().min(1).max(200),
});
export type ProjectPatch = z.infer<typeof patchSchema>;

// The PRD names fields in snake_case; Prisma and the app use camelCase. Support
// both at the boundary, and reject ambiguous aliases instead of overriding them.
const aliases: Record<string, string> = {
  chapter_id: "chapterId",
  tech_stack: "techStack",
  cause_areas: "causeAreas",
  nonprofit_partner_id: "nonprofitPartnerId",
  nonprofit_partner_name: "nonprofitPartnerName",
  nonprofit_partner_photo: "nonprofitPartnerPhoto",
  start_date: "startDate",
  end_date: "endDate",
  problem_statement: "problemStatement",
  goal_statement: "goalStatement",
  solution_description: "solutionDescription",
  demo_media: "demoMedia",
  team_members: "teamMembers",
  resource_links: "resourceLinks",
  user_id: "userId",
};
export function normalizeInput(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(normalizeInput);
  if (!input || typeof input !== "object") return input;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const target = aliases[key] ?? key;
    if (Object.hasOwn(output, target))
      throw new Error(`Duplicate field: ${target}`);
    Object.defineProperty(output, target, {
      value: normalizeInput(value),
      enumerable: true,
      configurable: true,
    });
  }
  return output;
}

export const requiredByStage = {
  design: [
    "name",
    "tagline",
    "nonprofitPartner",
    "startDate",
    "problemStatement",
    "goalStatement",
    "teamMembers",
  ],
  development: [
    "name",
    "tagline",
    "nonprofitPartner",
    "startDate",
    "problemStatement",
    "goalStatement",
    "teamMembers",
    "solutionDescription",
    "resourceLinks",
  ],
  launched: [
    "name",
    "tagline",
    "nonprofitPartner",
    "startDate",
    "problemStatement",
    "goalStatement",
    "teamMembers",
    "solutionDescription",
    "resourceLinks",
  ],
  maintenance: [
    "name",
    "tagline",
    "nonprofitPartner",
    "startDate",
    "problemStatement",
    "goalStatement",
    "teamMembers",
    "solutionDescription",
    "resourceLinks",
  ],
} as const;

// PATCH checks formats only. These requirements are exclusively for publish.
export function missingPublishFields(project: ProjectPatch): string[] {
  const missing: string[] = [];
  for (const field of requiredByStage[project.stage ?? "design"]) {
    if (field === "nonprofitPartner") {
      if (
        !project.nonprofitPartnerId?.trim() &&
        !project.nonprofitPartnerName?.trim()
      )
        missing.push(field);
    } else if (field === "teamMembers") {
      if (!project.teamMembers?.length) missing.push(field);
      project.teamMembers?.forEach((member, index) => {
        if (!member.role.trim()) missing.push(`teamMembers.${index}.role`);
      });
    } else if (field === "resourceLinks") {
      if (!project.resourceLinks?.length) missing.push(field);
    } else if (!project[field]?.trim()) missing.push(field);
  }
  return missing;
}
