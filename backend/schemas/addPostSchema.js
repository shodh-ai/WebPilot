import { z } from 'zod';

export const addPostSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long' }),
  content: z.string().min(1, { message: 'Content cannot be empty' }),
});
