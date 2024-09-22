import { z } from "zod";

export const registerBodySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  email: z.string().min(1, { message: "Email is required" }).email(),
  // -----------------------------------------------------------------------------------------------
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  // -----------------------------------------------------------------------------------------------
});

export type TRegisterBody = z.infer<typeof registerBodySchema>;
