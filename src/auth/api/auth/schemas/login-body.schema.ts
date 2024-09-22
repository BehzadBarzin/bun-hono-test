import { z } from 'zod';

export const loginBodySchema = z.object({
  // -----------------------------------------------------------------------------------------------
  email: z.string().min(1, { message: 'Email is required' }).email(),
  // -----------------------------------------------------------------------------------------------
  password: z.string().min(1, { message: 'Password is required' }),
  // -----------------------------------------------------------------------------------------------
});

export type TLoginBody = z.infer<typeof loginBodySchema>;
