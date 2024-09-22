import { z } from 'zod';

export const resetPasswordBodySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  token: z.string().min(1, { message: 'Token is required' }),
  // -----------------------------------------------------------------------------------------------
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  // -----------------------------------------------------------------------------------------------
});

export type TResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
