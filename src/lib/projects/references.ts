import { db } from "@/lib/db";
import {
  directoryDetailWhere,
  directoryListWhere,
} from "@/lib/directory/visibility";
import type { ProjectViewer } from "./permissions";

export type MemberReference = {
  id: string;
  memberId: string | null;
  name: string;
  role: string;
};
export type PartnerReference = {
  id: string;
  name: string;
  photo: string | null;
};
const memberSelect = {
  id: true,
  userId: true,
  displayName: true,
  position: true,
} as const;
const roles = {
  PM: "Project Lead",
  TL: "Tech Lead",
  DEVELOPER: "Developer",
  DESIGNER: "Designer",
  BUSINESS: "Business",
};
function memberReference(member: {
  id: string;
  userId: string | null;
  displayName: string | null;
  position: keyof typeof roles | null;
}): MemberReference {
  return {
    id: member.userId!,
    memberId: member.id,
    name: member.displayName || "Unnamed member",
    role: member.position ? roles[member.position] : "Developer",
  };
}
export async function searchMemberReferences(q = "") {
  const members = await db.member.findMany({
    where: {
      ...directoryListWhere(),
      ...(q ? { displayName: { contains: q, mode: "insensitive" } } : {}),
    },
    select: memberSelect,
    orderBy: [{ displayName: "asc" }, { id: "asc" }],
    take: 50,
  });
  return members.map(memberReference);
}
export async function selectedMemberReferences(
  viewer: ProjectViewer,
  userIds: string[]
) {
  if (!userIds.length) return [];
  const members = await db.member.findMany({
    where: {
      AND: [
        { userId: { in: userIds } },
        directoryDetailWhere({ userId: viewer.id, role: viewer.role }),
      ],
    },
    select: memberSelect,
  });
  const visible = members.map(memberReference);
  return userIds.map(
    (id) =>
      visible.find((member) => member.id === id) ?? {
        id,
        memberId: null,
        name: "Member record unavailable",
        role: "Developer",
      }
  );
}
