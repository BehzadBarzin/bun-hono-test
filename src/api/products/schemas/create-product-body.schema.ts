import { z } from 'zod';

// Validation schema
export const createProductBodySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  name: z.string(),
  // -----------------------------------------------------------------------------------------------
  price: z.number().int(),
  // -----------------------------------------------------------------------------------------------
});

// Type of validated schema
export type TCreateProductBody = z.infer<typeof createProductBodySchema>;
