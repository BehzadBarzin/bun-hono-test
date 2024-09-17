import { z } from "zod";

// Validation schema
export const idParamSchema = z.object({
  id: z.number(),
});

// Type of validated schema
export type TIdParam = z.infer<typeof idParamSchema>;
