import { z } from "zod";

// Validation schema
export const createBodySchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
});

// Type of validated schema
export type TCreateBody = z.infer<typeof createBodySchema>;
