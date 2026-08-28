import { Table, TableMeta } from '@tanstack/react-table';
import { IndicateurTableRow } from './types';

export type IndicateurValeursTableMeta = {
  onReferenceYearChange: (year: number) => void;
  updateIndicateurValeurs: ({
    indicateurId,
    year,
    field,
    value,
  }: {
    indicateurId: number;
    year: number;
    field: 'resultat' | 'objectif';
    value: number | null;
  }) => Promise<boolean>;
};

const isTableMetaValid = (
  meta?: TableMeta<IndicateurTableRow>
): meta is IndicateurValeursTableMeta => {
  if (meta === undefined) {
    return false;
  }

  if (
    'onReferenceYearChange' in meta &&
    meta.onReferenceYearChange !== undefined &&
    typeof meta.onReferenceYearChange !== 'function'
  ) {
    return false;
  }

  if (
    'updateIndicateurValeurs' in meta &&
    meta.updateIndicateurValeurs !== undefined &&
    typeof meta.updateIndicateurValeurs !== 'function'
  ) {
    return false;
  }

  return true;
};

export const getTableMeta = (
  table: Table<IndicateurTableRow>
): IndicateurValeursTableMeta => {
  const meta = table.options.meta;
  if (!isTableMetaValid(meta)) {
    throw new Error('Indicateur valeurs table meta is not valid');
  }
  return meta;
};
