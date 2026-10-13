import { metaHelper, Table, tableFeatures } from '@tanstack/react-table';
import { IndicateurPeriode } from '@tet/domain/indicateurs';
import { IndicateurTableRow, IndicateurValeurField } from './types';

export type IndicateurValeursTableMeta = {
  updateIndicateurValeurs: ({
    indicateurId,
    periode,
    field,
    value,
  }: {
    indicateurId: number;
    periode: IndicateurPeriode;
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
  periode: IndicateurPeriode | null;
  indicateurValeurType: IndicateurValeurField;
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
