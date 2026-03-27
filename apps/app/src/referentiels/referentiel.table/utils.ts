import { Column, Table, TableMeta } from '@tanstack/react-table';
import {
  ActionType,
  ActionTypeEnum,
  ReferentielException,
  ReferentielId,
} from '@tet/domain/referentiels';
import { cn } from '@tet/ui';
import { CSSProperties } from 'react';
import { ActionListItem } from '../actions/use-list-actions';

type ColumnPinningOptions = {
  /** L’entête doit passer au-dessus des cellules du corps si les deux sont sticky. */
  variant?: 'header' | 'body';
};

export type ColumnPinningCellProps = {
  className: string;
  /** `left` et `width` viennent de TanStack Table (pixels dynamiques) — pas de classes Tailwind stables. */
  style: CSSProperties;
};

/**
 * Colonne pinnée : classes Tailwind + style minimal pour les valeurs calculées (`left`, `largeur`).
 *
 * Les `<td>` / `<th>` suivants dans la même ligne sont peints après la première colonne dans
 * l’ordre du DOM ; un `z-index` élevé sur la cellule sticky évite qu’ils la recouvrent au scroll.
 */
export const getColumnPinningStyles = (
  column: Column<ActionListItem>,
  actionType?: ActionType,
  options?: ColumnPinningOptions
): ColumnPinningCellProps => {
  const isPinned = column.getIsPinned();
  const zClass = isPinned
    ? options?.variant === 'header'
      ? 'z-30'
      : 'z-10'
    : 'z-0';

  const bgClass =
    isPinned && actionType ? BACKGROUND_COLORS_BY_ACTION_TYPE[actionType] : '';

  return {
    className: cn(isPinned ? 'sticky' : 'relative', zClass, bgClass),
    style: {
      width: column.getSize(),
      ...(isPinned === 'left' ? { left: `${column.getStart('left')}px` } : {}),
    },
  };
};

export function getRowPinningStyles(): CSSProperties {
  return {
    // opacity: isPinned ? 0.95 : 1,
    position: 'sticky',
    zIndex: 1,
    top: '10px',
  };
}

const isTableMetaValid = (
  meta?: TableMeta<ActionListItem>
): meta is { collectiviteId: number; referentielId: ReferentielId } => {
  return (
    meta !== undefined && 'collectiviteId' in meta && 'referentielId' in meta
  );
};

export const getTableMeta = (
  table: Table<ActionListItem>
): { collectiviteId: number; referentielId: ReferentielId } => {
  const meta = table.options.meta;
  if (!isTableMetaValid(meta)) {
    throw new ReferentielException('Table meta is not valid');
  }
  return meta;
};

const BACKGROUND_COLORS_BY_ACTION_TYPE: Record<ActionType, string> = {
  [ActionTypeEnum.AXE]: 'bg-primary-9',
  [ActionTypeEnum.SOUS_AXE]: 'bg-primary-8',
  [ActionTypeEnum.ACTION]: 'bg-primary-1',
  [ActionTypeEnum.SOUS_ACTION]: 'bg-white',
  [ActionTypeEnum.TACHE]: 'bg-white',
  [ActionTypeEnum.REFERENTIEL]: '',
  [ActionTypeEnum.EXEMPLE]: '',
};

export const rowClassNameByActionTypeToClassName: Record<ActionType, string> = {
  [ActionTypeEnum.AXE]:
    '!bg-primary-9 font-medium text-white [&_td]:border-b [&_td]:border-r [&_td]:border-primary-10 [&_td]:last:border-r-0',
  [ActionTypeEnum.SOUS_AXE]:
    '!bg-primary-8 font-medium text-white [&_td]:border-b [&_td]:border-r [&_td]:last:border-r-0 [&_td]:border-primary-10',
  [ActionTypeEnum.ACTION]:
    '!bg-primary-1 text-primary-9 [&_td]:border-r [&_td]:border-r-primary-10 [&_td]:last:border-r-0 [&_td]:border-b [&_td]:border-b-grey-3 ',
  [ActionTypeEnum.SOUS_ACTION]:
    '!bg-white text-primary-9 [&_td]:border-r [&_td]:border-r-primary-10 [&_td]:last:border-r-0 [&_td]:border-b [&_td]:border-b-grey-3 ',
  [ActionTypeEnum.TACHE]:
    '!bg-white text-primary-9 [&_td]:border-r [&_td]:border-r-primary-10 [&_td]:last:border-r-0 [&_td]:border-b [&_td]:border-b-grey-3 ',
  [ActionTypeEnum.REFERENTIEL]: '',
  [ActionTypeEnum.EXEMPLE]: '',
};
