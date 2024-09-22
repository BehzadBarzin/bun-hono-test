import { z } from 'zod';

import { ProductCreateInputSchema } from '../../../../prisma/generated/zod';

// Validation schema
export const createBodySchema = ProductCreateInputSchema;

// Type of validated schema
export type TCreateBody = z.infer<typeof createBodySchema>;
