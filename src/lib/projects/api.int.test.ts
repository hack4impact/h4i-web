import { randomUUID } from "node:crypto";
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
});
afterAll(async () => {
  if (!fixtureSetupStarted) {
    await db.$disconnect();
    return;
  }
  await db.project.deleteMany({ where: { chapterId: { in: [own, other] } } });
  await db.user.deleteMany({ where: { email: { startsWith: prefix } } });
  await db.chapter.deleteMany({ where: { id: { in: [own, other] } } });
  await db.$disconnect();
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
});
