import { z } from "zod";

export const updateRoleBodySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  name: z.string().optional(),
  // -----------------------------------------------------------------------------------------------
  description: z.string().optional(),
  // -----------------------------------------------------------------------------------------------
  permissions: z.array(z.number()).optional(),
  // -----------------------------------------------------------------------------------------------
});

export type TUpdateRoleBody = z.infer<typeof updateRoleBodySchema>;
