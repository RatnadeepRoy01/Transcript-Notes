import { z } from 'zod';

const ActionItemSchema = z.object({
  task: z.string().min(1).max(400),
  owner: z.string().max(100).nullable(),
  dueDate: z.string().nullable(),
});

const ActionsArraySchema = z.array(ActionItemSchema);

export type ActionItem = z.infer<typeof ActionItemSchema>;
export type ActionItems = z.infer<typeof ActionsArraySchema>;

export function validateAIOutput(data: unknown): ActionItems {
  const result = ActionsArraySchema.safeParse(data);
  if (!result.success) {
    console.error('AI output validation errors:', result.error.flatten());
    throw new Error('Invalid AI output');
  }
  return result.data;
}
