import { statutEnumValues } from '@tet/domain/plans';
import { z } from 'zod';

export const actionConfidenceSchema = z.object({
  score: z.number().min(0).max(100),
  explication: z.string(),
  amelioree: z.boolean(),
});

const extractedSousActionSchema = z.object({
  titre: z.string(),
  description: z.string().nullable(),
  personnePilote: z.string().nullable(),
  statut: z.enum(statutEnumValues).nullable(),
  dateDebut: z.string().date().nullable(),
  dateFin: z.string().date().nullable(),
});

export const extractedActionSchema = z.object({
  axe: z.string(),
  sousAxe: z.string(),
  titre: z.string(),
  description: z.string().nullable(),
  objectifs: z.string().nullable(),
  structurePilote: z.string().nullable(),
  directionServicePilote: z.string().nullable(),
  personnePilote: z.string().nullable(),
  budget: z.number().nullable(),
  statut: z.enum(statutEnumValues).nullable(),
  confidence: actionConfidenceSchema.nullable(),
  sousActions: z.array(extractedSousActionSchema),
});

export type ActionConfidence = z.output<typeof actionConfidenceSchema>;
export type ExtractedSousAction = z.output<typeof extractedSousActionSchema>;
export type ExtractedAction = z.output<typeof extractedActionSchema>;
