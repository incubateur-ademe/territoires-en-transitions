import { secteurReglementaireEnumValues } from '@tet/domain/plans';
import { z } from 'zod';

// Défaut vide : un modèle qui oublie le champ ne fait pas échouer le lot. Les
// identifiants hors de la liste fournie sont écartés par le code.
const effetsAttendusSchema = z.array(z.number().int()).default([]);

const secteursEntrySchema = z.object({
  index: z.number().int(),
  secteurs: z.array(z.enum(secteurReglementaireEnumValues)),
  effetsAttendus: effetsAttendusSchema,
  justification: z.string(),
});

const effetsAttendusEntrySchema = z.object({
  index: z.number().int(),
  effetsAttendus: effetsAttendusSchema,
});

export const secteursResponseSchema = z.array(secteursEntrySchema);

/** Hors PCAET : seuls les effets attendus sont demandés. */
export const effetsAttendusResponseSchema = z.array(effetsAttendusEntrySchema);

export type SecteursEntry = z.output<typeof secteursEntrySchema>;

export type EffetsAttendusEntry = z.output<typeof effetsAttendusEntrySchema>;
