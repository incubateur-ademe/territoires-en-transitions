import { z } from 'zod';
import { ASSISTANT_QUESTION_MAX_LENGTH } from './ask-assistant.input';

/** Envoyé par l'intégration Crisp d'`apps/tools`, avec le jeton service. */
export const askAssistantFromCrispInputSchema = z.object({
  /** Opérateur Crisp qui a écrit `/tet` : son compte TeT doit être support. */
  operatorEmail: z.string().trim().email(),
  question: z.string().trim().min(1).max(ASSISTANT_QUESTION_MAX_LENGTH),
  visitorEmail: z.string().trim().email().optional(),
  visitorMessages: z.array(z.string().max(2_000)).max(10).default([]),
  /** Les `/tet` précédents de la conversation et leurs réponses. */
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().max(20_000),
      })
    )
    .max(20)
    .default([]),
});

export type AskAssistantFromCrispInput = z.input<
  typeof askAssistantFromCrispInputSchema
>;
