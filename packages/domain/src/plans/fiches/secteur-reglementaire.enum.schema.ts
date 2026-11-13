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
  'amenagement',
  'biodiversite',
  'eau',
  'foret_et_sols',
  'economie',
  'sante',
  'risques_naturels',
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
