import { z } from "zod";
import { APP_ROLES } from "@/lib/auth/roles";

export const userPatchSchema = z.object({
  role: z.enum(APP_ROLES).optional(),
  chapterId: z.string().cuid().nullable().optional(),
});

export type UserPatch = z.infer<typeof userPatchSchema>;
