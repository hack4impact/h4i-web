import assert from "node:assert/strict";
import { test } from "node:test";
import { loadEnvFile } from "node:process";
import { encode } from "next-auth/jwt";
try {
  loadEnvFile(".env.local");
} catch {
  /* CI can supply environment directly. */
}

const base = process.env.PROJECT_TEST_URL || "http://127.0.0.1:3000";
const cookies = new Map();
async function request(path, options = {}, signedIn = true) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    ...options,
    headers: {
      ...(signedIn
        ? {
            Cookie: [...cookies]
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
          }
        : {}),
      ...options.headers,
    },
  });
  if (signedIn)
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
  return response;
}
async function list(params = {}) {
  const response = await request(
    `/api/projects?${new URLSearchParams(params)}`
  );
  assert.equal(response.status, 200);
  return response.json();
}
function matchesLength(project, length) {
  if (length === "ongoing") return project.endDate === null;
  if (!project.startDate || !project.endDate) return false;
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const three = new Date(start);
  three.setUTCMonth(three.getUTCMonth() + 3);
  const six = new Date(start);
  six.setUTCMonth(six.getUTCMonth() + 6);
  if (length === "short") return end >= start && end < three;
  if (length === "medium") return end >= three && end <= six;
  return end > six;
}

test("project dashboard API on standard seed data", async (t) => {
  await t.test("requires authentication", async () => {
    assert.equal((await request("/api/projects", {}, false)).status, 401);
  });
  const { csrfToken } = await (await request("/api/auth/csrf")).json();
  await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      email: "admin@hack4impact.org",
      password: "password",
      callbackUrl: `${base}/projects`,
    }),
  });
  assert.equal(
    (await (await request("/api/auth/session")).json()).user.role,
    "ADMIN"
  );
  const fixtures = [];
  for (let i = 1; i <= 15; i++) {
    const response = await request(`/api/projects/seed-project-${i}`);
    assert.equal(
      response.status,
      200,
      "Run db:seed before this integration suite"
    );
    fixtures.push(await response.json());
  }
  const published = fixtures.filter((project) => !project.isDraft);
  await t.test(
    "search matches names, chapter names, tags, and combines with filters",
    async () => {
      assert.equal((await list({ q: "sChEdUlEr" })).pagination.total, 1);
      assert.equal((await list({ q: "CHICAGO" })).pagination.total, 4);
      assert.equal((await list({ q: "React" })).pagination.total, 12);
      assert.equal(
        (
          await list({
            q: "Chicago",
            stage: "development",
            project_length: "ongoing",
            impact_area: "Volunteer Ops",
          })
        ).pagination.total,
        2
      );
      assert.equal(
        (await list({ q: "Chicago", chapter_id: "seed-chapter-boston" }))
          .pagination.total,
        0
      );
      for (const q of ["%", "_", "' OR 1=1 --", "not-a-real-project"])
        assert.equal((await list({ q })).pagination.total, 0);
      assert.equal((await list({ q: "  " })).pagination.total, 12);
      assert.equal(
        (await request(`/api/projects?q=${"x".repeat(201)}`)).status,
        400
      );
    }
  );
  await t.test(
    "draft detail uses the same owner/admin visibility as its page",
    async () => {
      assert.ok(
        process.env.AUTH_SECRET,
        "AUTH_SECRET required for local role-visibility tests"
      );
      const cookieName = base.startsWith("https:")
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";
      const draft = fixtures.find((p) => p.isDraft);
      const live = fixtures.find((p) => !p.isDraft);
      const cases = [
        {
          role: "ADMIN",
          sub: "test-admin",
          email: "admin@hack4impact.org",
          status: 200,
        },
        {
          role: "CHAPTER_LEADER",
          sub: draft.createdBy,
          email: "admin@hack4impact.org",
          status: 200,
        },
        {
          role: "CHAPTER_LEADER",
          sub: "seed-chapter-boston-member",
          email: "project-member-1@example.org",
          status: 404,
        },
        {
          role: "VOLUNTEER",
          sub: draft.createdBy,
          email: "admin@hack4impact.org",
          status: 404,
        },
        {
          role: "VOLUNTEER",
          sub: "test-member",
          email: "test-member@example.org",
          status: 404,
        },
      ];
      for (const viewer of cases) {
        const token = await encode({
          token: { sub: viewer.sub, email: viewer.email, role: viewer.role },
          secret: process.env.AUTH_SECRET,
          salt: cookieName,
        });
        const options = { headers: { Cookie: `${cookieName}=${token}` } };
        assert.equal(
          (await request(`/api/projects/${draft.id}`, options, false)).status,
          viewer.status,
          `${viewer.role} ${viewer.sub}`
        );
        assert.equal(
          (await request(`/api/projects/${live.id}`, options, false)).status,
          200
        );
        assert.equal(
          (await request("/api/projects/does-not-exist", options, false))
            .status,
          404
        );
        const page = await request(`/projects/${draft.id}`, options, false);
        const html = await page.text();
        assert.ok(
          html.includes(
            viewer.status === 404 ? "Project not found" : draft.name
          )
        );
        if (viewer.status === 404) assert.ok(!html.includes(draft.name));
        const listResponse = await request(
          `/api/projects?q=${encodeURIComponent(draft.name)}`,
          options,
          false
        );
        assert.equal((await listResponse.json()).pagination.total, 0);
      }
      assert.equal(
        (await request(`/api/projects/${draft.id}`, {}, false)).status,
        401
      );
    }
  );
  await t.test(
    "pagination covers every published fixture once and excludes drafts",
    async () => {
      const ids = [];
      const first = await list({ page_size: 3 });
      assert.equal(first.pagination.total, 12);
      assert.equal(first.pagination.totalPages, 4);
      assert.equal(first.filters.chapters.length, 3);
      for (let page = 1; page <= 4; page++) {
        const data = await list({ page_size: 3, page });
        assert.equal(data.projects.length, 3);
        assert.ok(data.projects.every((project) => !project.isDraft));
        ids.push(...data.projects.map((project) => project.id));
      }
      assert.equal(new Set(ids).size, 12);
      assert.deepEqual(ids.toSorted(), published.map((p) => p.id).toSorted());
      assert.equal(
        (await list({ page: 999, page_size: 3 })).pagination.page,
        4
      );
    }
  );
  await t.test(
    "all four filters combine with AND and return correct counts",
    async () => {
      for (const chapter of [
        undefined,
        "seed-chapter-boston",
        "seed-chapter-chicago",
        "seed-chapter-atlanta",
      ]) {
        for (const stage of [
          undefined,
          "design",
          "development",
          "launched",
          "maintenance",
        ]) {
          for (const length of [
            undefined,
            "short",
            "medium",
            "long",
            "ongoing",
          ]) {
            // Impact choice exercises both matches and contradictory combinations.
            const impact = "Volunteer Ops";
            const params = { impact_area: impact, page_size: 100 };
            if (chapter) params.chapter_id = chapter;
            if (stage) params.stage = stage;
            if (length) params.project_length = length;
            const expected = published.filter(
              (p) =>
                (!chapter || p.chapterId === chapter) &&
                (!stage || p.stage === stage) &&
                (!length || matchesLength(p, length)) &&
                p.causeAreas.includes(impact)
            );
            const data = await list(params);
            assert.equal(
              data.pagination.total,
              expected.length,
              JSON.stringify(params)
            );
            assert.deepEqual(
              data.projects.map((p) => p.id).toSorted(),
              expected.map((p) => p.id).toSorted()
            );
          }
        }
      }
    }
  );
  await t.test(
    "empty results retain filter choices and bounded pagination",
    async () => {
      const data = await list({ chapter_id: "missing", page: 100 });
      assert.deepEqual(data.projects, []);
      assert.equal(data.pagination.total, 0);
      assert.equal(data.pagination.page, 1);
      assert.equal(data.pagination.totalPages, 0);
      assert.equal(data.filters.chapters.length, 3);
    }
  );
  await t.test("invalid pagination and filters return 400", async () => {
    for (const query of [
      "page=0",
      "page=abc",
      "page_size=101",
      "page_size=1.5",
      "stage=draft",
      "project_length=invalid",
      "chapter_id=",
    ]) {
      assert.equal(
        (await request(`/api/projects?${query}`)).status,
        400,
        query
      );
    }
  });
});
