/**
 * Types des tags attribués par l'import du référentiel lui-même (origine,
 * labels, coremeasure).
 *
 * La colonne `referentiel_tag.type` n'est pas limitée à ces valeurs : d'autres
 * types peuvent être ajoutés librement depuis l'onglet `Tags` du spreadsheet,
 * tant qu'ils ne reprennent pas l'un de ces types réservés.
 */
export const ReferentielTagTypeEnum = {
  CATALOGUE: 'Catalogue',
  EEA: 'EEA',
  LABEL: 'Label',
} as const;

export type ReferentielTagType =
  (typeof ReferentielTagTypeEnum)[keyof typeof ReferentielTagTypeEnum];

/**
 * Seuls les tags de ces types donnent lieu à un calcul de score par tag.
 * Tout autre type (existant ou futur) en est exclu par défaut.
 */
export const REFERENTIEL_TAG_TYPES_FOR_SCORING: ReferentielTagType[] = [
  ReferentielTagTypeEnum.CATALOGUE,
  ReferentielTagTypeEnum.EEA,
  ReferentielTagTypeEnum.LABEL,
];
