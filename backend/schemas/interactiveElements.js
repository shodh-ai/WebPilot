import { z } from 'zod';

export const InteractiveElement = z.object({
  elementName: z.string().min(1, { message: 'Element name cannot be empty' }),
  elementType: z.string().min(1, { message: 'Element type cannot be empty' }),
  eventType: z.string().min(1, { message: 'Event type cannot be empty' }),
  boundFunction: z.string().min(1, { message: 'Bound function cannot be empty' }),
  componentPath: z.string().min(1, { message: 'Component path cannot be empty' }),
  referencedFunctions: z.array(z.string()).optional(),
  functionDetails: z.object({
    complexity: z.number().min(0, { message: 'Complexity must be a non-negative number' }),
    dependencies: z.array(z.string()).optional()
  })
});

export const InteractiveElementsMap = z.record(z.string(), z.array(InteractiveElement));

export const InteractiveElementsResponse = z.object({
  route: z.string().min(1, { message: 'Route cannot be empty' }),
  elements: z.array(InteractiveElement).nullable()
});
