import * as z from 'zod/mini';

/**
 * Discriminant du type de démarche : toutes les démarches partagent la même
 * table (`demarche`) et le même socle (pilotes, history, workflow) — le type
 * détermine le workflow et les statuts applicables.
 */
export const DemarcheTypeEnum = {
  PCAET: 'pcaet',
} as const;

export const demarcheTypeValues = [DemarcheTypeEnum.PCAET] as const;

export const demarcheTypeSchema = z.enum(demarcheTypeValues);

export type DemarcheType = z.infer<typeof demarcheTypeSchema>;
