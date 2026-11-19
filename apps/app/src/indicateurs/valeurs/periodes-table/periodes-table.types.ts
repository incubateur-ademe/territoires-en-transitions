import type { IndicateurPeriode } from '@tet/domain/indicateurs';
import type { ReactNode } from 'react';
import type { IndicateurValeurField } from '../grid/types';

export type PeriodeTableValeursCell = Readonly<{
  kind: 'valeurs';
  resultat: number | null;
  objectif: number | null;
  isReadonly: boolean;
  emptyLabel: string;
  dataSource: string;
}>;

export type PeriodeTableContentCell = Readonly<{
  kind: 'contenu';
  content: ReactNode;
  isBold: boolean;
}>;

export type PeriodeTableCell =
  | PeriodeTableValeursCell
  | PeriodeTableContentCell;

export type PeriodeTableRow = Readonly<{
  key: string;
  title: ReactNode;
  cellOf: (periode: IndicateurPeriode) => PeriodeTableCell;
  onSave: (
    periode: IndicateurPeriode,
    field: IndicateurValeurField,
    value: number | null
  ) => Promise<boolean>;
}>;

export type PeriodeTableCommentaires = Readonly<{
  isReadonly: boolean;
  countOf: (periode: IndicateurPeriode) => number;
  canComment: (periode: IndicateurPeriode) => boolean;
  onComment: (periode: IndicateurPeriode) => void;
}>;
