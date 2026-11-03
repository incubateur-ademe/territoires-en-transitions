import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
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

type NatureValidation<Data> = Result<Data, 'DATABASE_ERROR'>;

const toNatureFailure = (message: string): NatureValidation<never> =>
  failure('DATABASE_ERROR', new Error(message));

export const validateNature = <
  T extends IndicateurNatureFields & { id: number }
>(
  row: T
): NatureValidation<
  (T & IndicateurPersoNatureFields) | (T & IndicateurPredefiniNatureFields)
> => {
  if (isIndicateurPerso(row) || isIndicateurPredefini(row)) {
    return success(row);
  }
  return toNatureFailure(
    `Indicateur ${row.id} : nature incohérente (${getIncoherentNatureError(
      row
    )})`
  );
};

export const validateNatures = <
  T extends IndicateurNatureFields & { id: number }
>(
  rows: readonly T[]
): NatureValidation<
  ((T & IndicateurPersoNatureFields) | (T & IndicateurPredefiniNatureFields))[]
> => combineResults(rows.map((row) => validateNature(row)));

export const validatePredefini = <
  T extends IndicateurNatureFields & { id: number }
>(
  row: T
): NatureValidation<T & IndicateurPredefiniNatureFields> => {
  if (isIndicateurPredefini(row)) {
    return success(row);
  }
  return toNatureFailure(
    `Indicateur ${row.id} : un indicateur de la plateforme doit être prédéfini`
  );
};

export const validatePredefinis = <
  T extends IndicateurNatureFields & { id: number }
>(
  rows: readonly T[]
): NatureValidation<(T & IndicateurPredefiniNatureFields)[]> =>
  combineResults(rows.map((row) => validatePredefini(row)));

export const validateIndicateur = (
  row: IndicateurRow
): NatureValidation<Indicateur> => {
  const result = toIndicateur(row);
  if (!result.success) {
    return toNatureFailure(
      `Indicateur ${row.id} : nature incohérente (${result.error})`
    );
  }
  return success(result.data);
};

export const validateIndicateurs = (
  rows: readonly IndicateurRow[]
): NatureValidation<Indicateur[]> =>
  combineResults(rows.map((row) => validateIndicateur(row)));

export const validateIndicateurPredefini = (
  row: IndicateurRow
): NatureValidation<IndicateurPredefini> => {
  const indicateur = validateIndicateur(row);
  if (!indicateur.success) {
    return indicateur;
  }
  if (!isIndicateurPredefini(indicateur.data)) {
    return toNatureFailure(
      `Indicateur ${row.id} : un indicateur de la plateforme doit être prédéfini`
    );
  }
  return success(indicateur.data);
};

export const validateIndicateursPredefinis = (
  rows: readonly IndicateurRow[]
): NatureValidation<IndicateurPredefini[]> =>
  combineResults(rows.map((row) => validateIndicateurPredefini(row)));
