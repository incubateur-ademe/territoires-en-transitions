import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import {
  getIncoherentNatureError,
  type IndicateurNatureFields,
  type IndicateurPersoNatureFields,
  type IndicateurPredefiniNatureFields,
  isIndicateurPerso,
  isIndicateurPredefini,
} from '@tet/domain/indicateurs';

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
  const nature = validateNature(row);
  if (!nature.success) {
    return nature;
  }
  if (!isIndicateurPredefini(nature.data)) {
    return toNatureFailure(
      `Indicateur ${row.id} : un indicateur de la plateforme doit être prédéfini`
    );
  }
  return success(nature.data);
};

export const validatePredefinis = <
  T extends IndicateurNatureFields & { id: number }
>(
  rows: readonly T[]
): NatureValidation<(T & IndicateurPredefiniNatureFields)[]> =>
  combineResults(rows.map((row) => validatePredefini(row)));
