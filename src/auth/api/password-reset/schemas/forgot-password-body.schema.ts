import { z } from 'zod';

export const forgotPasswordBodySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  email: z.string().min(1, { message: 'Email is required' }).email(),
  // -----------------------------------------------------------------------------------------------
});

export type TForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
