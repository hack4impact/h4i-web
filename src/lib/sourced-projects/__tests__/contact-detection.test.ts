import { describe, expect, it } from "vitest";
import { findContactInfo } from "@/lib/sourced-projects/contact-detection";

describe("findContactInfo", () => {
  it.each([
    "Email jane.doe@foodbank.org for access",
    "reach out: J_Smith+h4i@mail.example.co.uk",
  ])("spots an email in %j", (text) => {
    expect(findContactInfo(text)).toEqual(["email"]);
  });

  it.each([
    "Call 555-123-4567",
    "(555) 123 4567",
    "+1 555.123.4567 after 5pm",
    "phone 5551234567",
  ])("spots a phone number in %j", (text) => {
    expect(findContactInfo(text)).toEqual(["phone"]);
  });

  it("reports both kinds", () => {
    expect(findContactInfo("ana@org.org or 555-123-4567")).toEqual([
      "email",
      "phone",
    ]);
  });

  it.each([
    "",
    null,
    "Built in 2023-2024 with Next.js 14 and Postgres 16",
    "Serves 12,000 families across 3 counties",
    "Use the @mention feature in Slack",
    "Ticket #1234567",
  ])("ignores ordinary text %j", (text) => {
    expect(findContactInfo(text)).toEqual([]);
  });
});
