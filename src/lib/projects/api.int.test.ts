import { editorOptions } from "@/lib/projects/editor";
import { listDraftProjects } from "@/lib/projects/service";
import { GET as memberReferences } from "@/app/api/projects/references/members/route";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, stat } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { POST as uploadMedia } from "@/app/api/projects/[projectId]/media/route";
import { GET as readMedia } from "@/app/api/projects/[projectId]/media/[file]/route";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth/cookies";
import { GET as list, POST as create } from "@/app/api/projects/route";
import {
  GET as read,
  PATCH as patch,
  DELETE as remove,
} from "@/app/api/projects/[projectId]/route";
import { POST as publish } from "@/app/api/projects/[projectId]/publish/route";
import type { AppRole } from "@/types";

const prefix = `ticket4-${randomUUID()}`;
const own = `${prefix}-c1`,
  other = `${prefix}-c2`;
let fixtureSetupStarted = false;
let uploadDirectory: string | undefined;
const previousUploadDirectory = process.env.PROJECT_MEDIA_DIR;
let visibleMemberId: string;
let hiddenMemberId: string;
const actors: Record<string, { id: string; cookie: string }> = {};
const context = (id: string) => ({
  params: Promise.resolve({ projectId: id }),
});
function req(actor: string | null, method = "GET", body?: unknown, query = "") {
  return new Request(`http://localhost/api/projects${query}`, {
    method,
    headers: {
      ...(actor ? { cookie: `${SESSION_COOKIE}=${actors[actor].cookie}` } : {}),
      "content-type": "application/json",
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
async function newDraft(actor = "lead", chapterId?: string) {
  const response = await create(
    req(actor, "POST", {
      name: "A new project",
      ...(chapterId ? { chapterId } : {}),
    })
  );
  expect(response.status).toBe(201);
  return response.json();
}
function complete(stage = "design") {
  return {
    name: "Community Project",
    stage,
    tagline: "Help our community",
    nonprofitPartnerName: "Partner",
    startDate: "2026-01-15",
    problemStatement: "Manual administration",
    goalStatement: "Reduce paperwork",
    solutionDescription: "An accessible portal",
    teamMembers: [{ userId: actors.member.id, role: "Developer" }],
    resourceLinks: [{ type: "GitHub", url: "https://example.org/code" }],
  };
}

beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL!);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    !/(_test|ticket4)/.test(url.pathname)
  )
    throw new Error(
      "Use an isolated local DATABASE_URL whose database name contains _test or ticket4"
    );
  fixtureSetupStarted = true;
  uploadDirectory = await mkdtemp(path.join(tmpdir(), "project-form-media-"));
  process.env.PROJECT_MEDIA_DIR = uploadDirectory;
  await db.chapter.createMany({
    data: [
      { id: own, name: `${prefix} One` },
      { id: other, name: `${prefix} Two` },
    ],
  });
  const fixtures: [string, AppRole, string | null][] = [
    ["admin", "NATIONAL_ADMIN", null],
    ["lead", "PROJECT_LEAD", own],
    ["sameLead", "PROJECT_LEAD", own],
    ["chapterLead", "CHAPTER_LEAD", own],
    ["otherLead", "PROJECT_LEAD", other],
    ["unassigned", "PROJECT_LEAD", null],
    ["member", "MEMBER", own],
    ["revokedLead", "PROJECT_LEAD", own],
  ];
  for (const [name, role, chapterId] of fixtures) {
    const user = await db.user.create({
      data: { email: `${prefix}-${name}@example.org`, role, chapterId },
    });
    const cookie = randomUUID();
    await db.session.create({
      data: {
        id: cookie,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    actors[name] = { id: user.id, cookie };
  }
  const visible = await db.member.create({
    data: {
      userId: actors.member.id,
      chapterId: own,
      displayName: `${prefix} Shared Developer`,
      approvalStatus: "APPROVED",
    },
  });
  await db.member.update({
    where: { id: visible.id },
    data: { directoryOptIn: true },
  });
  visibleMemberId = visible.id;
  const hidden = await db.member.create({
    data: {
      userId: actors.sameLead.id,
      chapterId: own,
      displayName: `${prefix} Hidden Person`,
      adminHidden: true,
    },
  });
  hiddenMemberId = hidden.id;
});
afterAll(async () => {
  if (!fixtureSetupStarted) {
    await db.$disconnect();
    return;
  }
  await db.project.deleteMany({ where: { chapterId: { in: [own, other] } } });
  await db.member.deleteMany({
    where: { userId: { in: Object.values(actors).map((actor) => actor.id) } },
  });
  await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
  await db.chapter.deleteMany({ where: { id: { in: [own, other] } } });
  await db.$disconnect();
  if (uploadDirectory)
    await rm(uploadDirectory, { recursive: true, force: true });
  if (previousUploadDirectory === undefined)
    delete process.env.PROJECT_MEDIA_DIR;
  else process.env.PROJECT_MEDIA_DIR = previousUploadDirectory;
});

describe("project write APIs with real sessions and PostgreSQL", () => {
  it("returns 401 for every unauthenticated endpoint", async () => {
    const id = "missing";
    for (const response of await Promise.all([
      list(req(null)),
      create(req(null, "POST", { name: "No" })),
      read(req(null), context(id)),
      patch(req(null, "PATCH", {}), context(id)),
      publish(req(null, "POST"), context(id)),
      remove(req(null, "DELETE"), context(id)),
    ]))
      expect(response.status).toBe(401);
  });
  it("creates a minimal draft in the server-assigned chapter and prevents chapter spoofing", async () => {
    const project = await newDraft();
    expect(project).toMatchObject({
      isDraft: true,
      chapterId: own,
      createdBy: actors.lead.id,
      lastUpdated: null,
    });
    expect(
      (
        await create(
          req("lead", "POST", { name: "Wrong chapter", chapter_id: other })
        )
      ).status
    ).toBe(403);
    expect(
      (await create(req("unassigned", "POST", { name: "No chapter" }))).status
    ).toBe(403);
    expect(
      (await create(req("member", "POST", { name: "Not allowed" }))).status
    ).toBe(403);
    expect(
      (await create(req("admin", "POST", { name: "Needs a chapter" }))).status
    ).toBe(400);
    expect(
      (
        await create(
          req("admin", "POST", { name: "Unknown", chapterId: "not-real" })
        )
      ).status
    ).toBe(400);
    expect((await newDraft("admin", other)).chapterId).toBe(other);
  });
  it("enforces every Section 14 operation at the endpoint boundary", async () => {
    const project = await newDraft();
    for (const [actor, editable] of [
      ["lead", true],
      ["sameLead", true],
      ["chapterLead", true],
      ["admin", true],
      ["otherLead", false],
      ["member", false],
      ["unassigned", false],
    ] as const) {
      expect((await list(req(actor))).status).toBe(200);
      expect((await read(req(actor), context(project.id))).status).toBe(
        editable ? 200 : 404
      );
      expect(
        (
          await patch(
            req(actor, "PATCH", { tagline: actor }),
            context(project.id)
          )
        ).status
      ).toBe(editable ? 200 : 403);
      expect(
        (await publish(req(actor, "POST"), context(project.id))).status
      ).toBe(editable ? 422 : 403);
      if (actor !== "admin")
        expect(
          (await remove(req(actor, "DELETE"), context(project.id))).status
        ).toBe(403);
    }
    const drafts = await (
      await list(req("sameLead", "GET", undefined, "?include_drafts=true"))
    ).json();
    expect(drafts.some((p: { id: string }) => p.id === project.id)).toBe(true);
    for (const actor of ["otherLead", "member"]) {
      const visible = await (
        await list(req(actor, "GET", undefined, "?include_drafts=true"))
      ).json();
      expect(visible.some((p: { id: string }) => p.id === project.id)).toBe(
        false
      );
    }
    expect(
      (await remove(req("admin", "DELETE"), context(project.id))).status
    ).toBe(204);
  });
  it.each(["design", "development", "launched", "maintenance"])(
    "autosaves incomplete fields at %s and enforces required fields only on publish",
    async (stage) => {
      const project = await newDraft();
      expect(
        (
          await patch(
            req("lead", "PATCH", { stage, name: "", teamMembers: [] }),
            context(project.id)
          )
        ).status
      ).toBe(200);
      const invalid = await publish(req("lead", "POST"), context(project.id));
      expect(invalid.status).toBe(422);
      expect((await invalid.json()).details.missingFields).toEqual(
        expect.arrayContaining([
          "name",
          "tagline",
          "nonprofitPartner",
          "startDate",
          "problemStatement",
          "goalStatement",
          "teamMembers",
        ])
      );
      expect((await read(req("member"), context(project.id))).status).toBe(404);
      expect(
        (
          await patch(
            req("lead", "PATCH", complete(stage)),
            context(project.id)
          )
        ).status
      ).toBe(200);
      const published = await publish(req("lead", "POST"), context(project.id));
      expect(published.status).toBe(200);
      const live = await published.json();
      expect(live.isDraft).toBe(false);
      expect(live.lastUpdated).not.toBeNull();
      expect((await read(req("member"), context(project.id))).status).toBe(200);
      expect(
        (await (await list(req("member"))).json()).some(
          (p: { id: string }) => p.id === project.id
        )
      ).toBe(true);
      // An unchanged publish is idempotent, including its published timestamp.
      expect(
        (await (await publish(req("lead", "POST"), context(project.id))).json())
          .lastUpdated
      ).toBe(live.lastUpdated);
    }
  );
  it("rejects moves and writes into other chapters while allowing admin reassignment", async () => {
    const project = await newDraft();
    expect(
      (
        await patch(
          req("lead", "PATCH", { chapterId: other }),
          context(project.id)
        )
      ).status
    ).toBe(403);
    expect(
      (
        await patch(
          req("otherLead", "PATCH", { chapterId: other }),
          context(project.id)
        )
      ).status
    ).toBe(403);
    const reassigned = await patch(
      req("admin", "PATCH", { chapterId: other }),
      context(project.id)
    );
    expect(reassigned.status).toBe(200);
    expect((await reassigned.json()).chapterId).toBe(other);
    expect((await read(req("lead"), context(project.id))).status).toBe(404);
    expect((await read(req("otherLead"), context(project.id))).status).toBe(
      200
    );
  });
  it("reserves pending cross-chapter reassignment for National Admins", async () => {
    const project = await newDraft();
    await patch(req("lead", "PATCH", complete()), context(project.id));
    await publish(req("lead", "POST"), context(project.id));
    expect(
      (
        await patch(
          req("admin", "PATCH", { chapterId: other }),
          context(project.id)
        )
      ).status
    ).toBe(200);
    expect(
      (
        await patch(
          req("lead", "PATCH", { chapterId: own }),
          context(project.id)
        )
      ).status
    ).toBe(403);
    expect(
      (await publish(req("lead", "POST"), context(project.id))).status
    ).toBe(403);
    expect(
      (
        await read(
          req("lead", "GET", undefined, "?draft=true"),
          context(project.id)
        )
      ).status
    ).toBe(404);
    expect((await read(req("member"), context(project.id))).status).toBe(200);
    expect(
      (await publish(req("admin", "POST"), context(project.id))).status
    ).toBe(200);
    expect(
      (await patch(req("lead", "PATCH", {}), context(project.id))).status
    ).toBe(403);
    expect(
      (await patch(req("otherLead", "PATCH", {}), context(project.id))).status
    ).toBe(200);
  });
  it("validates formats, references and merged timelines; rejects server-field tampering", async () => {
    const project = await newDraft();
    for (const body of [
      { tagline: "x".repeat(181) },
      { is_draft: false },
      { createdBy: actors.admin.id },
      { lastUpdated: "2026-01-01" },
      { pendingChanges: {} },
      { teamMembers: [{ userId: "missing", role: "Dev" }] },
      { resourceLinks: [{ type: "GitHub", url: "javascript:alert(1)" }] },
      { startDate: "2026-02-30" },
      { chapterId: own, chapter_id: other },
    ]) {
      expect(
        (await patch(req("lead", "PATCH", body), context(project.id))).status
      ).toBe(400);
    }
    expect(
      (
        await patch(
          req("lead", "PATCH", { startDate: "2026-05-01" }),
          context(project.id)
        )
      ).status
    ).toBe(200);
    expect(
      (
        await patch(
          req("lead", "PATCH", { endDate: "2026-04-01" }),
          context(project.id)
        )
      ).status
    ).toBe(400);
    const badJson = new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { cookie: `${SESSION_COOKIE}=${actors.lead.cookie}` },
      body: "{",
    });
    expect((await create(badJson)).status).toBe(400);
    expect(
      (await patch(req("lead", "PATCH", {}), context("not-found"))).status
    ).toBe(404);
  });
  it("keeps published data live until pending edits pass a full publish", async () => {
    const project = await newDraft();
    await patch(req("lead", "PATCH", complete()), context(project.id));
    const original = await (
      await publish(req("lead", "POST"), context(project.id))
    ).json();
    const saved = await (
      await patch(
        req("lead", "PATCH", {
          stage: "development",
          solutionDescription: null,
          resourceLinks: [],
        }),
        context(project.id)
      )
    ).json();
    expect(saved.hasUnpublishedChanges).toBe(true);
    expect(saved.stage).toBe("development");
    const publicView = await (
      await read(req("member"), context(project.id))
    ).json();
    expect(publicView.stage).toBe("design");
    expect(publicView).not.toHaveProperty("pendingChanges");
    expect(publicView.lastUpdated).toBe(original.lastUpdated);
    expect(
      (
        await read(
          req("member", "GET", undefined, "?draft=true"),
          context(project.id)
        )
      ).status
    ).toBe(404);
    expect(
      (
        await (
          await read(
            req("sameLead", "GET", undefined, "?draft=true"),
            context(project.id)
          )
        ).json()
      ).stage
    ).toBe("development");
    expect(
      (await publish(req("lead", "POST"), context(project.id))).status
    ).toBe(422);
    await patch(
      req("lead", "PATCH", {
        solutionDescription: "Ready",
        resourceLinks: [{ type: "Other", url: "https://example.org" }],
      }),
      context(project.id)
    );
    expect(
      (await publish(req("lead", "POST"), context(project.id))).status
    ).toBe(200);
    expect(
      (await (await read(req("member"), context(project.id))).json()).stage
    ).toBe("development");
  });
  it("reads updated database roles and chapter assignments on existing sessions", async () => {
    const project = await newDraft();
    await db.user.update({
      where: { id: actors.sameLead.id },
      data: { role: "MEMBER" },
    });
    expect(
      (await patch(req("sameLead", "PATCH", {}), context(project.id))).status
    ).toBe(403);
    await db.user.update({
      where: { id: actors.sameLead.id },
      data: { role: "PROJECT_LEAD", chapterId: other },
    });
    expect(
      (await patch(req("sameLead", "PATCH", {}), context(project.id))).status
    ).toBe(403);
    await db.user.update({
      where: { id: actors.sameLead.id },
      data: { chapterId: own },
    });
  });
  it("does not lose separate concurrent autosaves", async () => {
    const project = await newDraft();
    const responses = await Promise.all([
      patch(
        req("lead", "PATCH", { tagline: "Saved tagline" }),
        context(project.id)
      ),
      patch(
        req("lead", "PATCH", { goalStatement: "Saved goal" }),
        context(project.id)
      ),
    ]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(
      await (await read(req("lead"), context(project.id))).json()
    ).toMatchObject({ tagline: "Saved tagline", goalStatement: "Saved goal" });
  });
  it("deletes relationships atomically for a National Admin", async () => {
    const project = await newDraft();
    await patch(req("lead", "PATCH", complete()), context(project.id));
    expect(
      (await remove(req("admin", "DELETE"), context(project.id))).status
    ).toBe(204);
    expect(
      await db.projectTeamMember.count({ where: { projectId: project.id } })
    ).toBe(0);
    expect(
      await db.projectResourceLink.count({ where: { projectId: project.id } })
    ).toBe(0);
  });
  it("uploads real media with scoped previews, private publication, range support and validation", async () => {
    const project = await newDraft();
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1cAAAAASUVORK5CYII=",
      "base64"
    );
    const uploadRequest = (
      actor: string | null,
      data: Uint8Array = png,
      type = "image/png"
    ) => {
      const body = new FormData();
      body.set("file", new File([data as BlobPart], "demo.png", { type }));
      return new Request("http://localhost/api/projects/media", {
        method: "POST",
        headers: actor
          ? { cookie: `${SESSION_COOKIE}=${actors[actor].cookie}` }
          : {},
        body,
      });
    };
    expect(
      (await uploadMedia(uploadRequest(null), context(project.id))).status
    ).toBe(401);
    expect(
      (await uploadMedia(uploadRequest("member"), context(project.id))).status
    ).toBe(403);
    expect(
      (await uploadMedia(uploadRequest("otherLead"), context(project.id)))
        .status
    ).toBe(403);
    expect(
      (
        await uploadMedia(
          uploadRequest("lead", Buffer.from("<html>fake</html>")),
          context(project.id)
        )
      ).status
    ).toBe(400);
    const oversized = uploadRequest("lead");
    oversized.headers.set("content-length", String(22 * 1024 * 1024));
    expect((await uploadMedia(oversized, context(project.id))).status).toBe(
      413
    );
    const uploaded = await uploadMedia(
      uploadRequest("lead"),
      context(project.id)
    );
    expect(uploaded.status).toBe(201);
    const { url } = await uploaded.json();
    const file = url.split("/").pop();
    const mediaContext = {
      params: Promise.resolve({ projectId: project.id, file }),
    };
    const preview = await readMedia(req("lead"), mediaContext);
    expect(preview.status).toBe(200);
    expect(preview.headers.get("content-type")).toBe("image/png");
    expect(preview.headers.get("cache-control")).toBe("private, no-store");
    expect(Buffer.from(await preview.arrayBuffer())).toEqual(png);
    expect((await readMedia(req("member"), mediaContext)).status).toBe(404);
    await patch(req("lead", "PATCH", complete()), context(project.id));
    await publish(req("lead", "POST"), context(project.id));
    // The upload is not published until its URL is explicitly saved and published.
    expect((await readMedia(req("member"), mediaContext)).status).toBe(404);
    await patch(
      req("lead", "PATCH", { demoMedia: [url] }),
      context(project.id)
    );
    expect((await readMedia(req("member"), mediaContext)).status).toBe(404);
    await publish(req("lead", "POST"), context(project.id));
    const publicMedia = await readMedia(req("member"), mediaContext);
    expect(publicMedia.status).toBe(200);
    await publicMedia.arrayBuffer();
    const ranged = req("member");
    ranged.headers.set("range", "bytes=0-7");
    const response = await readMedia(ranged, mediaContext);
    expect(response.status).toBe(206);
    expect((await response.arrayBuffer()).byteLength).toBe(8);
    const invalid = req("member");
    invalid.headers.set("range", "bytes=10000-");
    expect((await readMedia(invalid, mediaContext)).status).toBe(416);
  });
  it("uses canonical Member records while enforcing directory visibility for every role", async () => {
    expect((await memberReferences(req(null))).status).toBe(401);
    expect((await memberReferences(req("member"))).status).toBe(403);
    for (const actor of ["lead", "admin"]) {
      const result = await memberReferences(
        req(actor, "GET", undefined, `?q=${prefix}`)
      );
      expect(result.status).toBe(200);
      const json = await result.json();
      expect(json.members).toHaveLength(1);
      expect(json.members[0]).toMatchObject({
        id: actors.member.id,
        memberId: visibleMemberId,
        name: `${prefix} Shared Developer`,
      });
      expect(JSON.stringify(json)).not.toContain("Hidden Person");
      expect(JSON.stringify(json)).not.toContain("@example.org");
    }
    const project = await newDraft();
    const row = {
      userId: actors.member.id,
      memberId: visibleMemberId,
      role: "Developer",
    };
    expect(
      (
        await patch(
          req("lead", "PATCH", { teamMembers: [row] }),
          context(project.id)
        )
      ).status
    ).toBe(200);
    expect(
      await db.projectTeamMember.findFirst({ where: { projectId: project.id } })
    ).toMatchObject({ memberId: visibleMemberId });
    expect(
      (
        await patch(
          req("lead", "PATCH", {
            teamMembers: [{ ...row, userId: actors.lead.id }],
          }),
          context(project.id)
        )
      ).status
    ).toBe(400);
    const hidden = {
      userId: actors.sameLead.id,
      memberId: hiddenMemberId,
      role: "Designer",
    };
    expect(
      (
        await patch(
          req("lead", "PATCH", { teamMembers: [hidden] }),
          context(project.id)
        )
      ).status
    ).toBe(400);
    expect(
      (
        await patch(
          req("admin", "PATCH", { teamMembers: [hidden] }),
          context(project.id)
        )
      ).status
    ).toBe(200);
    // Existing hidden references can be retained, but their names stay private.
    expect(
      (
        await patch(
          req("lead", "PATCH", { teamMembers: [hidden] }),
          context(project.id)
        )
      ).status
    ).toBe(200);
    const options = await editorOptions(
      { id: actors.lead.id, role: "PROJECT_LEAD", chapterId: own },
      [actors.sameLead.id]
    );
    expect(
      options.members.find((member) => member.id === actors.sameLead.id)?.name
    ).toBe("Member record unavailable");
  });
  it("keeps drafts off the default list and provides chapter-scoped resume lists", async () => {
    const project = await newDraft();
    for (const actor of ["lead", "admin", "member"]) {
      const records = await (await list(req(actor))).json();
      expect(records.some((row: { id: string }) => row.id === project.id)).toBe(
        false
      );
    }
    expect(
      (
        await listDraftProjects({
          id: actors.lead.id,
          role: "PROJECT_LEAD",
          chapterId: own,
        })
      ).some((row) => row.id === project.id)
    ).toBe(true);
    expect(
      (
        await listDraftProjects({
          id: actors.otherLead.id,
          role: "PROJECT_LEAD",
          chapterId: other,
        })
      ).some((row) => row.id === project.id)
    ).toBe(false);
  });
  it("protects partner photos until their revision is published", async () => {
    const project = await newDraft();
    await patch(req("lead", "PATCH", complete()), context(project.id));
    await publish(req("lead", "POST"), context(project.id));
    const body = new FormData();
    body.set(
      "file",
      new File(
        [Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])],
        "logo.png",
        { type: "image/png" }
      )
    );
    const upload = new Request(
      "http://localhost/api/projects/media?purpose=partner-photo",
      {
        method: "POST",
        headers: { cookie: `${SESSION_COOKIE}=${actors.lead.cookie}` },
        body,
      }
    );
    const uploaded = await uploadMedia(upload, context(project.id));
    expect(uploaded.status).toBe(201);
    const { url } = await uploaded.json();
    const fileContext = {
      params: Promise.resolve({
        projectId: project.id,
        file: url.split("/").pop(),
      }),
    };
    await patch(
      req("lead", "PATCH", { nonprofitPartnerPhoto: url }),
      context(project.id)
    );
    expect((await readMedia(req("member"), fileContext)).status).toBe(404);
    await publish(req("lead", "POST"), context(project.id));
    const photo = await readMedia(req("member"), fileContext);
    expect(photo.status).toBe(200);
    await photo.arrayBuffer();
  });
});

describe("Ticket 7 security audit", () => {
  it.each(["lead", "chapterLead"])(
    "blocks every foreign-chapter write by %s",
    async (actor) => {
      for (const published of [false, true]) {
        const project = await newDraft("otherLead");
        if (published) {
          await patch(
            req("otherLead", "PATCH", complete()),
            context(project.id)
          );
          expect(
            (await publish(req("otherLead", "POST"), context(project.id)))
              .status
          ).toBe(200);
        }
        const before = await db.project.findUniqueOrThrow({
          where: { id: project.id },
        });
        const responses = [
          await create(req(actor, "POST", { name: "Spoof", chapterId: other })),
          await patch(
            req(actor, "PATCH", { name: "Stolen", chapterId: own }),
            context(project.id)
          ),
          await publish(req(actor, "POST"), context(project.id)),
          await remove(req(actor, "DELETE"), context(project.id)),
        ];
        for (const purpose of ["demo", "partner-photo"]) {
          const form = new FormData();
          form.set(
            "file",
            new File(["invalid"], "image.png", { type: "image/png" })
          );
          responses.push(
            await uploadMedia(
              new Request(
                `http://localhost/api/projects/media?purpose=${purpose}`,
                {
                  method: "POST",
                  headers: {
                    cookie: `${SESSION_COOKIE}=${actors[actor].cookie}`,
                  },
                  body: form,
                }
              ),
              context(project.id)
            )
          );
        }
        expect(responses.map((r) => r.status)).toEqual([
          403, 403, 403, 403, 403, 403,
        ]);
        expect(
          await db.project.findUniqueOrThrow({ where: { id: project.id } })
        ).toEqual(before);
        expect((await read(req(actor), context(project.id))).status).toBe(
          published ? 200 : 404
        );
        await expect(
          stat(path.join(uploadDirectory!, project.id))
        ).rejects.toMatchObject({ code: "ENOENT" });
      }
    }
  );
  it("revokes existing-session write access immediately without removing projects", async () => {
    const project = await newDraft("revokedLead");
    await db.user.update({
      where: { id: actors.revokedLead.id },
      data: { role: "MEMBER" },
    });
    const responses = await Promise.all([
      create(req("revokedLead", "POST", { name: "No" })),
      patch(req("revokedLead", "PATCH", { name: "No" }), context(project.id)),
      publish(req("revokedLead", "POST"), context(project.id)),
      remove(req("revokedLead", "DELETE"), context(project.id)),
    ]);
    expect(responses.map((r) => r.status)).toEqual([403, 403, 403, 403]);
    expect((await read(req("revokedLead"), context(project.id))).status).toBe(
      404
    );
    expect((await read(req("admin"), context(project.id))).status).toBe(200);
  });
  it("rejects cross-origin writes before any side effects", async () => {
    const project = await newDraft();
    const evil = (method: string, body?: unknown) => {
      const request = req("admin", method, body);
      request.headers.set("origin", "https://untrusted.example");
      return request;
    };
    expect(
      (await create(evil("POST", { name: "No", chapterId: own }))).status
    ).toBe(403);
    expect(
      (await patch(evil("PATCH", { name: "No" }), context(project.id))).status
    ).toBe(403);
    expect((await publish(evil("POST"), context(project.id))).status).toBe(403);
    expect((await remove(evil("DELETE"), context(project.id))).status).toBe(
      403
    );
    expect((await read(req("lead"), context(project.id))).status).toBe(200);
  });
  it("removes private files and handles repeated deletion without resurrection", async () => {
    const project = await newDraft();
    const { mkdir, writeFile } = await import("node:fs/promises");
    const directory = path.join(uploadDirectory!, project.id);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "private.png"), "private");
    expect(
      (await remove(req("admin", "DELETE"), context(project.id))).status
    ).toBe(204);
    await expect(stat(directory)).rejects.toMatchObject({ code: "ENOENT" });
    expect(
      (await remove(req("admin", "DELETE"), context(project.id))).status
    ).toBe(404);
    expect(
      (
        await patch(
          req("lead", "PATCH", { name: "Resurrect" }),
          context(project.id)
        )
      ).status
    ).toBe(404);
  });
  it("sorts public results before applying the limit and excludes drafts", async () => {
    const ids: string[] = [];
    for (const [name, startDate, lastUpdated] of [
      ["Zulu", null, "2026-03-01"],
      ["Alpha", "2026-01-01", "2026-02-01"],
      ["Beta", "2025-01-01", "2026-01-01"],
    ] as const) {
      const p = await db.project.create({
        data: {
          name,
          chapterId: other,
          createdBy: actors.admin.id,
          isDraft: false,
          startDate: startDate ? new Date(startDate) : null,
          lastUpdated: new Date(lastUpdated),
        },
      });
      ids.push(p.id);
    }
    for (const [sort, expected] of [
      ["name", [ids[1], ids[2], ids[0]]],
      ["year", [ids[1], ids[2], ids[0]]],
      ["last_updated", ids],
    ] as const) {
      const response = await list(
        req("member", "GET", undefined, `?chapter_id=${other}&sort=${sort}`)
      );
      expect(response.status).toBe(200);
      const items = await response.json();
      expect(
        items
          .filter((p: { id: string }) => ids.includes(p.id))
          .map((p: { id: string }) => p.id)
      ).toEqual(expected);
      expect(items.every((p: { isDraft: boolean }) => !p.isDraft)).toBe(true);
    }
    expect(
      (await list(req("member", "GET", undefined, "?sort=unsafe"))).status
    ).toBe(400);
  });
});

describe("upload authorization races", () => {
  it.each(["chapter", "role"])(
    "rechecks %s access after receiving a slow upload",
    async (change) => {
      await db.user.update({
        where: { id: actors.revokedLead.id },
        data: { role: "PROJECT_LEAD", chapterId: own },
      });
      const project = await newDraft("revokedLead");
      const form = new FormData();
      form.set(
        "file",
        new File(
          [
            Buffer.from(
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1cAAAAASUVORK5CYII=",
              "base64"
            ),
          ],
          "demo.png",
          { type: "image/png" }
        )
      );
      const encoded = new Request("http://localhost", {
        method: "POST",
        body: form,
      });
      const bytes = new Uint8Array(await encoded.arrayBuffer());
      let began!: () => void;
      let release!: () => void;
      const reading = new Promise<void>((resolve) => {
        began = resolve;
      });
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const body = new ReadableStream(
        {
          async pull(controller) {
            began();
            await gate;
            controller.enqueue(bytes);
            controller.close();
          },
        },
        { highWaterMark: 0 }
      );
      const request = new Request("http://localhost/api/projects/media", {
        method: "POST",
        headers: {
          cookie: `${SESSION_COOKIE}=${actors.revokedLead.cookie}`,
          "content-type": encoded.headers.get("content-type")!,
        },
        body,
        duplex: "half",
      } as RequestInit);
      const result = uploadMedia(request, context(project.id));
      await reading;
      try {
        if (change === "chapter")
          await db.project.update({
            where: { id: project.id },
            data: { chapterId: other },
          });
        else
          await db.user.update({
            where: { id: actors.revokedLead.id },
            data: { role: "MEMBER" },
          });
      } finally {
        release();
      }
      expect((await result).status).toBe(403);
      await expect(
        stat(path.join(uploadDirectory!, project.id))
      ).rejects.toMatchObject({ code: "ENOENT" });
    }
  );
});
