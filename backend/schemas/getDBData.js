import { z } from 'zod';

export const getDBData = z.object({
  tables: z.string().min(1, { message: 'Tables cannot be empty' }),
})