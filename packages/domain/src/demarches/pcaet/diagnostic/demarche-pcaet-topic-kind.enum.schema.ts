import * as z from 'zod/mini';

/**
 * Nature du contenu d'un topic du diagnostic PCAET : elle détermine ce que le
 * front affiche dans l'onglet, sans qu'il ait à connaître les topics un par un.
 * - `indicateurs` : grille de saisie (groupe × ligne × année) adossée au
 *   référentiel CAE.
 * - `vulnerabilite` : table de niveaux par thématique, hors référentiel indicateurs.
 */
export const DemarchePcaetTopicKindEnum = {
  INDICATEURS: 'indicateurs',
  VULNERABILITE: 'vulnerabilite',
} as const;

export const demarchePcaetTopicKindValues = [
  DemarchePcaetTopicKindEnum.INDICATEURS,
  DemarchePcaetTopicKindEnum.VULNERABILITE,
] as const;

export const demarchePcaetTopicKindSchema = z.enum(
  demarchePcaetTopicKindValues
);

export type DemarchePcaetTopicKind = z.infer<
  typeof demarchePcaetTopicKindSchema
>;
