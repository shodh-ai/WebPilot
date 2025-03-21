import { z } from 'zod';

export const sendMessageSchema = z.object({
  receiver_id: z.string().uuid({ message: 'receiver_id must be a valid UUID' }),
  content: z.string().min(1, { message: 'Message content cannot be empty' }),
});
