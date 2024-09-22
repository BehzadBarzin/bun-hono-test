import { z } from 'zod';

// Validation schema
export const updateProductBodySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  name: z.string().optional(),
  // -----------------------------------------------------------------------------------------------
  price: z.number().int().optional(),
  // -----------------------------------------------------------------------------------------------
});

// Type of validated schema
export type TUpdateProductBody = z.infer<typeof updateProductBodySchema>;
