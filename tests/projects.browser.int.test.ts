import { chromium, type Browser, type Page } from "playwright";
import { PrismaClient, type Prisma, type Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { it } from "vitest";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
it("covers project browsing, mobile keyboard use and Lead/Admin publishing", async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl)
    throw new Error(
      "DATABASE_URL is required for the isolated browser fixtures"
    );
  const database = new URL(databaseUrl);
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) ||
    !/(_test|ticket4)/.test(database.pathname)
  )
    throw new Error("Browser tests require an isolated local _test database");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  const origin = process.env.PROJECT_E2E_URL || "http://localhost:3108";
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname))
    throw new Error(
      "Browser checks require a local app using the isolated test database"
    );
  const prefix = `T8-${Date.now()}`,
    own = prefix + "-one",
    other = prefix + "-two";
  let browser!: Browser;
  const users: string[] = [],
    errors: string[] = [];
  async function actor(role: Role, chapterId: string | null) {
    const u = await db.user.create({
      data: { email: `${prefix}-${role}@example.org`, role, chapterId },
    });
    users.push(u.id);
    const id = randomUUID();
    await db.session.create({
      data: { id, userId: u.id, expiresAt: new Date(Date.now() + 3600000) },
    });
    const c = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: "light",
    });
    await c.addCookies([{ name: "sessionToken", value: id, url: origin }]);
    return c;
  }
  async function settle(page: Page, params: Record<string, string>) {
    await page.waitForFunction((expected) => {
      const p = new URLSearchParams(location.search);
      return Object.entries(expected).every(([k, v]) => p.get(k) === v);
    }, params);
    await page
      .getByText("Updating projects…", { exact: true })
      .waitFor({ state: "hidden" });
  }
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
        : {}),
    });
    await db.chapter.createMany({
      data: [
        { id: own, name: prefix + " Chapter" },
        { id: other, name: prefix + " Other" },
      ],
    });
    const member = await actor("MEMBER", own);
    const admin = await actor("NATIONAL_ADMIN", null);
    assert.equal(
      (await member.request.get(origin + "/api/projects")).status(),
      200,
      "App must use the same isolated database as these fixture sessions"
    );
    const base = {
      chapterId: own,
      createdBy: users[1],
      stage: "development" as const,
      isDraft: false,
      causeAreas: ["Education"],
      techStack: ["React"],
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-03-01"),
      lastUpdated: new Date("2026-10-01"),
    };
    const ids = [];
    for (const [name, data] of [
      ["Alpha", {}],
      ["Beta", { stage: "design" }],
      ["Gamma", { endDate: new Date("2027-04-01") }],
      ["Delta", { causeAreas: ["Health"] }],
      ["Epsilon", { chapterId: other }],
      ["Hidden", { isDraft: true, causeAreas: ["Private draft tag"] }],
    ] as [string, Partial<Prisma.ProjectUncheckedCreateInput>][])
      ids.push(
        (
          await db.project.create({
            data: { ...base, name: prefix + " " + name, ...data },
          })
        ).id
      );
    const p = await member.newPage();
    p.setDefaultTimeout(15000);
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(origin + `/projects?q=${prefix}&page_size=2&sort=name`);
    assert.equal(
      await p.getByText("Notion project directory", { exact: true }).count(),
      0
    );
    const region = p.getByRole("region", { name: "Project records" });
    await region
      .getByRole("status")
      .filter({ hasText: "Results: 5" })
      .waitFor();
    assert.equal(await region.locator("li").count(), 2);
    assert.ok(!(await region.innerText()).includes("Hidden"));
    assert.ok(
      !(
        await p
          .getByRole("combobox", { name: "Impact area", exact: true })
          .innerText()
      ).includes("Private draft tag")
    );
    await p.getByRole("link", { name: "Next page", exact: true }).click();
    await settle(p, { page: "2", q: prefix, sort: "name", page_size: "2" });
    assert.equal(await region.locator("li").count(), 2);
    await p
      .getByRole("combobox", { name: "Chapter", exact: true })
      .selectOption(own);
    await settle(p, { chapter_id: own });
    assert.equal(new URL(p.url()).searchParams.has("page"), false);
    await p
      .getByRole("combobox", { name: "Stage", exact: true })
      .selectOption("development");
    await settle(p, { stage: "development" });
    await p
      .getByRole("combobox", { name: "Project length", exact: true })
      .selectOption("short");
    await settle(p, { project_length: "short" });
    await p
      .getByRole("combobox", { name: "Impact area", exact: true })
      .selectOption("Education");
    await settle(p, { impact_area: "Education" });
    await region
      .getByRole("status")
      .filter({ hasText: "Results: 1" })
      .waitFor();
    assert.ok((await region.innerText()).includes(prefix + " Alpha"));
    const chip = p.getByRole("link", {
      name: "Remove Stage: development",
      exact: true,
    });
    await chip.focus();
    await p.keyboard.press("Enter");
    await p
      .getByRole("link", { name: "Remove Stage: development", exact: true })
      .waitFor({ state: "hidden" });
    await region
      .getByRole("status")
      .filter({ hasText: "Results: 2" })
      .waitFor();
    assert.equal(new URL(p.url()).searchParams.get("chapter_id"), own);
    await p.getByRole("link", { name: "Clear filters", exact: true }).click();
    await p
      .getByRole("combobox", {
        name: "Search projects or chapters",
        exact: true,
      })
      .fill(prefix + " Alpha");
    await settle(p, { q: prefix + " Alpha" });
    await region
      .getByRole("status")
      .filter({ hasText: "Results: 1" })
      .waitFor();
    const search = p.getByRole("combobox", {
      name: "Search projects or chapters",
      exact: true,
    });
    await search.fill(prefix + " Chapter");
    await settle(p, { q: prefix + " Chapter" });
    await region
      .getByRole("status")
      .filter({ hasText: "Results: 4" })
      .waitFor();
    assert.ok(
      await p
        .locator("#project-chapter-suggestions option")
        .evaluateAll(
          (nodes, text) =>
            nodes.some((n) => (n as HTMLOptionElement).value === text),
          prefix + " Chapter"
        )
    );
    await search.fill(prefix + " Missing");
    await settle(p, { q: prefix + " Missing" });
    await p
      .getByRole("heading", {
        name: "No projects match these filters",
        exact: true,
      })
      .waitFor();
    await region
      .getByRole("status")
      .filter({ hasText: "Results: 0" })
      .waitFor();
    console.log(
      "PASS: all combined filters, search, chapter suggestions, removable chips via keyboard, exact counts, pagination, draft/tag privacy, empty state"
    );
    for (const width of [320, 390, 768, 1280]) {
      await p.setViewportSize({ width, height: 900 });
      await p.goto(origin + `/projects?q=${prefix}`);
      await region
        .getByRole("status")
        .filter({ hasText: "Results: 5" })
        .waitFor();
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        true,
        `No horizontal page overflow at ${width}`
      );
      const controls = p.getByRole("form", {
        name: "Search and filter projects",
      });
      for (const select of await controls
        .locator("input[type=search],select,button")
        .all()) {
        const box = await select.boundingBox();
        assert.ok(box && box.width >= 44 && box.height >= 44);
      }
      await p.screenshot({
        path: `${process.env.TMPDIR || "/tmp"}/ticket8-${width}.png`,
      });
    }
    await p.setViewportSize({ width: 390, height: 900 });
    await p.goto(origin + "/projects");
    await search.focus();
    await p.keyboard.press("Tab");
    assert.equal(
      await p
        .getByRole("combobox", { name: "Chapter", exact: true })
        .evaluate((e) => e === document.activeElement),
      true
    );
    const ap = await admin.newPage();
    await ap.setViewportSize({ width: 320, height: 900 });
    await ap.goto(origin + `/projects?q=${prefix}`);
    assert.equal(
      await ap.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      true,
      "Admin header mobile overflow"
    );
    await ap.getByRole("link", { name: "+ Add Project", exact: true }).click();
    await ap.locator("#project-name").waitFor();
    assert.equal(
      await ap.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      true,
      "Editor mobile overflow"
    );
    await ap.screenshot({
      path: `${process.env.TMPDIR || "/tmp"}/ticket8-editor-320.png`,
    });
    console.log(
      "PASS: 320/390/768/1280 layouts, control sizes, keyboard tab order, mobile admin entry and editor"
    );
    const lead = await actor("PROJECT_LEAD", own);
    const memberRecord = await db.member.create({
      data: {
        userId: users[0],
        chapterId: own,
        displayName: prefix + " Developer",
        approvalStatus: "APPROVED",
      },
    });
    await db.member.update({
      where: { id: memberRecord.id },
      data: { directoryOptIn: true },
    });
    for (const [role, context] of [
      ["Lead", lead],
      ["Admin", admin],
    ] as const) {
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("dialog", (d) => d.accept());
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(origin + "/projects/new");
      if (role === "Admin")
        await page.locator("#project-chapterId").selectOption(own);
      const title = prefix + " " + role + " publication";
      await page.locator("#project-name").fill(title);
      const saved = page
        .locator("form")
        .getByRole("status")
        .filter({ hasText: "Draft saved · Just now" });
      await saved.waitFor();
      const id = page.url().split("/").at(-2);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        true,
        "Saved draft actions fit mobile"
      );
      assert.equal(
        (await member.request.get(origin + `/api/projects/${id}`)).status(),
        404
      );
      await page.goto(origin + "/projects/drafts");
      await page
        .getByRole("listitem")
        .filter({
          has: page.getByRole("heading", { name: title, exact: true }),
        })
        .getByRole("link", { name: "Resume draft", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Publish Changes", exact: true })
        .first()
        .click();
      await page.locator("#project-tagline-error").waitFor();
      await page.getByRole("button", { name: /Development/ }).click();
      await page.locator("#project-tagline").fill("Community tools");
      await page.locator("#project-startDate").fill("2026-01-01");
      await page.locator("#project-endDate").fill("2026-04-01");
      await page
        .locator("#project-problemStatement")
        .fill("Volunteer coordination is manual.");
      await page.locator("#project-goalStatement").fill("Help more families.");
      await page
        .locator("#project-solutionDescription")
        .fill("An accessible shared portal.");
      await page.route("**/api/projects/references/partners?*", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            role === "Lead"
              ? {
                  available: true,
                  partners: [
                    {
                      id: "fixture-partner",
                      name: prefix + " Partner",
                      photo: null,
                    },
                  ],
                }
              : { available: false, partners: [] }
          ),
        })
      );
      await page
        .locator("#project-nonprofitPartnerName")
        .fill(prefix + " Partner");
      if (role === "Lead")
        await page
          .getByRole("option", { name: prefix + " Partner", exact: true })
          .click();
      else
        await page
          .getByText(
            "Partner Directory unavailable. You can save this name as free text.",
            { exact: true }
          )
          .waitFor();
      await page
        .getByRole("button", { name: "+ Add Team Member", exact: true })
        .click();
      await page.locator("#project-teamMembers-0-userId").fill(prefix);
      await page
        .getByRole("option", { name: new RegExp(prefix + " Developer") })
        .click();
      await page.locator("#project-teamMembers-0-role").fill("Developer");
      await page
        .getByRole("button", { name: "+ Add Link", exact: true })
        .click();
      await page.locator("#project-resourceLinks-0-url").fill("not a url");
      await page
        .getByRole("button", { name: "Save Draft", exact: true })
        .first()
        .click();
      await page.locator("#project-resourceLinks-0-url-error").waitFor();
      await page
        .locator("#project-resourceLinks-0-url")
        .fill("https://example.org/code");
      await page
        .getByRole("button", { name: "Publish Changes", exact: true })
        .first()
        .click();
      await page.waitForURL(origin + `/projects/${id}`);
      await page.getByRole("heading", { name: title, exact: true }).waitFor();
      assert.equal(
        (
          await (
            await member.request.get(origin + `/api/projects/${id}`)
          ).json()
        ).isDraft,
        false
      );
      await page.getByRole("link", { name: "Edit", exact: true }).click();
      await page.locator("#project-tagline").fill("Private revision");
      await saved.waitFor();
      assert.equal(
        (
          await (
            await member.request.get(origin + `/api/projects/${id}`)
          ).json()
        ).tagline,
        "Community tools"
      );
      await page.reload();
      assert.equal(
        await page.locator("#project-tagline").inputValue(),
        "Private revision"
      );
      await page
        .getByRole("button", { name: "Publish Changes", exact: true })
        .first()
        .click();
      await page.waitForURL(origin + `/projects/${id}`);
      assert.equal(
        (
          await (
            await member.request.get(origin + `/api/projects/${id}`)
          ).json()
        ).tagline,
        "Private revision"
      );
      if (role === "Admin") {
        await page
          .getByRole("button", { name: "Delete Project", exact: true })
          .click();
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
        assert.ok(await db.project.findUnique({ where: { id } }));
        await page
          .getByRole("button", { name: "Delete Project", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Delete permanently", exact: true })
          .click();
        await page.waitForURL(origin + "/projects");
        assert.equal(await db.project.findUnique({ where: { id } }), null);
      } else
        assert.equal(
          await page
            .getByRole("button", { name: "Delete Project", exact: true })
            .count(),
          0
        );
      console.log(
        `PASS: ${role} mobile create → autosave → resume → validation → member/partner selectors → publish → private edit → republish`
      );
    }
    assert.deepEqual(errors, []);
  } catch (e) {
    console.log("BROWSER ERRORS", errors);
    for (const c of browser?.contexts() || [])
      for (const p of c.pages())
        console.log(
          p.url(),
          (await p.locator("body").innerText()).slice(-2200)
        );
    throw e;
  } finally {
    await browser?.close();
    await db.project.deleteMany({ where: { chapterId: { in: [own, other] } } });
    await db.member.deleteMany({ where: { userId: { in: users } } });
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.chapter.deleteMany({ where: { id: { in: [own, other] } } });
    await db.$disconnect();
  }
}, 180_000);
