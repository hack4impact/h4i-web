import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authorizeProject, ProjectApiError } from "./http";
import { canProjectAction, type ProjectViewer } from "./permissions";
import {
  createSchema,
  patchSchema,
  normalizeInput,
  missingPublishFields,
  type ProjectPatch,
} from "./validation";

const include = { teamMembers: true, resourceLinks: true } as const;
type StoredProject = Prisma.ProjectGetPayload<{ include: typeof include }>;
type Tx = Prisma.TransactionClient;

export async function parseProjectBody(
  request: Request,
  create = false
): Promise<ProjectPatch> {
  let raw: unknown;
  try {
    raw = normalizeInput(await request.json());
  } catch (error) {
    throw new ProjectApiError(
      400,
      error instanceof SyntaxError
        ? "Invalid JSON"
        : error instanceof Error
          ? error.message
          : "Invalid JSON"
    );
  }
  const parsed = (create ? createSchema : patchSchema).safeParse(raw);
  if (!parsed.success)
    throw new ProjectApiError(
      400,
      "Invalid project fields",
      parsed.error.flatten()
    );
  const patch = parsed.data;
  if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
    throw new ProjectApiError(400, "End date must not precede start date");
  return patch;
}

function pending(project: StoredProject): ProjectPatch {
  return project.pendingChanges
    ? patchSchema.parse(project.pendingChanges)
    : {};
}
function editable(project: StoredProject): ProjectPatch {
  return {
    name: project.name,
    chapterId: project.chapterId,
    stage: project.stage,
    tagline: project.tagline,
    techStack: project.techStack,
    causeAreas: project.causeAreas,
    nonprofitPartnerId: project.nonprofitPartnerId,
    nonprofitPartnerName: project.nonprofitPartnerName,
    nonprofitPartnerPhoto: project.nonprofitPartnerPhoto,
    startDate: project.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: project.endDate?.toISOString().slice(0, 10) ?? null,
    problemStatement: project.problemStatement,
    goalStatement: project.goalStatement,
    solutionDescription: project.solutionDescription,
    demoMedia: project.demoMedia,
    teamMembers: project.teamMembers.map(({ userId, role }) => ({
      userId,
      role,
    })),
    resourceLinks: project.resourceLinks.map(({ type, url }) => ({
      type,
      url,
    })),
  };
}
function response(project: StoredProject, draft = false) {
  const { pendingChanges, ...record } = project;
  return {
    ...record,
    ...(draft
      ? {
          ...editable(project),
          ...pending(project),
          hasUnpublishedChanges: Boolean(pendingChanges),
        }
      : {}),
  };
}

export function assertTargetChapter(
  viewer: ProjectViewer,
  chapterId: string | undefined
): string {
  if (viewer.role === "NATIONAL_ADMIN") {
    if (!chapterId)
      throw new ProjectApiError(
        400,
        "chapterId is required for National Admins"
      );
    return chapterId;
  }
  if (
    !viewer.chapterId ||
    (chapterId !== undefined && chapterId !== viewer.chapterId)
  )
    throw new ProjectApiError(403, "Cannot post to another chapter");
  authorizeProject(viewer, "create", viewer.chapterId);
  return viewer.chapterId;
}
async function checkReferences(tx: Tx, patch: ProjectPatch) {
  if (
    patch.chapterId &&
    !(await tx.chapter.findUnique({
      where: { id: patch.chapterId },
      select: { id: true },
    }))
  )
    throw new ProjectApiError(400, "Unknown chapterId");
  if (patch.teamMembers) {
    const ids = [...new Set(patch.teamMembers.map((member) => member.userId))];
    const count = await tx.user.count({ where: { id: { in: ids } } });
    if (count !== ids.length)
      throw new ProjectApiError(
        400,
        "Team members must reference existing users"
      );
  }
}
function checkTimeline(project: ProjectPatch) {
  if (
    project.startDate &&
    project.endDate &&
    project.endDate < project.startDate
  )
    throw new ProjectApiError(400, "End date must not precede start date");
}
async function save(tx: Tx, id: string, patch: ProjectPatch) {
  const { teamMembers, resourceLinks, startDate, endDate, ...scalars } = patch;
  return tx.project.update({
    where: { id },
    data: {
      ...scalars,
      ...(startDate !== undefined
        ? { startDate: startDate ? new Date(`${startDate}T00:00:00Z`) : null }
        : {}),
      ...(endDate !== undefined
        ? { endDate: endDate ? new Date(`${endDate}T00:00:00Z`) : null }
        : {}),
      ...(teamMembers !== undefined
        ? { teamMembers: { deleteMany: {}, create: teamMembers } }
        : {}),
      ...(resourceLinks !== undefined
        ? { resourceLinks: { deleteMany: {}, create: resourceLinks } }
        : {}),
    },
    include,
  });
}
async function lockedProject(tx: Tx, id: string) {
  // Serialize PATCH, publish and delete, preventing an autosave from being lost
  // or becoming visible halfway through a concurrent publish.
  await tx.$queryRaw`SELECT id FROM projects WHERE id = ${id} FOR UPDATE`;
  const project = await tx.project.findUnique({ where: { id }, include });
  if (!project) throw new ProjectApiError(404, "Project not found");
  return project;
}

export async function createProject(
  viewer: ProjectViewer,
  patch: ProjectPatch
) {
  const chapterId = assertTargetChapter(viewer, patch.chapterId);
  return db.$transaction(async (tx) => {
    await checkReferences(tx, { ...patch, chapterId });
    const project = await tx.project.create({
      data: { name: patch.name!, chapterId, createdBy: viewer.id },
    });
    return response(await save(tx, project.id, { ...patch, chapterId }), true);
  });
}
export async function patchProject(
  viewer: ProjectViewer,
  id: string,
  patch: ProjectPatch
) {
  return db.$transaction(async (tx) => {
    const project = await lockedProject(tx, id);
    authorizeProject(viewer, "edit", project.chapterId);
    const current = { ...editable(project), ...pending(project) };
    assertTargetChapter(viewer, current.chapterId);
    const next = { ...current, ...patch };
    assertTargetChapter(viewer, next.chapterId);
    checkTimeline(next);
    await checkReferences(tx, patch);
    if (project.isDraft) return response(await save(tx, id, patch), true);
    const changes = { ...pending(project), ...patch };
    const updated = await tx.project.update({
      where: { id },
      data: { pendingChanges: changes as Prisma.InputJsonValue },
      include,
    });
    return response(updated, true);
  });
}
export async function publishProject(viewer: ProjectViewer, id: string) {
  return db.$transaction(async (tx) => {
    const project = await lockedProject(tx, id);
    authorizeProject(viewer, "publish", project.chapterId);
    const next = { ...editable(project), ...pending(project) };
    assertTargetChapter(viewer, next.chapterId);
    const missingFields = missingPublishFields(next);
    if (missingFields.length)
      throw new ProjectApiError(422, "Project is incomplete for its stage", {
        missingFields,
      });
    checkTimeline(next);
    await checkReferences(tx, next);
    if (!project.isDraft && !project.pendingChanges) return response(project);
    if (project.pendingChanges) await save(tx, id, pending(project));
    return response(
      await tx.project.update({
        where: { id },
        data: {
          isDraft: false,
          lastUpdated: new Date(),
          pendingChanges: Prisma.DbNull,
        },
        include,
      })
    );
  });
}
export async function deleteProject(viewer: ProjectViewer, id: string) {
  authorizeProject(viewer, "delete");
  await db.$transaction(async (tx) => {
    await lockedProject(tx, id);
    await tx.project.delete({ where: { id } });
  });
}
export async function readProject(
  viewer: ProjectViewer,
  id: string,
  draft = false
) {
  const project = await db.project.findUnique({ where: { id }, include });
  if (
    !project ||
    ((project.isDraft || draft) &&
      !canProjectAction(viewer, "readDraft", project.chapterId))
  )
    throw new ProjectApiError(404, "Project not found");
  if (
    draft &&
    !canProjectAction(
      viewer,
      "readDraft",
      pending(project).chapterId ?? project.chapterId
    )
  )
    throw new ProjectApiError(404, "Project not found");
  return response(project, draft);
}
export async function listProjects(
  viewer: ProjectViewer,
  includeDrafts: boolean
) {
  const visibility: Prisma.ProjectWhereInput[] = [{ isDraft: false }];
  if (includeDrafts && viewer.role === "NATIONAL_ADMIN")
    visibility.push({ isDraft: true });
  else if (
    includeDrafts &&
    viewer.chapterId &&
    canProjectAction(viewer, "readDraft", viewer.chapterId)
  )
    visibility.push({ isDraft: true, chapterId: viewer.chapterId });
  const projects = await db.project.findMany({
    where: { OR: visibility },
    include,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 100,
  });
  return projects.map((project) => response(project));
}
