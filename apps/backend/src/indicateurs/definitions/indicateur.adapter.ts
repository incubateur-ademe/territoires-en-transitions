import {
  getIncoherentNatureError,
  type Indicateur,
  type IndicateurCommon,
  type IndicateurNatureFields,
  type IndicateurPersoNatureFields,
  type IndicateurPredefini,
  type IndicateurPredefiniNatureFields,
  isIndicateurPerso,
  isIndicateurPredefini,
  toIndicateur,
} from '@tet/domain/indicateurs';

export type IndicateurRow = IndicateurCommon & IndicateurNatureFields;

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

export const withPredefiniOrThrow = <
  T extends IndicateurNatureFields & { id: number }
>(
  row: T
): T & IndicateurPredefiniNatureFields => {
  if (isIndicateurPredefini(row)) {
    return row;
  }
  throw new Error(
    `Indicateur ${row.id} : un indicateur de la plateforme doit être prédéfini`
  );
};

export const toIndicateurOrThrow = (definition: IndicateurRow): Indicateur => {
  const result = toIndicateur(definition);
  if (!result.success) {
    throw new Error(
      `Indicateur ${definition.id} : nature incohérente (${result.error})`
    );
  }
  return result.data;
};

export const toIndicateursOrThrow = (
  definitions: readonly IndicateurRow[]
): Indicateur[] =>
  definitions.map((definition) => toIndicateurOrThrow(definition));

export const toIndicateurPredefiniOrThrow = (
  definition: IndicateurRow
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
  definitions: readonly IndicateurRow[]
): IndicateurPredefini[] =>
  definitions.map((definition) => toIndicateurPredefiniOrThrow(definition));
