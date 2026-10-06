/**
 * Types de tag connus.
 *
 * `Catalogue`, `EEA` et `Label` sont attribués par l'import du référentiel
 * lui-même (origine, labels, coremeasure) et lui sont réservés. Les autres
 * types sont ceux listés dans `REFERENTIEL_TAG_TYPES_FOR_IMPORT`.
 */
export const ReferentielTagTypeEnum = {
  CATALOGUE: 'Catalogue',
  EEA: 'EEA',
  LABEL: 'Label',
  THEMATIQUE: 'thematique',
} as const;

export type ReferentielTagType =
  (typeof ReferentielTagTypeEnum)[keyof typeof ReferentielTagTypeEnum];

/**
 * Seuls les tags de ces types peuvent être déclarés dans l'onglet `Tags` du
 * spreadsheet d'un référentiel.
 */
export const REFERENTIEL_TAG_TYPES_FOR_IMPORT: ReferentielTagType[] = [
  ReferentielTagTypeEnum.THEMATIQUE,
];

/**
 * Seuls les tags de ces types donnent lieu à un calcul de score par tag.
 * Tout autre type (existant ou futur) en est exclu par défaut.
 */
export const REFERENTIEL_TAG_TYPES_FOR_SCORING: ReferentielTagType[] = [
  ReferentielTagTypeEnum.CATALOGUE,
  ReferentielTagTypeEnum.EEA,
  ReferentielTagTypeEnum.LABEL,
];
