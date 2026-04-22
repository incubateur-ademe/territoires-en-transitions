import { FicheListItem } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { Table, TableMeta } from '@tanstack/react-table';
import {
  ActionId,
  ActionType,
  ActionTypeEnum,
  ReferentielException,
  ReferentielId,
} from '@tet/domain/referentiels';
import { DiscussionListItem } from '../actions/comments/hooks/use-list-discussions';
import { ActionListItem } from '../actions/use-list-actions';

const isTableMetaValid = (
  meta?: TableMeta<ActionListItem>
): meta is { collectiviteId: number; referentielId: ReferentielId } => {
  return (
    meta !== undefined && 'collectiviteId' in meta && 'referentielId' in meta
  );
};

export type ReferentielTableMeta = {
  collectiviteId: number;
  referentielId: ReferentielId;
  commentsByActionId?: Partial<Record<ActionId, DiscussionListItem[]>>;
  fichesByActionId?: Partial<Record<ActionId, FicheListItem[]>>;
};

export const getTableMeta = (
  table: Table<ActionListItem>
): ReferentielTableMeta => {
  const meta = table.options.meta;
  if (!isTableMetaValid(meta)) {
    throw new ReferentielException('Table meta is not valid');
  }
  return meta;
};

export const rowClassNameByActionType: Record<ActionType, string> = {
  [ActionTypeEnum.AXE]:
    '!bg-primary-9 font-medium text-white [&_td]:border-b  [&_td]:border-primary-10 ',
  [ActionTypeEnum.SOUS_AXE]:
    '!bg-primary-8 font-medium text-white [&_td]:border-b  [&_td]:border-primary-10',
  [ActionTypeEnum.ACTION]:
    '!bg-primary-1 text-primary-9  [&_td]:border-b [&_td]:border-b-grey-3 ',
  [ActionTypeEnum.SOUS_ACTION]:
    '!bg-white text-primary-9 [&_td]:border-b [&_td]:border-b-grey-3 ',
  [ActionTypeEnum.TACHE]:
    '!bg-white text-primary-9 [&_td]:border-b [&_td]:border-b-grey-3 ',
  [ActionTypeEnum.REFERENTIEL]: '',
  [ActionTypeEnum.EXEMPLE]: '',
};
