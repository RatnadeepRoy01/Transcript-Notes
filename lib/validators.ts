import { z } from 'zod';
import { sanitizeText } from './sanitize';

export const TranscriptSchema = z.object({
  text: z
    .string()
    .min(1, 'Transcript text is required')
    .max(10000, 'Transcript text must be 10000 characters or less')
    .transform(sanitizeText),
});

export type TranscriptInput = z.infer<typeof TranscriptSchema>;
