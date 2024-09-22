import { z } from 'zod';

export const createRoleBodySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  name: z.string().min(1, { message: 'Name is required' }),
  // -----------------------------------------------------------------------------------------------
  description: z.string().optional(),
  // -----------------------------------------------------------------------------------------------
  permissions: z.array(z.number()).optional(),
  // -----------------------------------------------------------------------------------------------
});

export type TCreateRoleBody = z.infer<typeof createRoleBodySchema>;
