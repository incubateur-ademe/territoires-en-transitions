import * as z from 'zod/mini';

export const PcaetInstructionPartieEnum = {
  DOCUMENTS: 'documents',
  DIAGNOSTIC: 'diagnostic',
  PLAN: 'plan',
} as const;

export const pcaetInstructionPartieValues = [
  PcaetInstructionPartieEnum.DOCUMENTS,
  PcaetInstructionPartieEnum.DIAGNOSTIC,
  PcaetInstructionPartieEnum.PLAN,
] as const;

export const pcaetInstructionPartieSchema = z.enum(
  pcaetInstructionPartieValues
);

export type PcaetInstructionPartie = z.infer<
  typeof pcaetInstructionPartieSchema
>;
