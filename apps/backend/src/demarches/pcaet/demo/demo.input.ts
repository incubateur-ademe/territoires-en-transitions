import { z } from 'zod';

const demarcheRefSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

/** Les sous-étapes du parcours d'élaboration et de finalisation, comme les badges du front. */
export const demoEtapeValues = [
  'documents',
  'diagnostic',
  'plan',
  'documentsAval',
] as const;

export const completerEtapeDemoInputSchema = demarcheRefSchema.extend({
  etape: z.enum(demoEtapeValues),
});

export type CompleterEtapeDemoInput = z.infer<
  typeof completerEtapeDemoInputSchema
>;

export const simulerInstructionDemoInputSchema = demarcheRefSchema;

export type SimulerInstructionDemoInput = z.infer<
  typeof simulerInstructionDemoInputSchema
>;
