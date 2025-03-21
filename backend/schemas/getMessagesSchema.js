import { z } from 'zod';

export const getMessagesSchema = z.object({
  user_id: z.string().uuid({ message: 'user_id must be a valid UUID' }),
});
