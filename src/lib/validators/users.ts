import { z } from "zod";

const roleEnum = z.enum(["ADMIN", "CHAPTER_LEAD", "PROJECT_LEAD", "VOLUNTEER"]);

export const userPatchSchema = z.object({
  role: roleEnum.optional(),
  operationsChapterId: z.string().optional(),
});

export type UserPatch = z.infer<typeof userPatchSchema>;
