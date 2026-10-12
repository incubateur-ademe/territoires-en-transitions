import { metaHelper, Table, tableFeatures } from '@tanstack/react-table';
import { IndicateurTableRow, PcaetIndicateurValeurType } from './types';

export type IndicateurValeursTableMeta = {
  onReferenceYearChange?: (year: number) => void;
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
  setIndicateurApplicable: ({
    indicateurId,
    isApplicable,
  }: {
    indicateurId: number;
    isApplicable: boolean;
  }) => Promise<boolean>;
};

export type IndicateurValeursColumnMeta = {
  year: number;
  indicateurValeurType: PcaetIndicateurValeurType;
};

export const indicateurValeursTableFeatures = tableFeatures({
  tableMeta: metaHelper<IndicateurValeursTableMeta>(),
  columnMeta: metaHelper<IndicateurValeursColumnMeta>(),
});

export type IndicateurValeursTableFeatures =
  typeof indicateurValeursTableFeatures;

export const getTableMeta = (
  table: Table<IndicateurValeursTableFeatures, IndicateurTableRow>
): IndicateurValeursTableMeta => {
  const meta = table.options.meta;
  if (meta === undefined) {
    throw new Error('Indicateur valeurs table meta is not valid');
  }
  return meta;
};
