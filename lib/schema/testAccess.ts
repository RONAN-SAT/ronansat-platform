import { z } from "zod";

export const testAccessStatusSchema = z.object({
  testId: z.string().min(1, "Test id is required"),
});

export const testAccessTokenSchema = testAccessStatusSchema.extend({
  token: z.string().min(1, "Token is required"),
});

export const adminLockedTestSchema = testAccessStatusSchema.extend({
  token: z.string().trim().min(1, "Token is required"),
});

export type TestAccessTokenInput = z.infer<typeof testAccessTokenSchema>;
export type AdminLockedTestInput = z.infer<typeof adminLockedTestSchema>;
