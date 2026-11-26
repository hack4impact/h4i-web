import type { ProjectStage } from "@prisma/client";
import type { SeedClient } from "./client";

// Fictional archive fixtures. Existing records are never overwritten on rerun,
// so edits made while demonstrating the editor remain intact.
const chapters = ["chapter-cornell", "chapter-uiuc", "chapter-berkeley"];
const stages: ProjectStage[] = [
  "design",
  "development",
  "launched",
  "maintenance",
];
const names = [
  "Community Food Pantry",
  "Volunteer Shift Planner",
  "Literacy Tutor Match",
  "Neighborhood Resource Map",
  "Animal Shelter Portal",
  "Community Garden Tracker",
  "Accessible Transit Guide",
  "Donation Inventory",
  "Youth Mentoring Hub",
  "Housing Support Portal",
  "Watershed Monitor",
  "Meal Delivery Planner",
  "Legal Aid Intake",
  "Arts Access Directory",
  "Community Health Outreach",
];

export async function seedProjects(db: SeedClient) {
  const creator = await db.user.findUniqueOrThrow({
    where: { email: "admin@hack4impact.org" },
    select: { id: true },
  });
  const teammate = await db.user.findUniqueOrThrow({
    where: { email: "member@hack4impact.org" },
    select: { id: true },
  });
  for (const [index, name] of names.entries()) {
    const isDraft = index >= 12;
    const id = `seed-archive-project-${String(index + 1).padStart(2, "0")}`;
    await db.project.upsert({
      where: { id },
      update: {},
      create: {
        id,
        name: `[Demo] ${name}`,
        chapterId: chapters[index % chapters.length],
        createdBy: creator.id,
        stage: stages[index % stages.length],
        isDraft,
        tagline:
          "A fictional community project for testing the project archive.",
        techStack:
          index % 2 ? ["React", "PostgreSQL"] : ["TypeScript", "Next.js"],
        causeAreas: [index % 2 ? "Education" : "Community Support"],
        nonprofitPartnerName: `Demo Community Partner ${index + 1}`,
        startDate: new Date(Date.UTC(2023 + (index % 4), index % 12, 1)),
        endDate:
          index % 2
            ? new Date(Date.UTC(2023 + (index % 4), (index % 12) + 4, 1))
            : null,
        lastUpdated: isDraft ? null : new Date(Date.UTC(2026, 9, index + 1)),
        problemStatement:
          "Community volunteers need a simpler way to coordinate their work.",
        goalStatement:
          "Reduce administrative work and help more community members.",
        solutionDescription:
          "An accessible web application for volunteers and nonprofit staff.",
        // No remote stock images: these fixtures also exercise thumbnail fallbacks.
        teamMembers: { create: [{ userId: teammate.id, role: "Developer" }] },
        resourceLinks: {
          create: [{ type: "Other", url: "https://example.org/" }],
        },
      },
    });
  }
  return names.length;
}
