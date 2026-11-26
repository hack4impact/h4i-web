import { z } from "zod";

export const magicLinkRequestSchema = z.object({
  email: z.email(),
});

export const loginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
