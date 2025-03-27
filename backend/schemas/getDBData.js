import { z } from 'zod';

export const getDBData = z.object({
  tables: z.array(z.string().min(1, { message: 'Tables cannot be empty' })),
  columns: z.array(z.array(z.string().min(1, { message: 'Columns cannot be empty' })).optional())
})