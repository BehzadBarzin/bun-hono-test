import { z } from "zod";

export const createUserBodySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  email: z.string().min(1, { message: "Email is required" }).email(),
  // -----------------------------------------------------------------------------------------------
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  // -----------------------------------------------------------------------------------------------
  confirmed: z.boolean().optional(),
  // -----------------------------------------------------------------------------------------------
  blocked: z.boolean().optional(),
  // -----------------------------------------------------------------------------------------------
  roles: z.array(z.number()).optional(),
  // -----------------------------------------------------------------------------------------------
});

export type TCreateUserBody = z.infer<typeof createUserBodySchema>;
