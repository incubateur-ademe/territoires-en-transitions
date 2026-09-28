import { prioriteEnumValues, statutEnumValues } from '@tet/domain/plans';
import { z } from 'zod';

const extractionStatutValues = ['', ...statutEnumValues] as const;
const extractionPrioriteValues = ['', ...prioriteEnumValues] as const;

const extractionActionSchema = z.object({
  axe: z.string(),
  'sous-axe': z.string(),
  titre: z.string(),
  description: z.string(),
  'sous-actions': z.array(z.string()),
  objectifs: z.string(),
  'structure pilote': z.string(),
  'direction ou service pilote': z.string(),
  'personne pilote': z.string(),
  partenaires: z.string(),
  budget: z.string(),
  financements: z.string(),
  'moyens humains': z.string(),
  priorite: z.enum(extractionPrioriteValues),
  'date de debut': z.string(),
  'date de fin': z.string(),
  statut: z.enum(extractionStatutValues),
});

export const extractionResponseSchema = z.array(extractionActionSchema);

export type ExtractionAction = z.output<typeof extractionActionSchema>;
export type ExtractionResponse = z.output<typeof extractionResponseSchema>;
