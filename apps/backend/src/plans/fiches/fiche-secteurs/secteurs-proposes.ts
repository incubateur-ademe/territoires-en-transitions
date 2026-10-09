import { secteurReglementaireEnumValues } from '@tet/domain/plans';
import { z } from 'zod';

/** Secteurs réglementaires proposés pour une action, et pourquoi. */
export const secteursProposesSchema = z.object({
  /** Vide : action transversale, sans secteur d'activité. */
  secteurs: z.array(z.enum(secteurReglementaireEnumValues)),
  justification: z.string(),
});

export type SecteursProposes = z.output<typeof secteursProposesSchema>;
