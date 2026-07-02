import { IndicateurValeurWithoutReferenceType } from '@tet/domain/indicateurs';

export const yearOf = (dateValeur: string): number =>
  Number(dateValeur.slice(0, 4));

export const isFieldAllowedForYear = ({
  field,
  year,
  currentYear,
}: {
  field: IndicateurValeurWithoutReferenceType;
  year: number;
  currentYear: number;
}): boolean => field === 'objectif' || year <= currentYear;
