import { z } from "zod";
import { ProductUpdateInputSchema } from "../../../../prisma/generated/zod";

// Validation schema
export const updateBodySchema = ProductUpdateInputSchema;

// Type of validated schema
export type TUpdateBody = z.infer<typeof updateBodySchema>;
