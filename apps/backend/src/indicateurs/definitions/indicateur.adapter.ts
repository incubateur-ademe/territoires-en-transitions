import {
  getIncoherentNatureError,
  type Indicateur,
  type IndicateurDefinition,
  type IndicateurNatureFields,
  type IndicateurPersoNatureFields,
  type IndicateurPredefini,
  type IndicateurPredefiniNatureFields,
  isIndicateurPerso,
  isIndicateurPredefini,
  toIndicateur,
} from '@tet/domain/indicateurs';

export const withNatureOrThrow = <
  T extends IndicateurNatureFields & { id: number }
>(
  row: T
):
  | (T & IndicateurPersoNatureFields)
  | (T & IndicateurPredefiniNatureFields) => {
  if (isIndicateurPerso(row) || isIndicateurPredefini(row)) {
    return row;
  }
  throw new Error(
    `Indicateur ${row.id} : nature incohérente (${getIncoherentNatureError(
      row
    )})`
  );
};

export const toIndicateurOrThrow = (
  definition: IndicateurDefinition
): Indicateur => {
  const result = toIndicateur(definition);
  if (!result.success) {
    throw new Error(
      `Indicateur ${definition.id} : nature incohérente (${result.error})`
    );
  }
  return result.data;
};

export const toIndicateursOrThrow = (
  definitions: readonly IndicateurDefinition[]
): Indicateur[] =>
  definitions.map((definition) => toIndicateurOrThrow(definition));

export const toIndicateurPredefiniOrThrow = (
  definition: IndicateurDefinition
): IndicateurPredefini => {
  const indicateur = toIndicateurOrThrow(definition);
  if (!isIndicateurPredefini(indicateur)) {
    throw new Error(
      `Indicateur ${definition.id} : un indicateur de la plateforme doit être prédéfini`
    );
  }
  return indicateur;
};

export const toIndicateursPredefiniOrThrow = (
  definitions: readonly IndicateurDefinition[]
): IndicateurPredefini[] =>
  definitions.map((definition) => toIndicateurPredefiniOrThrow(definition));
