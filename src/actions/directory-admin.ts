"use server";

import { db } from "@/lib/db";
import { assertRole, assertSession } from "@/lib/auth/guards";
import { DIRECTORY_ADMIN_ROLES } from "@/lib/auth/roles";
import type { AppRole } from "@/types";
import {
  approveProfile,
  assignUserRole,
  claimProfileWithToken,
  createClaimToken,
  createManualProfile,
  listRecentAdminAuditLogs,
  rejectProfile,
  setOwnDirectoryOptIn,
  transitionMemberToAlumni,
  type ProfileKind,
} from "@/lib/directory/workflows";
import type { DirectoryProfileFields } from "@/lib/validators/directory-profile";

function actorFromSession(session: { user: { id: string; role: string } }) {
  return {
    userId: session.user.id,
    role: session.user.role as AppRole,
  };
}

export async function adminApproveProfile(kind: ProfileKind, id: string) {
  const session = await assertRole(DIRECTORY_ADMIN_ROLES);
  return approveProfile(db, actorFromSession(session), kind, id);
}

export async function adminRejectProfile(kind: ProfileKind, id: string) {
  const session = await assertRole(DIRECTORY_ADMIN_ROLES);
  return rejectProfile(db, actorFromSession(session), kind, id);
}

export async function adminCreateManualProfile(
  kind: ProfileKind,
  fields: DirectoryProfileFields
) {
  const session = await assertRole(DIRECTORY_ADMIN_ROLES);
  return createManualProfile(db, actorFromSession(session), kind, fields);
}

export async function adminCreateClaimToken(
  kind: ProfileKind,
  profileId: string
) {
  const session = await assertRole(DIRECTORY_ADMIN_ROLES);
  return createClaimToken(db, actorFromSession(session), kind, profileId);
}

export async function claimDirectoryProfile(token: string) {
  const session = await assertSession();
  return claimProfileWithToken(db, actorFromSession(session), token);
}

export async function consentToDirectoryProfile(
  kind: ProfileKind,
  profileId: string,
  directoryOptIn = true
) {
  const session = await assertSession();
  return setOwnDirectoryOptIn(
    db,
    actorFromSession(session),
    kind,
    profileId,
    directoryOptIn
  );
}

export async function transitionMyOrAdminMemberToAlumni(memberId: string) {
  // Owner or directory admin — authorization checked inside the workflow.
  const session = await assertSession();
  return transitionMemberToAlumni(db, actorFromSession(session), memberId);
}

export async function adminAssignUserRole(
  targetUserId: string,
  nextRole: AppRole
) {
  // Self-changes and unknown roles are rejected in canAssignUserRole.
  const session = await assertRole(DIRECTORY_ADMIN_ROLES);
  return assignUserRole(db, actorFromSession(session), targetUserId, nextRole);
}

export async function adminListRecentAuditLogs(take = 50) {
  const session = await assertRole(DIRECTORY_ADMIN_ROLES);
  return listRecentAdminAuditLogs(db, actorFromSession(session), take);
}
