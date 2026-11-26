import { describe, expect, it } from "vitest";
import {
  DIRECTORY_POSITIONS,
  PRD_POSITION_LABELS,
  mapInvolvementLabelToPosition,
} from "./role-mappings";

describe("directory role mappings", () => {
  it("exposes the five PRD directory positions in repo enum casing", () => {
    expect(DIRECTORY_POSITIONS).toEqual([
      "PM",
      "TL",
      "DEVELOPER",
      "DESIGNER",
      "BUSINESS",
    ]);
    expect(PRD_POSITION_LABELS.Business).toBe("BUSINESS");
  });

  it("maps unambiguous alumni involvement labels", () => {
    expect(mapInvolvementLabelToPosition("PM")).toBe("PM");
    expect(mapInvolvementLabelToPosition("Project Manager")).toBe("PM");
    expect(mapInvolvementLabelToPosition("tech lead")).toBe("TL");
    expect(mapInvolvementLabelToPosition("Developer")).toBe("DEVELOPER");
    expect(mapInvolvementLabelToPosition("Designer")).toBe("DESIGNER");
    expect(mapInvolvementLabelToPosition("Business")).toBe("BUSINESS");
  });

  it("does not guess admin types or ambiguous leadership labels", () => {
    expect(mapInvolvementLabelToPosition("COD")).toBeNull();
    expect(mapInvolvementLabelToPosition("NATIONALS")).toBeNull();
    expect(mapInvolvementLabelToPosition("ADMIN")).toBeNull();
    expect(mapInvolvementLabelToPosition("CHAPTER_LEAD")).toBeNull();
    expect(mapInvolvementLabelToPosition("Chapter Lead")).toBeNull();
    expect(mapInvolvementLabelToPosition("Officer")).toBeNull();
    expect(mapInvolvementLabelToPosition("Volunteer")).toBeNull();
    expect(mapInvolvementLabelToPosition(null)).toBeNull();
  });
});
