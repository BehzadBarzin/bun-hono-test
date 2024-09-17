import { z } from "zod";

// Validation schema
export const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
});

// Type of validated schema
export type TUpdateBody = z.infer<typeof updateBodySchema>;
