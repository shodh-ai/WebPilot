const { z } = require('zod');

const addPostSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long' }),
  content: z.string().min(1, { message: 'Content cannot be empty' }),
});

module.exports = { addPostSchema };
