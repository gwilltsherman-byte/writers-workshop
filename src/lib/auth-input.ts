import { z } from "zod";
export const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
});
export const signupInput = credentials.extend({
  name: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[\p{L}\p{N} _.-]+$/u),
});
export const verifyInput = signupInput.extend({
  code: z.string().regex(/^\d{6}$/),
});
