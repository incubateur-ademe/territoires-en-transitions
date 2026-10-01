import * as z from 'zod/mini';
import { createEnumObject } from '../../utils/enum.utils';

export const secteurReglementaireEnumValues = [
  'residentiel',
  'tertiaire',
  'transport_routier',
  'autres_transports',
  'agriculture',
  'dechets',
  'industrie_hors_branche_energie',
  'branche_energie',
] as const;

export const SecteurReglementaireEnum = createEnumObject(
  secteurReglementaireEnumValues
);

export const secteurReglementaireEnumSchema = z.enum(
  secteurReglementaireEnumValues
);

export type SecteurReglementaire = z.infer<
  typeof secteurReglementaireEnumSchema
>;
