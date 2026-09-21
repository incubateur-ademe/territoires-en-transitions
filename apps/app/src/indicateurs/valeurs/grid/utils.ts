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
  setIndicateurApplicable: ({
    indicateurId,
    isApplicable,
  }: {
    indicateurId: number;
    isApplicable: boolean;
  }) => Promise<boolean>;
  /**
   * Vrai le temps de l'aller-retour serveur (invalidation comprise), pendant
   * lequel les lignes portent encore l'ancienne applicabilité.
   */
  isSettingIndicateurApplicable: boolean;
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

  if (
    'setIndicateurApplicable' in meta &&
    meta.setIndicateurApplicable !== undefined &&
    typeof meta.setIndicateurApplicable !== 'function'
  ) {
    return false;
  }

  if (
    'isSettingIndicateurApplicable' in meta &&
    meta.isSettingIndicateurApplicable !== undefined &&
    typeof meta.isSettingIndicateurApplicable !== 'boolean'
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
