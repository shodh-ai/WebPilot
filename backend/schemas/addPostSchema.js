const { z } = require('zod');

const addPostSchema = z.object({
  user_id: z.string().uuid({ message: 'user_id must be a valid UUID' }),
  title: z.string().min(3, { message: 'Title must be at least 3 characters long' }),
  content: z.string().min(1, { message: 'Content cannot be empty' }),
});

module.exports = { addPostSchema };
