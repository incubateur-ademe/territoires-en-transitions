import { z } from 'zod';

export const ASSISTANT_QUESTION_MAX_LENGTH = 4_000;

export const askAssistantInputSchema = z.object({
  question: z.string().trim().min(1).max(ASSISTANT_QUESTION_MAX_LENGTH),
  /** Échanges précédents, tenus par l'appelant : rien n'est stocké. */
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().max(20_000),
      })
    )
    .max(20)
    .default([]),
  mode: z.enum(['analyse', 'esquisse']).default('analyse'),
  /** Arguments du prompt d'esquisse, en mode `esquisse`. */
  esquisse: z
    .object({
      sujet: z.string().min(1),
      appetit: z.string().optional(),
      contexte: z.string().optional(),
    })
    .optional(),
});

export type AskAssistantInput = z.input<typeof askAssistantInputSchema>;
export type AskAssistantParsedInput = z.output<typeof askAssistantInputSchema>;
