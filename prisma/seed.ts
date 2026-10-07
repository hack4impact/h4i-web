import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const admin = await db.user.upsert({
    where: { email: "admin@hack4impact.org" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@hack4impact.org",
      password: await bcrypt.hash("password", 10),
      role: "ADMIN",
    },
  });

  // Stable IDs make repeated development seeds safe. External chapter IDs are
  // fixtures; replace them with directory IDs when wiring chapter selectors.
  const chapters = [
    "seed-chapter-boston",
    "seed-chapter-chicago",
    "seed-chapter-atlanta",
  ];
  const names = [
    "Food Pantry Finder",
    "Volunteer Scheduler",
    "Housing Help",
    "Community Garden",
    "Youth Mentorship",
    "Donation Tracker",
    "Accessible Transit",
    "Animal Rescue",
    "School Supplies",
    "Clinic Intake",
    "Legal Aid",
    "Senior Support",
    "Disaster Relief",
    "Library Outreach",
    "Meal Delivery",
  ];
  const stages = ["design", "development", "launched", "maintenance"] as const;
  const members = await Promise.all(
    chapters.map((chapter, index) =>
      db.user.upsert({
        where: { email: `project-member-${index + 1}@example.org` },
        update: {},
        create: {
          id: `${chapter}-member`,
          name: ["Alex Rivera", "Sam Chen", "Jordan Taylor"][index],
          email: `project-member-${index + 1}@example.org`,
          role: "VOLUNTEER",
        },
      })
    )
  );
  await db.$transaction(async (tx) => {
    for (const [index, name] of names.entries()) {
      const id = `seed-project-${index + 1}`;
      const isDraft = index % 5 === 0;
      const data = {
        name,
        chapterId: chapters[index % 3],
        stage: stages[index % 4],
        tagline: `Helping communities through ${name.toLowerCase()}.`,
        techStack: ["React", "TypeScript", "PostgreSQL"],
        causeAreas: [
          ["Food Security"],
          ["Volunteer Ops"],
          ["Community Support"],
        ][index % 3],
        nonprofitPartnerName: `Example Community Partner ${(index % 3) + 1}`,
        startDate: new Date("2026-01-15T00:00:00Z"),
        endDate: index % 2 === 0 ? new Date("2026-05-15T00:00:00Z") : null,
        problemStatement:
          "Community organizations need accessible tools to coordinate their services.",
        goalStatement:
          "Reduce administrative work and connect people with support.",
        solutionDescription:
          index % 4 === 0
            ? null
            : "A web application that simplifies service coordination.",
        isDraft,
        lastUpdated: isDraft ? null : new Date("2026-06-01T00:00:00Z"),
        createdBy: admin.id,
      };
      await tx.project.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
      });
      await tx.projectTeamMember.upsert({
        where: { id: `${id}-member` },
        update: {},
        create: {
          id: `${id}-member`,
          projectId: id,
          userId: members[index % 3].id,
          role: "Developer",
        },
      });
      await tx.projectResourceLink.upsert({
        where: { id: `${id}-link` },
        update: {},
        create: {
          id: `${id}-link`,
          projectId: id,
          type: "Other",
          url: `https://example.org/projects/${index + 1}`,
        },
      });
    }
  });
  console.log(
    "Seed complete: 15 projects, 3 chapters, 4 stages, 3 drafts and 12 published."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
